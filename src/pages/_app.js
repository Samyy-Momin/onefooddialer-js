// OneFoodDialer - Main App Component with Monitoring
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import { initializeMonitoring, trackPageView, identifyUser } from '../lib/monitoring';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Initialize monitoring services
    initializeMonitoring();

    // Track page views
    const handleRouteChange = url => {
      trackPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    // Track initial page view
    trackPageView(router.asPath);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Global error boundary
  useEffect(() => {
    const handleError = event => {
      console.error('Global error:', event.error);
    };

    const handleUnhandledRejection = event => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <Component {...pageProps} />;
}
