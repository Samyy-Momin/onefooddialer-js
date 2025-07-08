// OneFoodDialer - Jest Setup Configuration
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => null;
  DynamicComponent.displayName = 'LoadableComponent';
  DynamicComponent.preload = jest.fn();
  return DynamicComponent;
});

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: props => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.scrollTo
global.scrollTo = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test utilities
global.testUtils = {
  // Mock API response helper
  mockApiResponse: (data, success = true) => ({
    ok: success,
    status: success ? 200 : 400,
    json: jest.fn().mockResolvedValue({
      success,
      data: success ? data : undefined,
      error: success ? undefined : 'Test error',
      message: success ? 'Success' : 'Test error message',
    }),
  }),

  // Mock user data
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'BUSINESS_OWNER',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
    },
  },

  // Mock customer data
  mockCustomer: {
    id: 'test-customer-id',
    customerCode: 'CUST001234',
    userId: 'test-user-id',
    businessId: 'test-business-id',
    walletBalance: 100.5,
    loyaltyPoints: 250,
    isActive: true,
    user: {
      email: 'customer@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      },
    },
  },

  // Mock order data
  mockOrder: {
    id: 'test-order-id',
    orderNumber: 'ORD12345678',
    customerId: 'test-customer-id',
    kitchenId: 'test-kitchen-id',
    status: 'PENDING',
    type: 'ONE_TIME',
    finalAmount: 299.99,
    scheduledFor: '2025-07-08T12:00:00Z',
  },

  // Mock subscription data
  mockSubscription: {
    id: 'test-subscription-id',
    customerId: 'test-customer-id',
    planId: 'test-plan-id',
    kitchenId: 'test-kitchen-id',
    status: 'ACTIVE',
    startDate: '2025-07-01',
    endDate: '2025-08-01',
    autoRenew: true,
  },

  // Mock invoice data
  mockInvoice: {
    id: 'test-invoice-id',
    invoiceNumber: 'INV12345678',
    customerId: 'test-customer-id',
    businessId: 'test-business-id',
    totalAmount: 299.99,
    taxAmount: 29.99,
    status: 'PENDING',
    dueDate: '2025-07-15',
  },
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
