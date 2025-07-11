// OneFoodDialer - Deployment Health Check E2E Test
import { test, expect } from '@playwright/test';

test.describe('Deployment Health Checks', () => {
  test('Health endpoints are accessible', async ({ page }) => {
    await test.step('Check /status endpoint', async () => {
      const response = await page.request.get('/status');
      expect(response.status()).toBe(200);
      const text = await response.text();
      expect(text).toContain('OK');
    });

    await test.step('Check /api/status endpoint', async () => {
      const response = await page.request.get('/api/status');
      expect(response.status()).toBe(200);
      const json = await response.json();
      expect(json.status).toBe('ok');
      expect(json.public).toBe(true);
    });

    await test.step('Check /health.json endpoint', async () => {
      const response = await page.request.get('/health.json');
      expect(response.status()).toBe(200);
      const json = await response.json();
      expect(json.status).toBe('ok');
    });
  });

  test('Application loads successfully', async ({ page }) => {
    await test.step('Homepage loads', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/OneFoodDialer/);
    });

    await test.step('Login page is accessible', async () => {
      await page.goto('/login');
      await expect(page.locator('text=Login')).toBeVisible();
    });

    await test.step('API documentation is accessible', async () => {
      await page.goto('/docs');
      await expect(page.locator('h1')).toContainText('API Documentation');
    });
  });

  test('Critical API endpoints respond correctly', async ({ page }) => {
    await test.step('API health check', async () => {
      const response = await page.request.get('/api/health');
      // Should be 200 or 401 (if SSO protected)
      expect([200, 401]).toContain(response.status());
    });

    await test.step('API docs endpoint', async () => {
      const response = await page.request.get('/api/docs');
      expect(response.status()).toBe(200);
    });
  });

  test('Environment-specific checks', async ({ page }) => {
    const baseURL = page.context().options.baseURL || 'http://localhost:3000';

    await test.step('Verify deployment environment', async () => {
      console.log(`Testing against: ${baseURL}`);

      if (baseURL.includes('vercel.app')) {
        console.log('Running against Vercel deployment');

        // Vercel-specific checks
        const response = await page.request.get('/api/status');
        const json = await response.json();
        expect(json.environment).toBe('production');
      } else if (baseURL.includes('localhost')) {
        console.log('Running against local development server');
      } else {
        console.log('Running against custom deployment');
      }
    });

    await test.step('Performance check', async () => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      console.log(`Page load time: ${loadTime}ms`);

      // Should load within 5 seconds for deployed apps
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
