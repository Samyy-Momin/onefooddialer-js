// OneFoodDialer - Utility Functions
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

// Generate unique codes
export const generateCustomerCode = () => {
  const prefix = 'CUS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const generateOrderNumber = () => {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const date = format(new Date(), 'yyyyMM');
  const random = Math.random().toString().slice(-4);
  return `${prefix}${date}${random}`;
};

export const generateTicketNumber = () => {
  const prefix = 'TKT';
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

// Date utilities
export const getDateRange = (days = 30) => {
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(addDays(endDate, -days));
  return { startDate, endDate };
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Tax calculations
export const calculateGST = (amount, cgstRate = 9, sgstRate = 9) => {
  const cgst = (amount * cgstRate) / 100;
  const sgst = (amount * sgstRate) / 100;
  const total = amount + cgst + sgst;
  
  return {
    subtotal: amount,
    cgst: cgst,
    sgst: sgst,
    totalTax: cgst + sgst,
    total: total,
  };
};

// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
  return phoneRegex.test(phone);
};

export const validateGST = (gstNumber) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
};

// Subscription utilities
export const calculateNextBillingDate = (startDate, planType) => {
  const start = new Date(startDate);
  
  switch (planType) {
    case 'DAILY':
      return addDays(start, 1);
    case 'WEEKLY':
      return addDays(start, 7);
    case 'MONTHLY':
      return addDays(start, 30);
    default:
      return addDays(start, 30);
  }
};

// Error handling
export const handleApiError = (error, res) => {
  console.error('API Error:', error);
  
  if (error.code === 'P2002') {
    return res.status(400).json({ error: 'Duplicate entry' });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  return res.status(500).json({ error: 'Internal server error' });
};

// Pagination utilities
export const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

export const createPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
