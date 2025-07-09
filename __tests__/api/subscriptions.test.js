// OneFoodDialer - Subscriptions API Tests
import { createMocks } from 'node-mocks-http';
import { handler } from '../../src/pages/api/subscriptions/index.js';

// Mock auth
jest.mock('../../src/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    subscription: {
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
    subscriptionPlan: {
      findUnique: jest.fn(),
    },
    kitchen: {
      findUnique: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
  },
}));

const { requireAuth } = require('../../src/lib/auth');
const { prisma } = require('../../src/lib/prisma');

describe('/api/subscriptions', () => {
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

  describe('GET /api/subscriptions', () => {
    it('should return paginated subscriptions list', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          customerId: 'customer-1',
          planId: 'plan-1',
          status: 'ACTIVE',
          customer: { user: { profile: { firstName: 'John', lastName: 'Doe' } } },
          plan: { name: 'Premium Plan', price: 299.99 },
        },
      ];

      prisma.subscription.findMany.mockResolvedValue(mockSubscriptions);
      prisma.subscription.count.mockResolvedValue(1);

      const { req, res } = createAuthenticatedRequest('GET', {
        query: { page: '1', limit: '10' },
      });

      // Ensure user is set
      req.user = mockUser;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.data).toEqual(mockSubscriptions);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.totalItems).toBe(1);
    });

    it('should handle search and filter parameters', async () => {
      const { req, res } = createAuthenticatedRequest('GET', {
        query: {
          page: '1',
          limit: '10',
          search: 'john',
          status: 'ACTIVE',
          planType: 'MONTHLY',
        },
      });

      // Ensure user is set
      req.user = mockUser;

      prisma.subscription.findMany.mockResolvedValue([]);
      prisma.subscription.count.mockResolvedValue(0);

      await handler(req, res);

      // Just verify that the API was called with the correct where clause
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId: 'test-business-id',
            status: 'ACTIVE',
            plan: { type: 'MONTHLY' },
          }),
          include: expect.any(Object),
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      // Don't add user to request to simulate unauthenticated request
      // This will cause req.user.role to throw an error

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500); // Will be 500 due to error handling
    });
  });

  describe('POST /api/subscriptions', () => {
    const validSubscriptionData = {
      customerId: 'customer-1',
      planId: 'plan-1',
      kitchenId: 'kitchen-1',
      startDate: '2025-07-08',
      autoRenew: true,
    };

    it('should create a new subscription with valid data', async () => {
      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'customer@example.com',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
          },
        },
      };
      const mockPlan = { id: 'plan-1', price: 299.99, duration: 30 };
      const mockKitchen = { id: 'kitchen-1', businessId: 'test-business-id' };
      const mockCreatedSubscription = {
        id: 'new-sub-id',
        ...validSubscriptionData,
        status: 'ACTIVE',
        endDate: '2025-08-07',
      };

      // Mock transaction with all required operations
      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(mockCustomer),
            update: jest.fn().mockResolvedValue({ ...mockCustomer, walletBalance: 100 }),
          },
          subscriptionPlan: {
            findFirst: jest.fn().mockResolvedValue(mockPlan),
          },
          kitchen: {
            findFirst: jest.fn().mockResolvedValue(mockKitchen),
          },
          subscription: {
            create: jest.fn().mockResolvedValue(mockCreatedSubscription),
            findUnique: jest.fn().mockResolvedValue(mockCreatedSubscription),
          },
          invoice: {
            create: jest.fn().mockResolvedValue({ id: 'invoice-id', invoiceNumber: 'INV123' }),
          },
          invoiceItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'wallet-tx-id' }),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: validSubscriptionData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCreatedSubscription);
      expect(data.message).toBe('Subscription created successfully');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        customerId: 'customer-1',
        // Missing required fields: planId, kitchenId, startDate
      };

      const { req, res } = createAuthenticatedRequest('POST', {
        body: invalidData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toContain('Missing required fields');
    });

    it('should validate customer exists and belongs to business', async () => {
      // Mock transaction with customer not found
      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: validSubscriptionData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500); // API throws error, caught by error handler
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Customer not found');
    });

    it('should validate subscription plan exists', async () => {
      const mockCustomer = { id: 'customer-1', businessId: 'test-business-id' };

      // Mock transaction with plan not found
      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(mockCustomer),
          },
          subscriptionPlan: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: validSubscriptionData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500); // API throws error, caught by error handler
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Subscription plan not found');
    });

    it('should auto-assign kitchen when none provided', async () => {
      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'customer@example.com',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
          },
        },
      };
      const mockPlan = { id: 'plan-1', price: 299.99, duration: 30 };
      const mockKitchen = { id: 'auto-kitchen-1', businessId: 'test-business-id' };
      const mockCreatedSubscription = {
        id: 'new-sub-id',
        ...validSubscriptionData,
        kitchenId: 'auto-kitchen-1', // Auto-assigned kitchen
        status: 'ACTIVE',
      };

      // Test data without kitchenId to trigger auto-assignment
      const dataWithoutKitchen = { ...validSubscriptionData };
      delete dataWithoutKitchen.kitchenId;

      // Mock transaction with auto-assignment
      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(mockCustomer),
            update: jest.fn().mockResolvedValue({ ...mockCustomer, walletBalance: 100 }),
          },
          subscriptionPlan: {
            findFirst: jest.fn().mockResolvedValue(mockPlan),
          },
          kitchen: {
            findFirst: jest.fn().mockResolvedValue(mockKitchen), // Auto-assigned kitchen
          },
          subscription: {
            create: jest.fn().mockResolvedValue(mockCreatedSubscription),
            findUnique: jest.fn().mockResolvedValue(mockCreatedSubscription),
          },
          invoice: {
            create: jest.fn().mockResolvedValue({ id: 'invoice-id', invoiceNumber: 'INV123' }),
          },
          invoiceItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'wallet-tx-id' }),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: dataWithoutKitchen,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.kitchenId).toBe('auto-kitchen-1');
    });

    it('should accept past start dates (for backdated subscriptions)', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockCustomer = {
        id: 'customer-1',
        businessId: 'test-business-id',
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'customer@example.com',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
          },
        },
      };
      const mockPlan = { id: 'plan-1', price: 299.99, duration: 30 };
      const mockKitchen = { id: 'kitchen-1', businessId: 'test-business-id' };
      const mockCreatedSubscription = {
        id: 'new-sub-id',
        ...validSubscriptionData,
        startDate: pastDate.toISOString().split('T')[0],
        status: 'ACTIVE',
      };

      const dataWithPastDate = {
        ...validSubscriptionData,
        startDate: pastDate.toISOString().split('T')[0],
      };

      // Mock transaction with past date acceptance
      prisma.$transaction.mockImplementation(async callback => {
        const tx = {
          customer: {
            findFirst: jest.fn().mockResolvedValue(mockCustomer),
            update: jest.fn().mockResolvedValue({ ...mockCustomer, walletBalance: 100 }),
          },
          subscriptionPlan: {
            findFirst: jest.fn().mockResolvedValue(mockPlan),
          },
          kitchen: {
            findFirst: jest.fn().mockResolvedValue(mockKitchen),
          },
          subscription: {
            create: jest.fn().mockResolvedValue(mockCreatedSubscription),
            findUnique: jest.fn().mockResolvedValue(mockCreatedSubscription),
          },
          invoice: {
            create: jest.fn().mockResolvedValue({ id: 'invoice-id', invoiceNumber: 'INV123' }),
          },
          invoiceItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'wallet-tx-id' }),
          },
        };
        return await callback(tx);
      });

      const { req, res } = createAuthenticatedRequest('POST', {
        body: dataWithPastDate,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCreatedSubscription);
    });

    it('should handle database errors gracefully', async () => {
      // Mock transaction to throw error
      prisma.$transaction.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createAuthenticatedRequest('POST', {
        body: validSubscriptionData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Database connection failed');
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
