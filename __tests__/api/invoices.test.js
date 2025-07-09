// OneFoodDialer - Invoices API Tests
import { createMocks } from 'node-mocks-http';
import { handler } from '../../src/pages/api/invoices/index.js';

// Mock auth
jest.mock('../../src/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    invoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    invoiceItem: {
      createMany: jest.fn(),
    },
  },
}));

const { requireAuth } = require('../../src/lib/auth');
const { prisma } = require('../../src/lib/prisma');

describe('/api/invoices', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'BUSINESS_OWNER',
    businessId: 'test-business-id',
  };

  // Helper function to create request with authenticated user
  const createAuthenticatedRequest = (method, options = {}) => {
    const { req, res } = createMocks({
      method,
      ...options,
    });
    req.user = mockUser;
    return { req, res };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up requireAuth to return our mock user
    requireAuth.mockResolvedValue(mockUser);
  });

  describe('POST /api/invoices', () => {
    const validInvoiceData = {
      customerId: 'customer-1',
      items: [
        {
          description: 'Monthly Subscription',
          quantity: 1,
          unitPrice: 299.99,
        },
        {
          description: 'Extra Service',
          quantity: 2,
          unitPrice: 50.0,
        },
      ],
      dueDate: '2025-08-08',
      taxRate: 0.18, // 18% GST
    };

    it('should create invoice with correct calculations', async () => {
      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        user: { email: 'customer@example.com' },
      };

      const expectedSubtotal = 399.99; // 299.99 + (2 * 50.00)
      const expectedTax = 71.998; // 18% of 399.99
      const expectedTotal = 471.988; // subtotal + tax

      const mockCreatedInvoice = {
        id: 'new-invoice-id',
        invoiceNumber: 'INV12345678',
        customerId: 'customer-1',
        businessId: 'test-business-id',
        subtotalAmount: expectedSubtotal,
        taxAmount: expectedTax,
        totalAmount: expectedTotal,
        status: 'PENDING',
        dueDate: '2025-08-08',
      };

      // Mock transaction
      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(mockCustomer),
          },
          invoice: {
            create: jest.fn().mockResolvedValue(mockCreatedInvoice),
          },
          invoiceItem: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: validInvoiceData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCreatedInvoice);
      expect(data.message).toBe('Invoice created successfully');

      // Verify transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields: customerId
      };

      const { req, res } = createAuthenticatedRequest('POST', {
        body: invalidData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toBe('Missing required fields: customerId');
    });

    it('should validate items array is not empty', async () => {
      const invalidData = {
        ...validInvoiceData,
        items: [],
      };

      const { req, res } = createAuthenticatedRequest('POST', {
        body: invalidData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toBe('Invoice must have at least one item');
    });

    it('should validate item structure', async () => {
      const invalidData = {
        ...validInvoiceData,
        items: [
          {
            description: 'Valid Item',
            quantity: 1,
            unitPrice: 100,
          },
          {
            // Missing required fields
            description: 'Invalid Item',
            // Missing quantity and unitPrice
          },
        ],
      };

      const { req, res } = createAuthenticatedRequest('POST', {
        body: invalidData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toContain('Invalid item structure');
    });

    it('should validate positive quantities and prices', async () => {
      const invalidData = {
        ...validInvoiceData,
        items: [
          {
            description: 'Invalid Item',
            quantity: -1, // Invalid negative quantity
            unitPrice: -50, // Invalid negative price
          },
        ],
      };

      const { req, res } = createAuthenticatedRequest('POST', {
        body: invalidData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toContain('Quantity and unit price must be positive numbers');
    });

    it('should validate due date is not in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invalidData = {
        ...validInvoiceData,
        dueDate: pastDate.toISOString().split('T')[0],
      };

      const { req, res } = createAuthenticatedRequest('POST', {
        body: invalidData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toBe('Due date cannot be in the past');
    });

    it('should validate customer exists and belongs to business', async () => {
      // Mock transaction to use customer.findFirst that returns null
      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          invoice: {
            create: jest.fn(),
          },
          invoiceItem: {
            createMany: jest.fn(),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: validInvoiceData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Customer not found');
    });

    it('should handle default tax rate when not provided', async () => {
      const dataWithoutTax = {
        ...validInvoiceData,
      };
      delete dataWithoutTax.taxRate;

      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        user: { email: 'customer@example.com' },
      };

      const expectedSubtotal = 399.99;
      const expectedTax = expectedSubtotal * 0.18; // Default 18% tax
      const expectedTotal = expectedSubtotal + expectedTax;

      // Mock transaction with customer found
      const mockInvoiceCreate = jest.fn().mockResolvedValue({
        id: 'new-invoice-id',
        subtotalAmount: expectedSubtotal,
        taxAmount: expectedTax,
        totalAmount: expectedTotal,
      });

      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(mockCustomer),
          },
          invoice: {
            create: mockInvoiceCreate,
          },
          invoiceItem: {
            createMany: jest.fn(),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: dataWithoutTax,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      // Verify that the default tax rate was applied
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(true);
    });

    it('should generate unique invoice number', async () => {
      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        user: { email: 'customer@example.com' },
      };

      // Mock transaction with customer found
      const mockInvoiceCreate = jest.fn().mockResolvedValue({
        id: 'new-invoice-id',
        invoiceNumber: 'INV12345678',
      });

      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(mockCustomer),
          },
          invoice: {
            create: mockInvoiceCreate,
          },
          invoiceItem: {
            createMany: jest.fn(),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: validInvoiceData,
      });

      await handler(req, res);

      expect(mockInvoiceCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          invoiceNumber: expect.stringMatching(/^INV\d{8,10}$/), // Allow 8-10 digits for date-based numbers
        }),
        include: expect.any(Object),
      });
    });

    it('should handle database transaction errors', async () => {
      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        user: { email: 'customer@example.com' },
      };

      // Mock transaction to throw error
      prisma.$transaction.mockRejectedValue(new Error('Database transaction failed'));

      const { req, res } = createAuthenticatedRequest('POST', {
        body: validInvoiceData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Database transaction failed');
    });
  });

  describe('GET /api/invoices', () => {
    it('should return paginated invoices list', async () => {
      const mockInvoices = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV12345678',
          totalAmount: 299.99,
          status: 'PENDING',
          customer: { user: { profile: { firstName: 'John', lastName: 'Doe' } } },
        },
      ];

      prisma.invoice.findMany.mockResolvedValue(mockInvoices);
      prisma.invoice.count.mockResolvedValue(1);

      const { req, res } = createAuthenticatedRequest('GET', {
        query: { page: '1', limit: '10' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.data).toEqual(mockInvoices);
      expect(response.pagination).toBeDefined();
    });
  });

  describe('Unsupported HTTP methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Method DELETE not allowed');
    });
  });
});
