// OneFoodDialer - Orders Management API
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { handleApiError, getPaginationParams, createPaginationResponse, generateOrderNumber, calculateGST } from '../../../lib/utils';

async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getOrders(req, res);
    case 'POST':
      return createOrder(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// Get orders with filtering and pagination
async function getOrders(req, res) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, kitchenId, customerId, type, date } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (kitchenId) where.kitchenId = kitchenId;
    if (customerId) where.customerId = customerId;
    if (type) where.type = type;
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      where.scheduledFor = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    // Role-based filtering
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customerProfile?.id;
    } else if (req.user.role === 'BUSINESS_OWNER') {
      where.business = { ownerId: req.user.id };
    } else if (req.user.role === 'KITCHEN_MANAGER') {
      // Filter by kitchens user manages
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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { scheduledFor: 'asc' },
      }),
      prisma.order.count({ where }),
    ]);

    const response = createPaginationResponse(orders, total, page, limit);
    return res.status(200).json(response);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Create new order (one-time or bulk)
async function createOrder(req, res) {
  try {
    const {
      customerId,
      businessId,
      kitchenId,
      type = 'ONE_TIME',
      scheduledFor,
      deliveryAddress,
      deliveryInstructions,
      specialRequests,
      orderItems, // Array of { menuItemId, quantity, customizations }
    } = req.body;

    // Validate required fields
    if (!customerId || !businessId || !scheduledFor || !orderItems?.length) {
      return res.status(400).json({ 
        error: 'Missing required fields: customerId, businessId, scheduledFor, orderItems' 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Verify customer
      const customer = await tx.customer.findFirst({
        where: {
          id: customerId,
          businessId: businessId,
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Auto-assign kitchen if not provided
      let assignedKitchenId = kitchenId;
      if (!assignedKitchenId) {
        const availableKitchen = await tx.kitchen.findFirst({
          where: {
            businessId: businessId,
            isActive: true,
          },
          orderBy: {
            capacity: 'desc',
          },
        });
        assignedKitchenId = availableKitchen?.id;
      }

      // Calculate order totals
      let subtotal = 0;
      const validatedItems = [];

      for (const item of orderItems) {
        const menuItem = await tx.menuItem.findFirst({
          where: {
            id: item.menuItemId,
            businessId: businessId,
            isActive: true,
          },
        });

        if (!menuItem) {
          throw new Error(`Menu item ${item.menuItemId} not found`);
        }

        const itemTotal = parseFloat(menuItem.price) * item.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: menuItem.price,
          totalPrice: itemTotal,
          customizations: item.customizations,
        });
      }

      const gstCalc = calculateGST(subtotal);
      const orderNumber = generateOrderNumber();

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          type,
          status: 'PENDING',
          totalAmount: gstCalc.subtotal,
          taxAmount: gstCalc.totalTax,
          finalAmount: gstCalc.total,
          scheduledFor: new Date(scheduledFor),
          deliveryAddress: deliveryAddress || customer.user.profile?.address || {},
          deliveryInstructions,
          specialRequests,
          customerId,
          businessId,
          kitchenId: assignedKitchenId,
          userId: customer.userId,
          orderItems: {
            create: validatedItems,
          },
        },
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
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // Create invoice for one-time orders
      if (type === 'ONE_TIME') {
        await createOrderInvoice(tx, order, customer);
      }

      // Update inventory (reduce stock)
      await updateInventoryForOrder(tx, order);

      return order;
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Helper function to create order invoice
async function createOrderInvoice(tx, order, customer) {
  const { generateInvoiceNumber } = require('../../../lib/utils');
  
  const invoiceNumber = generateInvoiceNumber();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow for one-time orders

  await tx.invoice.create({
    data: {
      invoiceNumber,
      status: 'PENDING',
      subtotal: order.totalAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.finalAmount,
      dueDate,
      billingAddress: order.deliveryAddress,
      customerId: order.customerId,
      businessId: order.businessId,
      orderId: order.id,
      userId: order.userId,
    },
  });
}

// Helper function to update inventory
async function updateInventoryForOrder(tx, order) {
  for (const orderItem of order.orderItems) {
    // Find inventory items for this menu item
    const inventoryItems = await tx.inventoryItem.findMany({
      where: {
        menuItemId: orderItem.menuItemId,
        kitchenId: order.kitchenId,
        isActive: true,
      },
    });

    // Reduce stock and create stock movements
    for (const inventoryItem of inventoryItems) {
      const reductionAmount = orderItem.quantity * 0.1; // Assume 0.1 unit per order item

      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          currentStock: {
            decrement: reductionAmount,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          type: 'OUT',
          quantity: reductionAmount,
          reason: 'Order fulfillment',
          reference: order.orderNumber,
          inventoryItemId: inventoryItem.id,
        },
      });
    }
  }
}

export default requireAuth(handler);
