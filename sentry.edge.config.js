// OneFoodDialer - Sentry Edge Runtime Configuration
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance Monitoring (lower sample rate for edge)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

  // Additional context
  initialScope: {
    tags: {
      component: 'onefooddialer-edge',
    },
  },

  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
});
