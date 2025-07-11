// OneFoodDialer - Simple Status API (Public - No Authentication)
// This endpoint is designed to bypass Vercel SSO protection

export default function handler(req, res) {
  // Set headers to ensure this is treated as a public endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple status response - no external dependencies
  const statusResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Service is running',
    version: '1.0.0',
    public: true,
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    endpoint: '/api/status',
  };

  return res.status(200).json(statusResponse);
}
