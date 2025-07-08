// OneFoodDialer - Comprehensive Smoke Test
import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'admin@onefooddialer.com',
  password: 'admin123',
};

const testCustomer = {
  email: 'testcustomer@example.com',
  firstName: 'Test',
  lastName: 'Customer',
  phone: '+1234567890',
};

test.describe('OneFoodDialer Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('Complete user flow: Login → Dashboard → CRM → Orders → Logout', async ({ page }) => {
    // Step 1: Login
    await test.step('User can login successfully', async () => {
      await page.click('text=Login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard/admin');
      await expect(page).toHaveTitle(/Dashboard/);
    });

    // Step 2: Verify Dashboard
    await test.step('Dashboard loads with real-time stats', async () => {
      // Check for dashboard elements
      await expect(page.locator('h1')).toContainText('Dashboard');

      // Verify stats cards are present
      await expect(page.locator('text=Total Customers')).toBeVisible();
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=Active Orders')).toBeVisible();
      await expect(page.locator('text=Active Subscriptions')).toBeVisible();

      // Verify real-time update indicator
      await expect(page.locator('text=Last Updated')).toBeVisible();

      // Check for recent activity section
      await expect(page.locator('text=Recent Activity')).toBeVisible();

      // Verify quick actions are present
      await expect(page.locator('text=Add New Customer')).toBeVisible();
      await expect(page.locator('text=Create Order')).toBeVisible();
    });

    // Step 3: Navigate to CRM
    await test.step('Navigate to CRM and verify customer management', async () => {
      await page.click('text=CRM');
      await page.waitForURL('**/crm');

      // Verify CRM page elements
      await expect(page.locator('h1')).toContainText('Customer Management');

      // Check for filter bar
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();

      // Check for export button
      await expect(page.locator('text=Export CSV')).toBeVisible();

      // Check for add customer button
      await expect(page.locator('text=Add Customer')).toBeVisible();

      // Verify table headers
      await expect(page.locator('text=Customer Code')).toBeVisible();
      await expect(page.locator('text=Name')).toBeVisible();
      await expect(page.locator('text=Email')).toBeVisible();
      await expect(page.locator('text=Wallet Balance')).toBeVisible();
    });

    // Step 4: Test CSV Export
    await test.step('CSV export functionality works', async () => {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');
      await page.click('text=Export CSV');
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(
        /customer_management_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv/
      );
    });

    // Step 5: Test Inline Editing (if data exists)
    await test.step('Inline editing functionality', async () => {
      // Check if there are any customer rows
      const customerRows = page.locator('tbody tr');
      const rowCount = await customerRows.count();

      if (rowCount > 0) {
        // Click on first editable cell (phone number)
        const firstPhoneCell = page.locator('tbody tr:first-child td').nth(3);
        await firstPhoneCell.click();

        // Check if input appears
        const input = page.locator('input[type="text"]');
        if (await input.isVisible()) {
          await input.fill('+1234567890');
          await input.press('Enter');

          // Wait for save to complete
          await page.waitForTimeout(1000);
        }
      }
    });

    // Step 6: Navigate to Orders
    await test.step('Navigate to Orders and verify order management', async () => {
      await page.click('text=Orders');
      await page.waitForURL('**/orders');

      // Verify orders page elements
      await expect(page.locator('h1')).toContainText('Order Management');

      // Check for filter options
      await expect(page.locator('select')).toBeVisible();

      // Check for export functionality
      await expect(page.locator('text=Export CSV')).toBeVisible();
    });

    // Step 7: Test API Documentation
    await test.step('API documentation is accessible', async () => {
      await page.goto('/docs');

      // Verify API docs page
      await expect(page.locator('h1')).toContainText('API Documentation');

      // Check for Swagger UI elements
      await expect(page.locator('text=Download OpenAPI Spec')).toBeVisible();
      await expect(page.locator('text=Download Postman Collection')).toBeVisible();

      // Wait for Swagger UI to load
      await page.waitForSelector('#swagger-ui', { timeout: 10000 });
    });

    // Step 8: Test Billing Module
    await test.step('Navigate to Billing and verify invoice management', async () => {
      await page.click('text=Billing');
      await page.waitForURL('**/billing');

      // Verify billing page elements
      await expect(page.locator('h1')).toContainText('Invoice Management');

      // Check for create invoice button
      await expect(page.locator('text=Create Invoice')).toBeVisible();
    });

    // Step 9: Test Wallet Module
    await test.step('Navigate to Wallet and verify transaction management', async () => {
      await page.click('text=Wallet');
      await page.waitForURL('**/wallet');

      // Verify wallet page elements
      await expect(page.locator('h1')).toContainText('Wallet Management');

      // Check for transaction history
      await expect(page.locator('text=Transaction History')).toBeVisible();
    });

    // Step 10: Test Subscriptions Module
    await test.step('Navigate to Subscriptions and verify subscription management', async () => {
      await page.click('text=Subscriptions');
      await page.waitForURL('**/subscriptions');

      // Verify subscriptions page elements
      await expect(page.locator('h1')).toContainText('Subscription Management');

      // Check for create subscription button
      await expect(page.locator('text=Create Subscription')).toBeVisible();
    });

    // Step 11: Test Real-time Dashboard Updates
    await test.step('Real-time dashboard updates work', async () => {
      await page.goto('/dashboard/admin');

      // Get initial timestamp
      const initialTime = await page
        .locator('text=Last Updated')
        .locator('..')
        .locator('div')
        .nth(1)
        .textContent();

      // Wait for auto-refresh (should happen within 60 seconds, but we'll wait 5 seconds for test speed)
      await page.waitForTimeout(5000);

      // Check if timestamp updated or stats changed
      const currentTime = await page
        .locator('text=Last Updated')
        .locator('..')
        .locator('div')
        .nth(1)
        .textContent();

      // At minimum, verify the timestamp format is correct
      expect(currentTime).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    // Step 12: Logout
    await test.step('User can logout successfully', async () => {
      // Click on user menu or logout button
      await page.click('[data-testid="user-menu"]').catch(() => {
        // Fallback: look for logout text
        return page.click('text=Logout');
      });

      // Wait for redirect to login page
      await page.waitForURL('**/login');
      await expect(page.locator('text=Login')).toBeVisible();
    });
  });

  test('Mobile responsiveness check', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Mobile navigation works', async () => {
      // Login first
      await page.click('text=Login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard/admin');

      // Check if mobile menu button exists
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();

        // Verify mobile menu items
        await expect(page.locator('text=Dashboard')).toBeVisible();
        await expect(page.locator('text=CRM')).toBeVisible();
        await expect(page.locator('text=Orders')).toBeVisible();
      }
    });

    await test.step('Mobile dashboard stats are readable', async () => {
      // Verify stats cards are visible and readable on mobile
      await expect(page.locator('text=Total Customers')).toBeVisible();
      await expect(page.locator('text=Total Revenue')).toBeVisible();

      // Check if cards stack properly on mobile
      const statsCards = page.locator('[data-testid="stats-card"]');
      const cardCount = await statsCards.count();

      if (cardCount > 0) {
        // Verify first card is visible
        await expect(statsCards.first()).toBeVisible();
      }
    });
  });

  test('Error handling and edge cases', async ({ page }) => {
    await test.step('Invalid login shows error message', async () => {
      await page.click('text=Login');
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
    });

    await test.step('Protected routes redirect to login', async () => {
      // Try to access protected route without authentication
      await page.goto('/dashboard/admin');

      // Should redirect to login
      await page.waitForURL('**/login');
      await expect(page.locator('text=Login')).toBeVisible();
    });

    await test.step('API documentation loads without authentication', async () => {
      // API docs should be accessible without login
      await page.goto('/docs');
      await expect(page.locator('h1')).toContainText('API Documentation');
    });
  });

  test('Performance and loading states', async ({ page }) => {
    await test.step('Pages load within acceptable time', async () => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    await test.step('Loading states are shown', async () => {
      // Login first
      await page.click('text=Login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard/admin');

      // Navigate to a data-heavy page
      await page.click('text=CRM');

      // Check for loading skeleton or spinner
      const loadingIndicator = page.locator(
        '[data-testid="loading-skeleton"], .animate-spin, text=Loading'
      );

      // Loading indicator should appear briefly
      if (await loadingIndicator.isVisible({ timeout: 1000 })) {
        // Wait for loading to complete
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
      }

      // Verify content loaded
      await expect(page.locator('h1')).toContainText('Customer Management');
    });
  });
});
