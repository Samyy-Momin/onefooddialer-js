// OneFoodDialer - Invoices Management API
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import {
  handleApiError,
  getPaginationParams,
  createPaginationResponse,
  generateInvoiceNumber,
  calculateGST,
} from '../../../lib/utils';

async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getInvoices(req, res);
    case 'POST':
      return createInvoice(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// Get invoices with filtering and pagination
async function getInvoices(req, res) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, customerId, fromDate, toDate, businessId } = req.query;

    const where = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (businessId) where.businessId = businessId;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    // Role-based filtering
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customerProfile?.id;
    } else if (req.user.role === 'BUSINESS_OWNER') {
      where.business = { ownerId: req.user.id };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          subscription: {
            include: {
              plan: true,
            },
          },
          order: {
            include: {
              orderItems: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    const response = createPaginationResponse(invoices, total, page, limit);
    return res.status(200).json(response);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Create new invoice
async function createInvoice(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const {
      customerId,
      subscriptionId,
      orderId,
      items, // For manual invoices: [{ description, quantity, unitPrice }]
      dueDate,
      taxRate = 0.18, // Default 18% GST
      discountAmount = 0,
      billingAddress,
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
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing required fields: customerId',
      });
    }

    // Validate items for manual invoices
    if (!subscriptionId && !orderId && (!items || items.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invoice must have at least one item',
      });
    }

    // Validate item structure
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (
          !item.description ||
          typeof item.quantity !== 'number' ||
          typeof item.unitPrice !== 'number'
        ) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: `Invalid item structure at index ${i}`,
          });
        }
        if (item.quantity <= 0 || item.unitPrice < 0) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Quantity and unit price must be positive numbers',
          });
        }
      }
    }

    // Validate due date
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDateObj < today) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Due date cannot be in the past',
        });
      }
    }

    const result = await prisma.$transaction(async tx => {
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

      let subtotal = 0;
      let invoiceData = {
        invoiceNumber: generateInvoiceNumber(),
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        billingAddress: billingAddress || customer.user.profile?.address || {},
        customerId,
        businessId,
        userId: customer.userId,
      };

      // Handle different invoice types
      if (subscriptionId) {
        const subscription = await tx.subscription.findUnique({
          where: { id: subscriptionId },
          include: { plan: true },
        });
        if (!subscription) throw new Error('Subscription not found');

        subtotal = parseFloat(subscription.plan.price);
        invoiceData.subscriptionId = subscriptionId;
      } else if (orderId) {
        const order = await tx.order.findUnique({
          where: { id: orderId },
        });
        if (!order) throw new Error('Order not found');

        subtotal = parseFloat(order.totalAmount);
        invoiceData.orderId = orderId;
      } else if (items && items.length > 0) {
        // Manual invoice
        subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      } else {
        throw new Error('Invoice must be linked to subscription, order, or have manual items');
      }

      // Calculate tax and total with discount
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount - discountAmount;

      invoiceData = {
        ...invoiceData,
        subtotalAmount: subtotal,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        notes: notes,
      };

      const invoice = await tx.invoice.create({
        data: invoiceData,
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
          subscription: {
            include: {
              plan: true,
            },
          },
          order: {
            include: {
              orderItems: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
      });

      // Create invoice items for manual invoices
      if (items && items.length > 0) {
        await tx.invoiceItem.createMany({
          data: items.map(item => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        });
      }

      return invoice;
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create invoice',
    });
  }
}

// Export raw handler for testing
export { handler };

export default requireAuth(handler);
