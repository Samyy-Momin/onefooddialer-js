// OneFoodDialer - Sentry Client Configuration
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

// Only initialize Sentry if DSN is provided and valid
if (SENTRY_DSN && SENTRY_DSN.startsWith('https://')) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Error Filtering
    beforeSend(event, hint) {
      // Filter out common non-critical errors
      const error = hint.originalException;

      if (error && error.message) {
        // Ignore network errors
        if (error.message.includes('Network Error') || error.message.includes('fetch')) {
          return null;
        }

        // Ignore cancelled requests
        if (error.message.includes('AbortError') || error.message.includes('cancelled')) {
          return null;
        }

        // Ignore non-critical UI errors
        if (
          error.message.includes('ResizeObserver') ||
          error.message.includes('Non-Error promise rejection')
        ) {
          return null;
        }
      }

      return event;
    },

    // Additional context
    initialScope: {
      tags: {
        component: 'onefooddialer-frontend',
      },
    },

    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',

    // Integrations
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
} else {
  console.warn('Sentry DSN not provided or invalid - Sentry monitoring disabled');
}
