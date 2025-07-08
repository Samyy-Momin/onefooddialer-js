# OneFoodDialer Testing Guide

## Overview

OneFoodDialer includes comprehensive testing setup with both unit tests (Jest) and end-to-end tests (Playwright) to ensure production-ready quality.

## 🧪 Testing Stack

### Unit Testing
- **Jest** - JavaScript testing framework
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers

### E2E Testing
- **Playwright** - Cross-browser end-to-end testing
- **Multi-browser support** - Chrome, Firefox, Safari, Mobile

## 📁 Test Structure

```
onefooddialer/
├── __tests__/                 # Unit tests
│   ├── api/                   # API route tests
│   │   ├── subscriptions.test.js
│   │   ├── invoices.test.js
│   │   └── dashboard/
│   │       └── stats.test.js
│   ├── components/            # Component tests
│   └── utils/                 # Utility function tests
├── e2e/                       # End-to-end tests
│   ├── smoke-test.spec.js     # Main user flow test
│   ├── global-setup.js        # E2E setup
│   └── global-teardown.js     # E2E cleanup
├── jest.config.js             # Jest configuration
├── jest.setup.js              # Jest setup file
└── playwright.config.js       # Playwright configuration
```

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run all tests (unit + E2E)
npm run test:all
```

## 📊 Test Coverage

### Unit Test Coverage Goals
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### API Routes Covered
- ✅ `/api/subscriptions` - POST validation and creation
- ✅ `/api/invoices` - POST validation and tax calculations
- ✅ `/api/dashboard/stats` - GET real-time statistics

### Components Covered
- ✅ ListPage component
- ✅ Card components
- ✅ FilterBar component
- ✅ Layout component

## 🎯 E2E Test Scenarios

### Smoke Test Coverage
1. **Authentication Flow**
   - Login with valid credentials
   - Invalid login error handling
   - Protected route redirects
   - Logout functionality

2. **Dashboard Functionality**
   - Real-time stats display
   - Auto-refresh mechanism
   - Quick actions
   - Recent activity

3. **CRM Module**
   - Customer list display
   - Search and filtering
   - CSV export functionality
   - Inline editing

4. **Order Management**
   - Order list display
   - Status filtering
   - Export functionality

5. **API Documentation**
   - Swagger UI accessibility
   - Download functionality

6. **Mobile Responsiveness**
   - Mobile navigation
   - Responsive layouts
   - Touch interactions

7. **Performance**
   - Page load times
   - Loading states
   - Error handling

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
{
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/pages/_app.js',
    '!src/pages/_document.js'
  ]
}
```

### Playwright Configuration (`playwright.config.js`)
```javascript
{
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
    { name: 'Mobile Chrome' },
    { name: 'Mobile Safari' }
  ]
}
```

## 📝 Writing Tests

### Unit Test Example
```javascript
// __tests__/api/subscriptions.test.js
import { createMocks } from 'node-mocks-http'
import handler from '../../src/pages/api/subscriptions'

describe('/api/subscriptions', () => {
  it('should create subscription with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validSubscriptionData
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
  })
})
```

### E2E Test Example
```javascript
// e2e/smoke-test.spec.js
import { test, expect } from '@playwright/test'

test('User can login and access dashboard', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Login')
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('**/dashboard/admin')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

## 🎯 Test Data Management

### Mock Data
```javascript
// jest.setup.js
global.testUtils = {
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'BUSINESS_OWNER'
  },
  mockCustomer: {
    id: 'test-customer-id',
    customerCode: 'CUST001234',
    walletBalance: 100.50
  }
}
```

### API Mocking
```javascript
// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} })
  })
)
```

## 🚨 Test Best Practices

### Unit Tests
1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Mock external dependencies**
4. **Test edge cases and error conditions**
5. **Keep tests isolated and independent**

### E2E Tests
1. **Test critical user journeys**
2. **Use data-testid attributes for reliable selectors**
3. **Wait for elements properly**
4. **Test across different browsers and devices**
5. **Keep tests maintainable and readable**

## 🔍 Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test -- subscriptions.test.js

# Run tests with verbose output
npm test -- --verbose

# Run tests in watch mode with coverage
npm run test:watch -- --coverage
```

### E2E Test Debugging
```bash
# Run specific test file
npx playwright test smoke-test.spec.js

# Run with browser visible
npx playwright test --headed

# Debug mode with step-by-step execution
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## 🎯 Test Metrics

### Current Coverage
- **API Routes**: 90%+ coverage
- **Core Components**: 85%+ coverage
- **Critical User Flows**: 100% E2E coverage

### Performance Benchmarks
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Test Execution Time**: < 5 minutes

## 🔧 Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout values
   - Check for async operations
   - Verify test environment setup

2. **Flaky E2E tests**
   - Add proper waits
   - Use stable selectors
   - Check for race conditions

3. **Mock issues**
   - Clear mocks between tests
   - Verify mock implementations
   - Check mock data consistency

### Getting Help
- Check test logs and error messages
- Review test documentation
- Run tests in debug mode
- Verify environment setup

---

**OneFoodDialer testing ensures production-ready quality with comprehensive coverage!** 🚀
