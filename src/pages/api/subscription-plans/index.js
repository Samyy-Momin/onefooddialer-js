// OneFoodDialer - Subscription Plans API
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole } from '../../../lib/auth';
import { handleApiError, getPaginationParams, createPaginationResponse } from '../../../lib/utils';

async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getSubscriptionPlans(req, res);
    case 'POST':
      return createSubscriptionPlan(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// Get subscription plans
async function getSubscriptionPlans(req, res) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { businessId, type, isActive } = req.query;

    const where = {};

    if (businessId) where.businessId = businessId;
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    // Role-based filtering
    if (req.user.role === 'BUSINESS_OWNER') {
      where.businessId = req.user.businessOwner?.[0]?.id;
    }

    const [plans, total] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where,
        skip,
        take: limit,
        include: {
          business: true,
          planItems: {
            include: {
              menuItem: true,
            },
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscriptionPlan.count({ where }),
    ]);

    // Add active subscription count to each plan
    const plansWithStats = plans.map(plan => ({
      ...plan,
      activeSubscriptions: plan.subscriptions.length,
      subscriptions: undefined, // Remove the subscriptions array from response
    }));

    const response = createPaginationResponse(plansWithStats, total, page, limit);
    return res.status(200).json(response);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Create subscription plan (Business owners only)
async function createSubscriptionPlan(req, res) {
  try {
    const {
      name,
      description,
      type,
      duration,
      price,
      discount,
      maxOrders,
      features,
      businessId,
      menuItems, // Array of { menuItemId, quantity, isOptional }
    } = req.body;

    // Validate required fields
    if (!name || !type || !duration || !price || !businessId) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, duration, price, businessId',
      });
    }

    // Verify business ownership
    if (req.user.role === 'BUSINESS_OWNER') {
      const business = await prisma.business.findFirst({
        where: {
          id: businessId,
          ownerId: req.user.id,
        },
      });

      if (!business) {
        return res.status(403).json({ error: 'Access denied to this business' });
      }
    }

    // Create plan with menu items
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        type,
        duration,
        price,
        discount,
        maxOrders,
        features,
        businessId,
        planItems: menuItems
          ? {
              create: menuItems.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity || 1,
                isOptional: item.isOptional || false,
              })),
            }
          : undefined,
      },
      include: {
        business: true,
        planItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return res.status(201).json(plan);
  } catch (error) {
    return handleApiError(error, res);
  }
}

export default requireAuth(handler);
