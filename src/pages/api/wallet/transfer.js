// OneFoodDialer - Wallet Transfer API
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { handleApiError } from '../../../lib/utils';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  return transferMoney(req, res);
}

// Transfer money between wallets
async function transferMoney(req, res) {
  try {
    const {
      fromCustomerId,
      toCustomerId,
      amount,
      description = 'Wallet transfer',
    } = req.body;

    // Validate required fields
    if (!toCustomerId || !amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Valid recipient and amount are required' 
      });
    }

    // Get sender customer ID based on user role
    let senderCustomerId = fromCustomerId;
    if (req.user.role === 'CUSTOMER') {
      senderCustomerId = req.user.customerProfile?.id;
    }

    if (!senderCustomerId) {
      return res.status(400).json({ error: 'Sender customer ID required' });
    }

    if (senderCustomerId === toCustomerId) {
      return res.status(400).json({ error: 'Cannot transfer to same wallet' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get sender customer
      const sender = await tx.customer.findUnique({
        where: { id: senderCustomerId },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      if (!sender) {
        throw new Error('Sender not found');
      }

      // Get recipient customer
      const recipient = await tx.customer.findUnique({
        where: { id: toCustomerId },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Check if sender has sufficient balance
      if (sender.walletBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Calculate new balances
      const senderNewBalance = sender.walletBalance - parseFloat(amount);
      const recipientNewBalance = recipient.walletBalance + parseFloat(amount);

      // Update sender balance
      await tx.customer.update({
        where: { id: senderCustomerId },
        data: {
          walletBalance: senderNewBalance,
        },
      });

      // Update recipient balance
      await tx.customer.update({
        where: { id: toCustomerId },
        data: {
          walletBalance: recipientNewBalance,
        },
      });

      // Create debit transaction for sender
      const senderTransaction = await tx.walletTransaction.create({
        data: {
          type: 'DEBIT',
          amount: parseFloat(amount),
          description: `Transfer to ${recipient.user.profile?.firstName} ${recipient.user.profile?.lastName}`,
          reference: `TRANSFER_OUT_${Date.now()}`,
          status: 'COMPLETED',
          balanceAfter: senderNewBalance,
          customerId: senderCustomerId,
          userId: sender.userId,
        },
      });

      // Create credit transaction for recipient
      const recipientTransaction = await tx.walletTransaction.create({
        data: {
          type: 'CREDIT',
          amount: parseFloat(amount),
          description: `Transfer from ${sender.user.profile?.firstName} ${sender.user.profile?.lastName}`,
          reference: `TRANSFER_IN_${Date.now()}`,
          status: 'COMPLETED',
          balanceAfter: recipientNewBalance,
          customerId: toCustomerId,
          userId: recipient.userId,
        },
      });

      return {
        sender: {
          ...sender,
          walletBalance: senderNewBalance,
          transaction: senderTransaction,
        },
        recipient: {
          ...recipient,
          walletBalance: recipientNewBalance,
          transaction: recipientTransaction,
        },
        transferAmount: amount,
      };
    });

    return res.status(200).json({
      message: 'Transfer completed successfully',
      ...result,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

export default requireAuth(handler);
