// OneFoodDialer - Monitoring & Analytics Setup
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';

// Initialize LogRocket
export const initializeLogRocket = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LOGROCKET_APP_ID) {
    LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID, {
      // Configuration options
      console: {
        shouldAggregateConsoleErrors: true,
      },
      network: {
        requestSanitizer: request => {
          // Remove sensitive data from requests
          if (request.headers && request.headers.authorization) {
            request.headers.authorization = '[REDACTED]';
          }
          return request;
        },
        responseSanitizer: response => {
          // Remove sensitive data from responses
          if (response.body && typeof response.body === 'string') {
            try {
              const parsed = JSON.parse(response.body);
              if (parsed.password) parsed.password = '[REDACTED]';
              if (parsed.token) parsed.token = '[REDACTED]';
              response.body = JSON.stringify(parsed);
            } catch (e) {
              // Not JSON, leave as is
            }
          }
          return response;
        },
      },
      dom: {
        inputSanitizer: true,
        textSanitizer: true,
      },
    });

    // Setup React integration
    setupLogRocketReact(LogRocket);
  }
};

// Identify user for LogRocket
export const identifyUser = (user) => {
  if (typeof window !== 'undefined' && LogRocket) {
    LogRocket.identify(user.id, {
      name: `${user.profile?.firstName} ${user.profile?.lastName}`,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    });
  }
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
  if (typeof window !== 'undefined' && LogRocket) {
    LogRocket.track(eventName, properties);
  }
};

// Google Analytics setup
export const initializeGA = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom GA events
export const trackGAEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Error tracking utility
export const trackError = (error, context = {}) => {
  console.error('Application Error:', error, context);
  
  // Track in LogRocket
  if (typeof window !== 'undefined' && LogRocket) {
    LogRocket.captureException(error, {
      tags: {
        section: context.section || 'unknown',
        action: context.action || 'unknown',
      },
      extra: context,
    });
  }
  
  // Track in GA
  trackGAEvent('exception', 'error', error.message, 0);
};

// Performance monitoring
export const trackPerformance = (metricName, value, context = {}) => {
  // Track in LogRocket
  trackEvent(`performance_${metricName}`, {
    value,
    ...context,
  });
  
  // Track in GA
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metricName,
      value: Math.round(value),
      event_category: 'performance',
    });
  }
};

// Business metrics tracking
export const trackBusinessMetric = (metric, value, properties = {}) => {
  trackEvent(`business_${metric}`, {
    value,
    timestamp: new Date().toISOString(),
    ...properties,
  });
  
  trackGAEvent('business_metric', metric, JSON.stringify(properties), value);
};

// Initialize all monitoring services
export const initializeMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    initializeLogRocket();
    initializeGA();
  }
};
