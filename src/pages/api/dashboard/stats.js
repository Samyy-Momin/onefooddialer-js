// OneFoodDialer - Real-time Dashboard Stats API
import { requireAuth } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { range = "7d" } = req.query;

    // Calculate date range
    const now = new Date();
    let fromDate = new Date();

    switch (range) {
      case "7d":
        fromDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        fromDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        fromDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        fromDate.setDate(now.getDate() - 7);
    }

    // Generate realistic real-time data with business logic
    const baseTime = new Date();
    const hour = baseTime.getHours();
    const isBusinessHours = hour >= 9 && hour <= 22;
    const isPeakHours =
      (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);

    // Simulate realistic business patterns
    const peakMultiplier = isPeakHours ? 1.5 : isBusinessHours ? 1.0 : 0.3;

    const stats = {
      totalCustomers: {
        value: Math.floor(Math.random() * 200 + 1200),
        trend: Math.random() > 0.3 ? "up" : "down",
        trendValue: `${(Math.random() * 15 + 2).toFixed(1)}%`,
        change: Math.floor(Math.random() * 30) + 5,
        description: "Active customers this period",
      },
      totalRevenue: {
        value: `₹${(Math.random() * 200000 + 450000).toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`,
        trend: Math.random() > 0.2 ? "up" : "down",
        trendValue: `${(Math.random() * 12 + 3).toFixed(1)}%`,
        change: Math.floor(Math.random() * 25000) + 15000,
        description: `Revenue for ${range} period`,
      },
      activeOrders: {
        value: Math.floor((Math.random() * 40 + 20) * peakMultiplier),
        trend: isPeakHours ? "up" : Math.random() > 0.5 ? "up" : "down",
        trendValue: `${(Math.random() * 8 + 1).toFixed(1)}%`,
        change: Math.floor(Math.random() * 15) + 3,
        description: "Orders being processed",
      },
      activeSubscriptions: {
        value: Math.floor(Math.random() * 150 + 650),
        trend: Math.random() > 0.4 ? "up" : "down",
        trendValue: `${(Math.random() * 18 + 2).toFixed(1)}%`,
        change: Math.floor(Math.random() * 50) + 10,
        description: "Active subscription plans",
      },
      walletBalance: {
        value: `₹${(Math.random() * 50000 + 75000).toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`,
        trend: Math.random() > 0.4 ? "up" : "down",
        trendValue: `${(Math.random() * 10 + 1).toFixed(1)}%`,
        change: Math.floor(Math.random() * 8000) + 2000,
        description: "Total customer wallet balance",
      },
      ordersToday: {
        value: Math.floor(
          (Math.random() * 25 + 15) * (isBusinessHours ? 1.2 : 0.8)
        ),
        trend: isBusinessHours ? "up" : "down",
        trendValue: `${(Math.random() * 12 + 2).toFixed(1)}%`,
        change: Math.floor(Math.random() * 8) + 2,
        description: "Orders placed today",
      },
      // Additional metrics
      averageOrderValue: {
        value: `₹${(Math.random() * 200 + 350).toFixed(0)}`,
        trend: Math.random() > 0.5 ? "up" : "down",
        trendValue: `${(Math.random() * 6 + 1).toFixed(1)}%`,
        change: Math.floor(Math.random() * 25) + 10,
        description: "Average order value",
      },
      customerSatisfaction: {
        value: `${(Math.random() * 5 + 92).toFixed(1)}%`,
        trend: Math.random() > 0.3 ? "up" : "down",
        trendValue: `${(Math.random() * 3 + 0.5).toFixed(1)}%`,
        change: Math.floor(Math.random() * 3) + 1,
        description: "Customer satisfaction rate",
      },
      kitchenUtilization: {
        value: `${(Math.random() * 20 + 70).toFixed(0)}%`,
        trend: isPeakHours ? "up" : Math.random() > 0.5 ? "up" : "down",
        trendValue: `${(Math.random() * 8 + 2).toFixed(1)}%`,
        change: Math.floor(Math.random() * 10) + 3,
        description: "Kitchen capacity utilization",
      },
    };

    // Add timestamp for real-time updates
    stats.lastUpdated = new Date().toISOString();
    stats.range = range;

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch dashboard statistics",
    });
  }
}

/* 
TODO: Replace with actual database queries

Example Prisma queries for real data:

const [
  totalCustomers,
  totalRevenue,
  activeOrders,
  activeSubscriptions,
  walletBalance,
  ordersToday
] = await Promise.all([
  // Total customers
  prisma.customer.count({
    where: {
      businessId: user.businessId,
      isActive: true,
    },
  }),

  // Total revenue
  prisma.invoice.aggregate({
    where: {
      businessId: user.businessId,
      status: 'PAID',
      createdAt: {
        gte: fromDate,
      },
    },
    _sum: {
      totalAmount: true,
    },
  }),

  // Active orders
  prisma.order.count({
    where: {
      businessId: user.businessId,
      status: {
        in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'],
      },
    },
  }),

  // Active subscriptions
  prisma.subscription.count({
    where: {
      businessId: user.businessId,
      status: 'ACTIVE',
    },
  }),

  // Total wallet balance
  prisma.customer.aggregate({
    where: {
      businessId: user.businessId,
      isActive: true,
    },
    _sum: {
      walletBalance: true,
    },
  }),

  // Orders today
  prisma.order.count({
    where: {
      businessId: user.businessId,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  }),
]);

*/
