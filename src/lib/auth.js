// OneFoodDialer - Enhanced Authentication with Multi-Tenant Support
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { supabase, supabaseAdmin } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Hash password
export const hashPassword = async password => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = payload => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = token => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Get user from token
export const getUserFromToken = async token => {
  try {
    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        customerProfile: true,
        businessOwner: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
};

// Middleware to protect routes
export const requireAuth = handler => {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await getUserFromToken(token);

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = user;
      return handler(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
};

// Role-based access control
export const requireRole = roles => {
  return handler => {
    return requireAuth(async (req, res) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handler(req, res);
    });
  };
};

// Supabase Authentication Functions
export const signUpWithSupabase = async (email, password, userData) => {
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'CUSTOMER',
        },
      },
    });

    if (authError) throw authError;

    // Create user in our database
    const user = await prisma.user.create({
      data: {
        id: authData.user.id, // Use Supabase user ID
        email,
        password: await hashPassword(password), // Still hash for backup
        role: userData.role || 'CUSTOMER',
        profile: {
          create: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            address: userData.address,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return { user: authData.user, profile: user };
  } catch (error) {
    throw new Error(`Signup failed: ${error.message}`);
  }
};

export const signInWithSupabase = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user profile from our database
    const userProfile = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        profile: true,
        customerProfile: {
          include: {
            business: true,
          },
        },
        businessOwner: {
          include: {
            kitchens: true,
          },
        },
        businessStaff: {
          include: {
            business: true,
          },
        },
      },
    });

    return { user: data.user, session: data.session, profile: userProfile };
  } catch (error) {
    throw new Error(`Signin failed: ${error.message}`);
  }
};

export const signOutWithSupabase = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user with business context
export const getCurrentUserWithBusiness = async userId => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        customerProfile: {
          include: {
            business: true,
          },
        },
        businessOwner: {
          include: {
            kitchens: true,
            staff: true,
          },
        },
        businessStaff: {
          include: {
            business: true,
            kitchenStaff: {
              include: {
                kitchen: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    // Determine user's business context
    let businessId = null;
    let businesses = [];
    let permissions = [];

    if (user.role === 'SUPER_ADMIN') {
      // Super admin can access all businesses
      const allBusinesses = await prisma.business.findMany({
        include: {
          kitchens: true,
        },
      });
      businesses = allBusinesses;
    } else if (user.role === 'BUSINESS_OWNER') {
      businesses = user.businessOwner;
      businessId = businesses[0]?.id;
      permissions = ['READ', 'WRITE', 'DELETE', 'ADMIN'];
    } else if (user.role === 'CUSTOMER') {
      if (user.customerProfile) {
        businessId = user.customerProfile.businessId;
        businesses = [user.customerProfile.business];
        permissions = ['READ'];
      }
    } else if (['KITCHEN_MANAGER', 'STAFF'].includes(user.role)) {
      if (user.businessStaff.length > 0) {
        businessId = user.businessStaff[0].businessId;
        businesses = [user.businessStaff[0].business];
        permissions =
          user.role === 'KITCHEN_MANAGER' ? ['READ', 'WRITE', 'MANAGE_KITCHEN'] : ['READ', 'WRITE'];
      }
    }

    return {
      ...user,
      businessId,
      businesses,
      permissions,
      currentBusiness: businesses.find(b => b.id === businessId),
    };
  } catch (error) {
    console.error('Error getting user with business:', error);
    return null;
  }
};

// Multi-tenant middleware
export const requireBusinessAccess = handler => {
  return requireAuth(async (req, res) => {
    const { businessId } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }

    // Check if user has access to this business
    const userWithBusiness = await getCurrentUserWithBusiness(req.user.id);

    if (!userWithBusiness) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Super admin can access any business
    if (userWithBusiness.role === 'SUPER_ADMIN') {
      req.user = userWithBusiness;
      req.businessId = businessId;
      return handler(req, res);
    }

    // Check if user has access to the requested business
    const hasAccess = userWithBusiness.businesses.some(b => b.id === businessId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this business' });
    }

    req.user = userWithBusiness;
    req.businessId = businessId;
    return handler(req, res);
  });
};
