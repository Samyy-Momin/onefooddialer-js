// OneFoodDialer - Individual Order Management API
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { handleApiError } from '../../../lib/utils';

async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  switch (method) {
    case 'GET':
      return getOrder(req, res, id);
    case 'PUT':
      return updateOrder(req, res, id);
    case 'DELETE':
      return cancelOrder(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// Get single order
async function getOrder(req, res, id) {
  try {
    const where = { id };

    // Role-based access control
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customerProfile?.id;
    } else if (req.user.role === 'BUSINESS_OWNER') {
      where.business = { ownerId: req.user.id };
    } else if (req.user.role === 'KITCHEN_MANAGER') {
      where.kitchen = {
        staff: {
          some: {
            staff: {
              userId: req.user.id,
              role: 'MANAGER',
            },
          },
        },
      };
    }

    const order = await prisma.order.findFirst({
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
        kitchen: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        invoice: true,
        feedback: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json(order);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Update order status and details
async function updateOrder(req, res, id) {
  try {
    const {
      status,
      deliveryAddress,
      deliveryInstructions,
      specialRequests,
      preparedAt,
      deliveredAt,
    } = req.body;

    const where = { id };

    // Role-based access control
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customerProfile?.id;
    } else if (req.user.role === 'BUSINESS_OWNER') {
      where.business = { ownerId: req.user.id };
    } else if (req.user.role === 'KITCHEN_MANAGER') {
      where.kitchen = {
        staff: {
          some: {
            staff: {
              userId: req.user.id,
              role: 'MANAGER',
            },
          },
        },
      };
    }

    const result = await prisma.$transaction(async tx => {
      // Check if order exists
      const existingOrder = await tx.order.findFirst({ where });
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      const updateData = {};

      if (status !== undefined) {
        updateData.status = status;

        // Auto-set timestamps based on status
        if (status === 'READY' && !preparedAt) {
          updateData.preparedAt = new Date();
        }
        if (status === 'DELIVERED' && !deliveredAt) {
          updateData.deliveredAt = new Date();
        }
      }

      if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;
      if (deliveryInstructions !== undefined)
        updateData.deliveryInstructions = deliveryInstructions;
      if (specialRequests !== undefined) updateData.specialRequests = specialRequests;
      if (preparedAt !== undefined)
        updateData.preparedAt = preparedAt ? new Date(preparedAt) : null;
      if (deliveredAt !== undefined)
        updateData.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;

      const order = await tx.order.update({
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
          kitchen: true,
          subscription: {
            include: {
              plan: true,
            },
          },
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          invoice: true,
        },
      });

      // Handle status-specific logic
      if (status === 'DELIVERED') {
        // Mark invoice as paid if it exists
        if (existingOrder.invoice) {
          await tx.invoice.update({
            where: { id: existingOrder.invoice.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
              paymentMethod: 'WALLET',
            },
          });
        }

        // Add loyalty points
        await addLoyaltyPoints(
          tx,
          existingOrder.customerId,
          Math.floor(existingOrder.finalAmount / 100)
        );
      }

      if (status === 'CANCELLED') {
        // Refund to wallet if payment was made
        if (existingOrder.invoice && existingOrder.invoice.status === 'PAID') {
          const customer = await tx.customer.findUnique({
            where: { id: existingOrder.customerId },
          });

          await tx.customer.update({
            where: { id: existingOrder.customerId },
            data: {
              walletBalance: {
                increment: existingOrder.finalAmount,
              },
            },
          });

          await tx.walletTransaction.create({
            data: {
              type: 'REFUND',
              amount: existingOrder.finalAmount,
              description: `Refund for cancelled order ${existingOrder.orderNumber}`,
              balanceAfter: customer.walletBalance + existingOrder.finalAmount,
              status: 'COMPLETED',
              customerId: existingOrder.customerId,
              userId: existingOrder.userId,
            },
          });
        }

        // Restore inventory
        await restoreInventoryForOrder(tx, existingOrder);
      }

      return order;
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Cancel order
async function cancelOrder(req, res, id) {
  try {
    return await updateOrder(req, { ...res, body: { status: 'CANCELLED' } }, id);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Helper function to add loyalty points
async function addLoyaltyPoints(tx, customerId, points) {
  await tx.customer.update({
    where: { id: customerId },
    data: {
      loyaltyPoints: {
        increment: points,
      },
    },
  });
}

// Helper function to restore inventory
async function restoreInventoryForOrder(tx, order) {
  const orderItems = await tx.orderItem.findMany({
    where: { orderId: order.id },
    include: { menuItem: true },
  });

  for (const orderItem of orderItems) {
    const inventoryItems = await tx.inventoryItem.findMany({
      where: {
        menuItemId: orderItem.menuItemId,
        kitchenId: order.kitchenId,
        isActive: true,
      },
    });

    for (const inventoryItem of inventoryItems) {
      const restoreAmount = orderItem.quantity * 0.1;

      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          currentStock: {
            increment: restoreAmount,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          type: 'IN',
          quantity: restoreAmount,
          reason: 'Order cancellation',
          reference: order.orderNumber,
          inventoryItemId: inventoryItem.id,
        },
      });
    }
  }
}

export default requireAuth(handler);
