// OneFoodDialer - Health Check API (Public - No Authentication Required)
// This endpoint MUST be publicly accessible for CI/CD health checks

export default function handler(req, res) {
  // Set CORS headers to ensure public access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple public health check - always returns 200 OK
  // No authentication, no database calls, no external dependencies
  try {
    const healthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      message: 'Service is running',
      version: '1.0.0',
      public: true,
    };

    return res.status(200).json(healthResponse);
  } catch (error) {
    // Even if there's an error, return 200 for health checks
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Service is running with warnings',
      error: error.message,
      public: true,
    });
  }
}
