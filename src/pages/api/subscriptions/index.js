// OneFoodDialer - Subscription Management API
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { handleApiError, getPaginationParams, createPaginationResponse } from '../../../lib/utils';

async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getSubscriptions(req, res);
    case 'POST':
      return createSubscription(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// Get subscriptions with filtering and pagination
async function getSubscriptions(req, res) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, businessId, customerId, planType } = req.query;

    const where = {};

    if (status) where.status = status;
    if (businessId) where.businessId = businessId;
    if (customerId) where.customerId = customerId;
    if (planType) where.plan = { type: planType };

    // Multi-tenant filtering - ALWAYS filter by business
    if (req.user.role === 'CUSTOMER') {
      // Customers can only see their own subscriptions
      where.customerId = req.user.customerProfile?.id;
      where.businessId = req.user.businessId;
    } else if (req.user.role === 'BUSINESS_OWNER') {
      // Business owners can only see subscriptions for their businesses
      where.businessId = req.user.businessId || businessId;
    } else if (['KITCHEN_MANAGER', 'STAFF'].includes(req.user.role)) {
      // Kitchen staff can only see subscriptions for their business
      where.businessId = req.user.businessId;
    } else if (req.user.role === 'SUPER_ADMIN') {
      // Super admin can see all, but still filter by businessId if provided
      if (businessId) where.businessId = businessId;
    } else {
      // Default: filter by user's business
      where.businessId = req.user.businessId;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
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
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where }),
    ]);

    const response = createPaginationResponse(subscriptions, total, page, limit);
    return res.status(200).json(response);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Create new subscription with full business logic
