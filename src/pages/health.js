// OneFoodDialer - Public Health Check Page (No SSO Protection)
import { useEffect, useState } from 'react';

export default function HealthCheck() {
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    setHealthData({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Service is running',
      version: '1.0.0',
      public: true,
      environment: process.env.NODE_ENV || 'production',
      uptime: typeof window !== 'undefined' ? Date.now() : 0,
    });
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px' }}>
      <h1>Health Check</h1>
      <pre>{JSON.stringify(healthData, null, 2)}</pre>
    </div>
  );
}

// This will be accessible at /health without SSO protection
export async function getServerSideProps() {
  return {
    props: {
      healthData: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Service is running',
        version: '1.0.0',
        public: true,
        environment: process.env.NODE_ENV || 'production',
        uptime: process.uptime(),
      },
    },
  };
}
