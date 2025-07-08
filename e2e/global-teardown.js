// OneFoodDialer - Playwright Global Teardown
async function globalTeardown() {
  console.log('🧹 Starting OneFoodDialer E2E Test Cleanup...');

  try {
    // Cleanup test data if needed
    console.log('🗑️ Cleaning up test data...');

    // You can add API calls here to cleanup test data
    // Example: Delete test users, customers, orders, etc.

    console.log('✅ Test cleanup completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

module.exports = globalTeardown;
