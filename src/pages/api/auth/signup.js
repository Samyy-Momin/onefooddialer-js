// OneFoodDialer - Signup API with Multi-Tenant Support
import { signUpWithSupabase } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { handleApiError, generateCustomerCode } from '../../../lib/utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'CUSTOMER',
      businessId,
      address,
      initialWalletBalance = 0,
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, firstName, lastName',
      });
    }

    if (role === 'CUSTOMER' && !businessId) {
      return res.status(400).json({
        error: 'Business ID is required for customer accounts',
      });
    }

    // Verify business exists if provided
    if (businessId) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
    }

    const result = await prisma.$transaction(async tx => {
      // Create user with Supabase
      const userData = {
        firstName,
        lastName,
        phone,
        role,
        address: address ? JSON.parse(address) : null,
      };

      const { user, profile } = await signUpWithSupabase(email, password, userData);

      // Create role-specific profiles
      if (role === 'CUSTOMER' && businessId) {
        // Create customer profile
        const customerCode = generateCustomerCode();
        const customer = await tx.customer.create({
          data: {
            customerCode,
            userId: user.id,
            businessId,
            walletBalance: parseFloat(initialWalletBalance),
            preferences: {},
          },
        });

        // Create initial wallet transaction if balance > 0
        if (initialWalletBalance > 0) {
          await tx.walletTransaction.create({
            data: {
              type: 'CREDIT',
              amount: parseFloat(initialWalletBalance),
              description: 'Initial wallet balance',
              reference: `INITIAL_${customerCode}`,
              status: 'COMPLETED',
              balanceAfter: parseFloat(initialWalletBalance),
              customerId: customer.id,
              userId: user.id,
            },
          });
        }

        return { user, profile, customer };
      } else if (role === 'BUSINESS_OWNER') {
        // Business owners can create their own business or be assigned to existing ones
        // For now, we'll handle this in a separate flow
        return { user, profile };
      } else if (['KITCHEN_MANAGER', 'STAFF'].includes(role)) {
        // Staff members need to be invited by business owners
        // For now, we'll handle this in a separate flow
        return { user, profile };
      }

      return { user, profile };
    });

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.profile.role,
      },
      profile: result.profile,
      customer: result.customer || null,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
