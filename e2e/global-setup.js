// OneFoodDialer - Playwright Global Setup
const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting OneFoodDialer E2E Test Setup...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Check if the application is responding
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Application is ready');

    // Setup test data if needed
    console.log('📊 Setting up test data...');

    // You can add API calls here to seed test data
    // Example: Create test users, customers, orders, etc.

    console.log('✅ Test setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