async function createSubscription(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const {
      customerId,
      planId,
      kitchenId,
      startDate,
      endDate,
      autoRenew = true,
      customizations,
      deliveryAddress,
      deliveryInstructions,
      notes,
    } = req.body;

    // Use user's business ID
    const businessId = user.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Business Error',
        message: 'User is not associated with a business',
      });
    }

    // Validate required fields
    if (!customerId || !planId || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing required fields: customerId, planId, startDate',
      });
    }

    // Start transaction for atomic operations
    const result = await prisma.$transaction(async tx => {
      // Verify customer exists and belongs to business
      const customer = await tx.customer.findFirst({
        where: {
          id: customerId,
          businessId: businessId,
        },
        include: {
          user: true,
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Verify plan exists and belongs to business
      const plan = await tx.subscriptionPlan.findFirst({
        where: {
          id: planId,
          businessId: businessId,
          isActive: true,
        },
        include: {
          planItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      if (!plan) {
        throw new Error('Subscription plan not found');
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

      // Calculate next billing date
      const nextBillingDate = calculateNextBillingDate(startDate, plan.type);

      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          customerId,
          businessId,
          planId,
          kitchenId: assignedKitchenId,
          userId: customer.userId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          nextBillingDate,
          autoRenew,
          customizations,
          deliveryAddress,
          deliveryInstructions,
          status: 'ACTIVE',
        },
      });

      // Generate initial orders based on plan type
      const orders = await generateInitialOrders(tx, subscription, plan, customer);

      // Create initial invoice
      const invoice = await createSubscriptionInvoice(tx, subscription, plan, customer);

      // Update customer wallet if needed
      await updateCustomerWallet(
        tx,
        customer,
        invoice.totalAmount,
        'DEBIT',
        `Subscription ${plan.name}`
      );

      // Return complete subscription data
      return await tx.subscription.findUnique({
        where: { id: subscription.id },
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
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          invoices: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create subscription',
    });
  }
}

// Helper function to calculate next billing date
function calculateNextBillingDate(startDate, planType) {
  const start = new Date(startDate);

  switch (planType) {
    case 'DAILY':
      return new Date(start.getTime() + 24 * 60 * 60 * 1000);
    case 'WEEKLY':
      return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'MONTHLY':
      const nextMonth = new Date(start);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    default:
      return new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

// Helper function to generate initial orders
async function generateInitialOrders(tx, subscription, plan, customer) {
  const orders = [];
  const today = new Date();
  const { generateOrderNumber, calculateGST } = require('../../../lib/utils');

  // Generate orders based on plan type
  let orderDates = [];

  switch (plan.type) {
    case 'DAILY':
      // Generate next 7 days of orders
      for (let i = 0; i < 7; i++) {
        const orderDate = new Date(today);
        orderDate.setDate(today.getDate() + i);
        orderDates.push(orderDate);
      }
      break;
    case 'WEEKLY':
      // Generate next 4 weeks of orders
      for (let i = 0; i < 4; i++) {
        const orderDate = new Date(today);
        orderDate.setDate(today.getDate() + i * 7);
        orderDates.push(orderDate);
      }
      break;
    case 'MONTHLY':
      // Generate next 3 months of orders
      for (let i = 0; i < 3; i++) {
        const orderDate = new Date(today);
        orderDate.setMonth(today.getMonth() + i);
        orderDates.push(orderDate);
      }
      break;
  }

  // Create orders for each date
  for (const orderDate of orderDates) {
    const orderNumber = generateOrderNumber();
    const subtotal = parseFloat(plan.price);
    const gstCalc = calculateGST(subtotal);

    const order = await tx.order.create({
      data: {
        orderNumber,
        type: 'SUBSCRIPTION',
        status: 'PENDING',
        totalAmount: gstCalc.subtotal,
        taxAmount: gstCalc.totalTax,
        finalAmount: gstCalc.total,
        scheduledFor: orderDate,
        deliveryAddress: subscription.deliveryAddress || customer.user.profile?.address || {},
        deliveryInstructions: subscription.deliveryInstructions,
        customerId: subscription.customerId,
        businessId: subscription.businessId,
        kitchenId: subscription.kitchenId,
        subscriptionId: subscription.id,
        userId: subscription.userId,
        orderItems: {
          create: plan.planItems.map(planItem => ({
            quantity: planItem.quantity,
            unitPrice: planItem.menuItem.price,
            totalPrice: planItem.menuItem.price * planItem.quantity,
            menuItemId: planItem.menuItemId,
            customizations: subscription.customizations,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    orders.push(order);
  }

  return orders;
}

// Helper function to create subscription invoice
async function createSubscriptionInvoice(tx, subscription, plan, customer) {
  const { generateInvoiceNumber, calculateGST } = require('../../../lib/utils');

  const invoiceNumber = generateInvoiceNumber();
  const subtotal = parseFloat(plan.price);
  const gstCalc = calculateGST(subtotal);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay

  const invoice = await tx.invoice.create({
    data: {
      invoiceNumber,
      status: 'PENDING',
      subtotal: gstCalc.subtotal,
      taxAmount: gstCalc.totalTax,
      totalAmount: gstCalc.total,
      dueDate,
      billingAddress: subscription.deliveryAddress || customer.user.profile?.address || {},
      customerId: subscription.customerId,
      businessId: subscription.businessId,
      subscriptionId: subscription.id,
      userId: subscription.userId,
    },
  });

  return invoice;
}

// Helper function to update customer wallet
async function updateCustomerWallet(tx, customer, amount, type, description) {
  const { generateCustomerCode } = require('../../../lib/utils');

  // Update customer balance
  const newBalance =
    type === 'DEBIT' ? customer.walletBalance - amount : customer.walletBalance + amount;

  await tx.customer.update({
    where: { id: customer.id },
    data: { walletBalance: newBalance },
  });

  // Create wallet transaction
  await tx.walletTransaction.create({
    data: {
      type,
      amount,
      description,
      balanceAfter: newBalance,
      status: 'COMPLETED',
      customerId: customer.id,
      userId: customer.userId,
    },
  });

  return newBalance;
}

// Export raw handler for testing
export { handler };

export default requireAuth(handler);
