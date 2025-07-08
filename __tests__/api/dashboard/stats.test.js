// OneFoodDialer - Dashboard Stats API Tests
import { createMocks } from 'node-mocks-http';
import handler from '../../../src/pages/api/dashboard/stats.js';

// Mock the auth middleware
jest.mock('../../../src/lib/auth', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'BUSINESS_OWNER',
    businessId: 'test-business-id',
  }),
}));

const { requireAuth } = require('../../../src/lib/auth');

describe('/api/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current time for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-08T14:30:00Z')); // Peak hours
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics with default range', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalCustomers');
      expect(data.data).toHaveProperty('totalRevenue');
      expect(data.data).toHaveProperty('activeOrders');
      expect(data.data).toHaveProperty('activeSubscriptions');
      expect(data.data).toHaveProperty('walletBalance');
      expect(data.data).toHaveProperty('ordersToday');
      expect(data.data).toHaveProperty('averageOrderValue');
      expect(data.data).toHaveProperty('customerSatisfaction');
      expect(data.data).toHaveProperty('kitchenUtilization');
      expect(data.data).toHaveProperty('lastUpdated');
      expect(data.data).toHaveProperty('range');

      // Verify default range
      expect(data.data.range).toBe('7d');
    });

    it('should accept different time ranges', async () => {
      const ranges = ['7d', '30d', '90d', '1y'];

      for (const range of ranges) {
        const { req, res } = createMocks({
          method: 'GET',
          query: { range },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.data.range).toBe(range);
      }
    });

    it('should return higher values during peak hours', async () => {
      // Test during peak hours (14:30)
      const { req: peakReq, res: peakRes } = createMocks({
        method: 'GET',
      });

      await handler(peakReq, peakRes);
      const peakData = JSON.parse(peakRes._getData());

      // Test during non-peak hours
      jest.setSystemTime(new Date('2025-07-08T03:30:00Z')); // Off hours

      const { req: offReq, res: offRes } = createMocks({
        method: 'GET',
      });

      await handler(offReq, offRes);
      const offData = JSON.parse(offRes._getData());

      // Active orders should be higher during peak hours
      expect(parseInt(peakData.data.activeOrders.value)).toBeGreaterThan(
        parseInt(offData.data.activeOrders.value)
      );
    });

    it('should return realistic business metrics', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      const stats = data.data;

      // Verify data types and ranges
      expect(typeof stats.totalCustomers.value).toBe('number');
      expect(stats.totalCustomers.value).toBeGreaterThan(1200);
      expect(stats.totalCustomers.value).toBeLessThan(1500);

      expect(stats.totalRevenue.value).toMatch(/^₹[\d,]+$/);
      expect(stats.activeOrders.value).toBeGreaterThan(0);
      expect(stats.activeSubscriptions.value).toBeGreaterThan(500);

      // Verify trend values are percentages
      expect(stats.totalCustomers.trendValue).toMatch(/^\d+\.\d%$/);
      expect(['up', 'down']).toContain(stats.totalCustomers.trend);

      // Verify descriptions are present
      expect(stats.totalCustomers.description).toBe('Active customers this period');
      expect(stats.ordersToday.description).toBe('Orders placed today');
    });

    it('should include timestamp for real-time updates', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());

      expect(data.data.lastUpdated).toBeDefined();
      expect(new Date(data.data.lastUpdated)).toBeInstanceOf(Date);

      // Should be recent timestamp
      const lastUpdated = new Date(data.data.lastUpdated);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - lastUpdated.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should handle business hours logic correctly', async () => {
      // Test during business hours
      jest.setSystemTime(new Date('2025-07-08T15:00:00Z')); // 3 PM

      const { req: businessReq, res: businessRes } = createMocks({
        method: 'GET',
      });

      await handler(businessReq, businessRes);
      const businessData = JSON.parse(businessRes._getData());

      // Test during off hours
      jest.setSystemTime(new Date('2025-07-08T02:00:00Z')); // 2 AM

      const { req: offReq, res: offRes } = createMocks({
        method: 'GET',
      });

      await handler(offReq, offRes);
      const offData = JSON.parse(offRes._getData());

      // Orders today should be higher during business hours
      expect(parseInt(businessData.data.ordersToday.value)).toBeGreaterThan(
        parseInt(offData.data.ordersToday.value)
      );

      // Orders today trend should be 'up' during business hours
      expect(businessData.data.ordersToday.trend).toBe('up');
      expect(offData.data.ordersToday.trend).toBe('down');
    });

    it('should return consistent data structure', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      const stats = data.data;

      // Verify each metric has required properties
      const requiredMetrics = [
        'totalCustomers',
        'totalRevenue',
        'activeOrders',
        'activeSubscriptions',
        'walletBalance',
        'ordersToday',
        'averageOrderValue',
        'customerSatisfaction',
        'kitchenUtilization',
      ];

      requiredMetrics.forEach(metric => {
        expect(stats[metric]).toHaveProperty('value');
        expect(stats[metric]).toHaveProperty('trend');
        expect(stats[metric]).toHaveProperty('trendValue');
        expect(stats[metric]).toHaveProperty('change');
        expect(stats[metric]).toHaveProperty('description');
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

    it('should handle invalid range parameter gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { range: 'invalid' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      // Should default to 7d for invalid range
      expect(data.data.range).toBe('7d');
    });

    it('should handle server errors gracefully', async () => {
      // Mock a server error
      requireAuth.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.message).toBe('Failed to fetch dashboard statistics');
    });
  });

  describe('Unsupported HTTP methods', () => {
    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Method POST not allowed');
    });

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Method PUT not allowed');
    });

    it('should return 405 for DELETE method', async () => {
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
