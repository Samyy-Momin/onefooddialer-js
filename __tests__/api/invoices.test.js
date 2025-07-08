// OneFoodDialer - Invoices API Tests
import { createMocks } from 'node-mocks-http';
import { handler } from '../../src/pages/api/invoices/index.js';

// Mock the auth middleware
jest.mock('../../src/lib/auth', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'BUSINESS_OWNER',
    businessId: 'test-business-id',
  }),
}));

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
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
}));

const { requireAuth } = require('../../src/lib/auth');
const prisma = require('../../src/lib/prisma');

describe('/api/invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.invoice.create.mockResolvedValue(mockCreatedInvoice);
      prisma.invoiceItem.createMany.mockResolvedValue({ count: 2 });

      const { req, res } = createMocks({
        method: 'POST',
        body: validInvoiceData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCreatedInvoice);
      expect(data.message).toBe('Invoice created successfully');

      // Verify calculations
      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtotalAmount: expectedSubtotal,
          taxAmount: expectedTax,
          totalAmount: expectedTotal,
          invoiceNumber: expect.stringMatching(/^INV\d{8}$/),
        }),
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        customerId: 'customer-1',
        // Missing required fields: items, dueDate
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toContain('Missing required fields');
    });

    it('should validate items array is not empty', async () => {
      const invalidData = {
        ...validInvoiceData,
        items: [],
      };

      const { req, res } = createMocks({
        method: 'POST',
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

      const { req, res } = createMocks({
        method: 'POST',
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

      const { req, res } = createMocks({
        method: 'POST',
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

      const { req, res } = createMocks({
        method: 'POST',
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
      prisma.customer.findUnique.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: validInvoiceData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('Customer not found or does not belong to your business');
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

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.invoice.create.mockResolvedValue({
        id: 'new-invoice-id',
        subtotalAmount: expectedSubtotal,
        taxAmount: expectedTax,
        totalAmount: expectedTotal,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: dataWithoutTax,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taxAmount: expectedTax,
        }),
      });
    });

    it('should generate unique invoice number', async () => {
      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        user: { email: 'customer@example.com' },
      };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.invoice.create.mockResolvedValue({
        id: 'new-invoice-id',
        invoiceNumber: 'INV12345678',
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: validInvoiceData,
      });

      await handler(req, res);

      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          invoiceNumber: expect.stringMatching(/^INV\d{8}$/),
        }),
      });
    });

    it('should handle database transaction errors', async () => {
      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        user: { email: 'customer@example.com' },
      };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.invoice.create.mockRejectedValue(new Error('Database transaction failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: validInvoiceData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Failed to create invoice');
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

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockInvoices);
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
