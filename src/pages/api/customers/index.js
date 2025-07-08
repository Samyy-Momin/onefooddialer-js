// OneFoodDialer - Customer Management (CRM) API
import { prisma } from "../../../lib/prisma";
import { requireAuth, requireRole } from "../../../lib/auth";
import {
  handleApiError,
  getPaginationParams,
  createPaginationResponse,
  generateCustomerCode,
  hashPassword,
} from "../../../lib/utils";

async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case "GET":
      return getCustomers(req, res);
    case "POST":
      return createCustomer(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// Get customers with filtering and pagination
async function getCustomers(req, res) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, status, businessId, planType, loyaltyTier } = req.query;

    const where = {};

    if (businessId) where.businessId = businessId;
    if (status) where.isActive = status === "active";

    // Role-based filtering
    if (req.user.role === "BUSINESS_OWNER") {
      where.businessId = req.user.businessOwner?.[0]?.id;
    }

    // Search functionality
    if (search) {
      where.OR = [
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            profile: {
              firstName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          user: {
            profile: {
              lastName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          customerCode: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Plan type filter
    if (planType) {
      where.subscriptions = {
        some: {
          plan: {
            type: planType,
          },
          status: "ACTIVE",
        },
      };
    }

    // Loyalty tier filter
    if (loyaltyTier) {
      const tierRanges = {
        bronze: { min: 0, max: 999 },
        silver: { min: 1000, max: 4999 },
        gold: { min: 5000, max: 9999 },
        platinum: { min: 10000, max: Infinity },
      };

      const range = tierRanges[loyaltyTier.toLowerCase()];
      if (range) {
        where.loyaltyPoints = {
          gte: range.min,
          ...(range.max !== Infinity && { lte: range.max }),
        };
      }
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          business: true,
          subscriptions: {
            include: {
              plan: true,
              kitchen: true,
            },
            where: {
              status: { in: ["ACTIVE", "PAUSED"] },
            },
          },
          orders: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
          walletTransactions: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
          feedbacks: {
            take: 3,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    // Add computed fields
    const enrichedCustomers = customers.map((customer) => ({
      ...customer,
      loyaltyTier: getLoyaltyTier(customer.loyaltyPoints),
      totalOrders: customer.orders.length,
      activeSubscriptions: customer.subscriptions.filter(
        (s) => s.status === "ACTIVE"
      ).length,
      lastOrderDate: customer.orders[0]?.createdAt || null,
      averageRating:
        customer.feedbacks.length > 0
          ? customer.feedbacks.reduce((sum, f) => sum + f.rating, 0) /
            customer.feedbacks.length
          : null,
    }));

    const response = createPaginationResponse(
      enrichedCustomers,
      total,
      page,
      limit
    );
    return res.status(200).json(response);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Create new customer
async function createCustomer(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      preferences,
      initialWalletBalance = 0,
      loyaltyPoints = 0,
      sendWelcomeEmail = true,
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "Missing required fields: email, firstName, lastName",
      });
    }

    // Use user's business ID
    const businessId = user.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: "Business Error",
        message: "User is not associated with a business",
      });
    }

    // Generate password if not provided
    const customerPassword = password || Math.random().toString(36).slice(-8);

    const result = await prisma.$transaction(async (tx) => {
      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Verify business exists
      const business = await tx.business.findUnique({
        where: { id: businessId },
      });

      if (!business) {
        throw new Error("Business not found");
      }

      // Create user
      const hashedPassword = await hashPassword(customerPassword);
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "CUSTOMER",
          profile: {
            create: {
              firstName,
              lastName,
              phone,
              address,
              preferences,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      // Create customer
      const customerCode = generateCustomerCode();
      const customer = await tx.customer.create({
        data: {
          customerCode,
          userId: newUser.id,
          businessId,
          walletBalance: parseFloat(initialWalletBalance),
          loyaltyPoints: parseInt(loyaltyPoints) || 0,
          preferences,
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          business: true,
        },
      });

      // Create initial wallet transaction if balance > 0
      if (initialWalletBalance > 0) {
        await tx.walletTransaction.create({
          data: {
            type: "CREDIT",
            amount: parseFloat(initialWalletBalance),
            description: "Initial wallet balance",
            reference: `INITIAL_${customerCode}`,
            status: "COMPLETED",
            balanceAfter: parseFloat(initialWalletBalance),
            customerId: customer.id,
            userId: user.id,
          },
        });
      }

      return customer;
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message || "Failed to create customer",
    });
  }
}

// Helper function to determine loyalty tier
function getLoyaltyTier(points) {
  if (points >= 10000) return "Platinum";
  if (points >= 5000) return "Gold";
  if (points >= 1000) return "Silver";
  return "Bronze";
}

export default requireAuth(handler);
