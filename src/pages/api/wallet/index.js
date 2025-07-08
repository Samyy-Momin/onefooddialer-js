// OneFoodDialer - Wallet Management API
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { handleApiError, getPaginationParams, createPaginationResponse } from '../../../lib/utils';

async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getWalletInfo(req, res);
    case 'POST':
      return addMoney(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// Get wallet information and transactions
async function getWalletInfo(req, res) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { type, fromDate, toDate } = req.query;

    // Get customer ID based on user role
    let customerId;
    if (req.user.role === 'CUSTOMER') {
      customerId = req.user.customerProfile?.id;
    } else {
      customerId = req.query.customerId;
    }

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }

    // Get customer with current balance
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Build transaction filter
    const where = { customerId };
    if (type) where.type = type;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.walletTransaction.aggregate({
      where: { customerId },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const creditSum = await prisma.walletTransaction.aggregate({
      where: { 
        customerId,
        type: { in: ['CREDIT', 'REFUND', 'CASHBACK', 'BONUS'] }
      },
      _sum: {
        amount: true,
      },
    });

    const debitSum = await prisma.walletTransaction.aggregate({
      where: { 
        customerId,
        type: 'DEBIT'
      },
      _sum: {
        amount: true,
      },
    });

    const walletInfo = {
      customer: {
        id: customer.id,
        name: `${customer.user.profile?.firstName} ${customer.user.profile?.lastName}`,
        email: customer.user.email,
        customerCode: customer.customerCode,
      },
      balance: customer.walletBalance,
      loyaltyPoints: customer.loyaltyPoints,
      summary: {
        totalTransactions: summary._count.id,
        totalCredits: creditSum._sum.amount || 0,
        totalDebits: debitSum._sum.amount || 0,
      },
      transactions: createPaginationResponse(transactions, total, page, limit),
    };

    return res.status(200).json(walletInfo);
  } catch (error) {
    return handleApiError(error, res);
  }
}

// Add money to wallet
async function addMoney(req, res) {
  try {
    const {
      customerId,
      amount,
      paymentMethod = 'ONLINE',
      paymentReference,
      description = 'Wallet recharge',
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Get customer ID based on user role
    let targetCustomerId = customerId;
    if (req.user.role === 'CUSTOMER') {
      targetCustomerId = req.user.customerProfile?.id;
    }

    if (!targetCustomerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get current customer data
      const customer = await tx.customer.findUnique({
        where: { id: targetCustomerId },
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

      // Calculate new balance
      const newBalance = customer.walletBalance + parseFloat(amount);

      // Update customer balance
      await tx.customer.update({
        where: { id: targetCustomerId },
        data: {
          walletBalance: newBalance,
        },
      });

      // Create wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          type: 'CREDIT',
          amount: parseFloat(amount),
          description,
          reference: paymentReference || `RECHARGE_${Date.now()}`,
          status: 'COMPLETED',
          balanceAfter: newBalance,
          customerId: targetCustomerId,
          userId: customer.userId,
        },
      });

      // Add bonus for large recharges
      if (amount >= 1000) {
        const bonusAmount = Math.floor(amount * 0.05); // 5% bonus
        const bonusBalance = newBalance + bonusAmount;

        await tx.customer.update({
          where: { id: targetCustomerId },
          data: {
            walletBalance: bonusBalance,
          },
        });

        await tx.walletTransaction.create({
          data: {
            type: 'BONUS',
            amount: bonusAmount,
            description: `Recharge bonus (5% of ₹${amount})`,
            reference: `BONUS_${Date.now()}`,
            status: 'COMPLETED',
            balanceAfter: bonusBalance,
            customerId: targetCustomerId,
            userId: customer.userId,
          },
        });
      }

      // Get updated customer data
      const updatedCustomer = await tx.customer.findUnique({
        where: { id: targetCustomerId },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      return {
        transaction,
        customer: updatedCustomer,
        newBalance: updatedCustomer.walletBalance,
      };
    });

    return res.status(200).json({
      message: 'Money added successfully',
      ...result,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

export default requireAuth(handler);
