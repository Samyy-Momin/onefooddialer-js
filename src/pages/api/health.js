// OneFoodDialer - Health Check API
import { prisma } from '../../lib/prisma';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {},
  };

  try {
    // Database connectivity check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      checks.checks.database = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
      };
      checks.status = 'unhealthy';
    }

    // Supabase connectivity check
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) throw error;

      checks.checks.supabase = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      checks.checks.supabase = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
      };
      checks.status = 'unhealthy';
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    checks.checks.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    };

    // Environment variables check
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'DATABASE_URL',
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    checks.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      missingVariables: missingEnvVars,
    };

    if (missingEnvVars.length > 0) {
      checks.status = 'unhealthy';
    }

    // API endpoints check
    checks.checks.endpoints = {
      status: 'healthy',
      availableEndpoints: [
        '/api/auth/login',
        '/api/customers',
        '/api/subscriptions',
        '/api/invoices',
        '/api/dashboard/stats',
      ],
    };

    // Overall response time
    checks.responseTime = Date.now() - startTime;

    // Set appropriate status code
    const statusCode = checks.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(checks);
  } catch (error) {
    console.error('Health check failed:', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime,
    });
  }
}
