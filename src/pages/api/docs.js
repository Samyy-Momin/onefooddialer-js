// OneFoodDialer - Swagger OpenAPI Specification Endpoint
import swaggerSpec from '../../lib/swagger-spec';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      message: 'Only GET requests are supported for API documentation',
    });
  }

  try {
    // Set CORS headers for Swagger UI
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Add server URL based on environment
    const serverUrl = req.headers.host
      ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api`
      : 'http://localhost:3000/api';

    const spec = {
      ...swaggerSpec,
      servers: [
        {
          url: serverUrl,
          description:
            process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
        },
      ],
    };

    return res.status(200).json(spec);
  } catch (error) {
    console.error('Error serving API documentation:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to load API documentation',
    });
  }
}
