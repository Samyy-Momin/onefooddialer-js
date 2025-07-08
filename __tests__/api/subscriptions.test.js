// OneFoodDialer - Subscriptions API Tests
import { createMocks } from 'node-mocks-http';
import { handler } from '../../src/pages/api/subscriptions/index.js';

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
}));

const { requireAuth } = require('../../src/lib/auth');
const prisma = require('../../src/lib/prisma');

describe('/api/subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSubscriptions);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should handle search and filter parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10',
          search: 'john',
          status: 'ACTIVE',
          planType: 'MONTHLY',
        },
      });

      prisma.subscription.findMany.mockResolvedValue([]);
      prisma.subscription.count.mockResolvedValue(0);

      await handler(req, res);

      expect(prisma.subscription.findMany).toHaveBeenCalledWith({
        where: {
          businessId: 'test-business-id',
          status: 'ACTIVE',
          plan: { type: 'MONTHLY' },
          OR: [
            {
              customer: {
                user: { profile: { firstName: { contains: 'john', mode: 'insensitive' } } },
              },
            },
            {
              customer: {
                user: { profile: { lastName: { contains: 'john', mode: 'insensitive' } } },
              },
            },
            { customer: { user: { email: { contains: 'john', mode: 'insensitive' } } } },
          ],
        },
        include: {
          customer: {
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
          plan: true,
          kitchen: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      requireAuth.mockRejectedValue(new Error('Unauthorized'));

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
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
      const mockCustomer = { id: 'customer-1', businessId: 'test-business-id' };
      const mockPlan = { id: 'plan-1', price: 299.99, duration: 30 };
      const mockKitchen = { id: 'kitchen-1', businessId: 'test-business-id' };
      const mockCreatedSubscription = {
        id: 'new-sub-id',
        ...validSubscriptionData,
        status: 'ACTIVE',
        endDate: '2025-08-07',
      };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.kitchen.findUnique.mockResolvedValue(mockKitchen);
      prisma.subscription.create.mockResolvedValue(mockCreatedSubscription);

      const { req, res } = createMocks({
        method: 'POST',
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

    it('should validate customer exists and belongs to business', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: validSubscriptionData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('Customer not found or does not belong to your business');
    });

    it('should validate subscription plan exists', async () => {
      const mockCustomer = { id: 'customer-1', businessId: 'test-business-id' };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: validSubscriptionData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('Subscription plan not found');
    });

    it('should validate kitchen exists and belongs to business', async () => {
      const mockCustomer = { id: 'customer-1', businessId: 'test-business-id' };
      const mockPlan = { id: 'plan-1', price: 299.99, duration: 30 };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.kitchen.findUnique.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: validSubscriptionData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('Kitchen not found or does not belong to your business');
    });

    it('should validate start date is not in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invalidData = {
        ...validSubscriptionData,
        startDate: pastDate.toISOString().split('T')[0],
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
      expect(data.message).toBe('Start date cannot be in the past');
    });

    it('should handle database errors gracefully', async () => {
      const mockCustomer = { id: 'customer-1', businessId: 'test-business-id' };
      const mockPlan = { id: 'plan-1', price: 299.99, duration: 30 };
      const mockKitchen = { id: 'kitchen-1', businessId: 'test-business-id' };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.kitchen.findUnique.mockResolvedValue(mockKitchen);
      prisma.subscription.create.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: validSubscriptionData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Failed to create subscription');
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
