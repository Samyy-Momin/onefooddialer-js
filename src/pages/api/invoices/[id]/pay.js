// OneFoodDialer - Invoice Payment Processing API
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';
import { handleApiError } from '../../../../lib/utils';

async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  }

  return processPayment(req, res, id);
}

// Process invoice payment
async function processPayment(req, res, invoiceId) {
  try {
    const {
      paymentMethod = 'WALLET',
      paymentReference,
      amount,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Get invoice with customer details
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: {
            include: {
              user: true,
            },
          },
          business: true,
          subscription: {
            include: {
              plan: true,
            },
          },
          order: true,
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'PAID') {
        throw new Error('Invoice already paid');
      }

      // Role-based access control
      if (req.user.role === 'CUSTOMER' && invoice.customerId !== req.user.customerProfile?.id) {
        throw new Error('Access denied');
      }

      const paymentAmount = amount || invoice.totalAmount;

      // Process payment based on method
      if (paymentMethod === 'WALLET') {
        // Check wallet balance
        if (invoice.customer.walletBalance < paymentAmount) {
          throw new Error('Insufficient wallet balance');
        }

        // Deduct from wallet
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            walletBalance: {
              decrement: paymentAmount,
            },
          },
        });

        // Create wallet transaction
        await tx.walletTransaction.create({
          data: {
            type: 'DEBIT',
            amount: paymentAmount,
            description: `Payment for invoice ${invoice.invoiceNumber}`,
            balanceAfter: invoice.customer.walletBalance - paymentAmount,
            status: 'COMPLETED',
            customerId: invoice.customerId,
            userId: invoice.userId,
            reference: invoice.invoiceNumber,
          },
        });
      }

      // Update invoice status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod,
          paymentReference: paymentReference || `WALLET_${Date.now()}`,
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
          subscription: {
            include: {
              plan: true,
            },
          },
          order: true,
        },
      });

      // Add loyalty points for payment
      const loyaltyPoints = Math.floor(paymentAmount / 100); // 1 point per ₹100
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          loyaltyPoints: {
            increment: loyaltyPoints,
          },
        },
      });

      // If this is a subscription invoice, update next billing date
      if (invoice.subscriptionId) {
        const nextBillingDate = calculateNextBillingDate(
          new Date(),
          invoice.subscription.plan.type
        );

        await tx.subscription.update({
          where: { id: invoice.subscriptionId },
          data: {
            nextBillingDate,
          },
        });
      }

      // Update business metrics
      await updateBusinessMetrics(tx, invoice.businessId, paymentAmount);

      return updatedInvoice;
    });

    return res.status(200).json({
      message: 'Payment processed successfully',
      invoice: result,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Helper function to calculate next billing date
function calculateNextBillingDate(currentDate, planType) {
  const date = new Date(currentDate);
  
  switch (planType) {
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date;
}

// Helper function to update business metrics
async function updateBusinessMetrics(tx, businessId, revenue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingMetrics = await tx.businessMetrics.findUnique({
    where: {
      businessId_date: {
        businessId,
        date: today,
      },
    },
  });

  if (existingMetrics) {
    await tx.businessMetrics.update({
      where: {
        businessId_date: {
          businessId,
          date: today,
        },
      },
      data: {
        totalRevenue: {
          increment: revenue,
        },
      },
    });
  } else {
    await tx.businessMetrics.create({
      data: {
        businessId,
        date: today,
        totalRevenue: revenue,
        totalOrders: 0,
        newCustomers: 0,
        activeSubscriptions: 0,
        averageOrderValue: 0,
        customerRetentionRate: 0,
        kitchenUtilization: 0,
        deliveryOnTime: 0,
      },
    });
  }
}

export default requireAuth(handler);
