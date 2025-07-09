// OneFoodDialer - Sentry Server Configuration
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

// Only initialize Sentry if DSN is provided and valid
if (SENTRY_DSN && SENTRY_DSN.startsWith('https://')) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Error Filtering
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error && error.message) {
        // Ignore database connection timeouts in development
        if (
          process.env.NODE_ENV === 'development' &&
          error.message.includes('connect ECONNREFUSED')
        ) {
          return null;
        }

        // Ignore Prisma client initialization errors in serverless
        if (error.message.includes('PrismaClient is unable to be run in the browser')) {
          return null;
        }
      }

      return event;
    },

    // Additional context
    initialScope: {
      tags: {
        component: 'onefooddialer-backend',
      },
    },

    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
  });
} else {
  console.warn('Sentry DSN not provided or invalid - Sentry monitoring disabled');
}
