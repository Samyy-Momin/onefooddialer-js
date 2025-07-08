// OneFoodDialer - Individual Subscription Management API
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { handleApiError } from '../../../lib/utils';

async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  switch (method) {
    case 'GET':
      return getSubscription(req, res, id);
    case 'PUT':
      return updateSubscription(req, res, id);
    case 'DELETE':
      return deleteSubscription(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// Get single subscription
async function getSubscription(req, res, id) {
  try {
    const where = { id };

    // Role-based access control
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customerProfile?.id;
    } else if (req.user.role === 'BUSINESS_OWNER') {
      where.business = { ownerId: req.user.id };
    }

    const subscription = await prisma.subscription.findFirst({
      where,
      include: {
        customer: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        business: true,
        plan: {
          include: {
            planItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        kitchen: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            orderItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.status(200).json(subscription);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Update subscription
async function updateSubscription(req, res, id) {
  try {
    const {
      status,
      endDate,
      autoRenew,
      customizations,
      deliveryAddress,
      deliveryInstructions,
      pausedUntil,
      kitchenId,
    } = req.body;

    const where = { id };

    // Role-based access control
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customerProfile?.id;
    } else if (req.user.role === 'BUSINESS_OWNER') {
      where.business = { ownerId: req.user.id };
    }

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findFirst({ where });
    if (!existingSubscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updateData = {};
    
    if (status !== undefined) updateData.status = status;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew;
    if (customizations !== undefined) updateData.customizations = customizations;
    if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;
    if (deliveryInstructions !== undefined) updateData.deliveryInstructions = deliveryInstructions;
    if (pausedUntil !== undefined) updateData.pausedUntil = pausedUntil ? new Date(pausedUntil) : null;
    if (kitchenId !== undefined) updateData.kitchenId = kitchenId;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        business: true,
        plan: {
          include: {
            planItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        kitchen: true,
      },
    });

    return res.status(200).json(subscription);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Delete/Cancel subscription
async function deleteSubscription(req, res, id) {
  try {
    const where = { id };

    // Role-based access control
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customerProfile?.id;
    } else if (req.user.role === 'BUSINESS_OWNER') {
      where.business = { ownerId: req.user.id };
    }

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findFirst({ where });
    if (!existingSubscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Instead of deleting, we'll cancel the subscription
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
        autoRenew: false,
      },
    });

    return res.status(200).json({ 
      message: 'Subscription cancelled successfully',
      subscription 
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

export default requireAuth(handler);
