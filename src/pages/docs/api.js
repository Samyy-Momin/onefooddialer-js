// OneFoodDialer - API Documentation Page
import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { AdminRoute } from '../../components/ProtectedRoute';
import swaggerSpec from '../../lib/swagger';

export default function ApiDocs() {
  useEffect(() => {
    // Load Swagger UI dynamically
    const loadSwaggerUI = async () => {
      if (typeof window !== 'undefined') {
        // Import Swagger UI bundle
        const SwaggerUIBundle = (await import('swagger-ui-dist/swagger-ui-bundle.js')).default;

        SwaggerUIBundle({
          url: '/api/docs',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.presets.standalone],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: 'StandaloneLayout',
          tryItOutEnabled: true,
          requestInterceptor: request => {
            // Add auth token if available
            const token = localStorage.getItem('supabase.auth.token');
            if (token) {
              request.headers.Authorization = `Bearer ${token}`;
            }
            return request;
          },
        });
      }
    };

    loadSwaggerUI();
  }, []);

  return (
    <AdminRoute>
      <Layout title="API Documentation">
        <Head>
          <title>API Documentation - OneFoodDialer</title>
          <link
            rel="stylesheet"
            type="text/css"
            href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css"
          />
        </Head>

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              OneFoodDialer API Documentation
            </h1>
            <p className="text-gray-600 mb-6">
              Comprehensive REST API documentation for the OneFoodDialer subscription management
              system.
            </p>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Authentication</h3>
                <p className="text-sm text-blue-700">
                  All endpoints require Bearer token authentication
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Base URL</h3>
                <p className="text-sm text-green-700 font-mono">
                  {process.env.NODE_ENV === 'production'
                    ? 'https://onefooddialer.vercel.app/api'
                    : 'http://localhost:3000/api'}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Rate Limits</h3>
                <p className="text-sm text-yellow-700">1000 requests per hour per API key</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Support</h3>
                <p className="text-sm text-purple-700">support@onefooddialer.com</p>
              </div>
            </div>

            {/* Download Links */}
            <div className="flex space-x-4 mb-8">
              <a
                href="/api/docs"
                download="onefooddialer-api.json"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download OpenAPI Spec
              </a>

              <a
                href="/docs/postman-collection.json"
                download="onefooddialer-postman.json"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Download Postman Collection
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/api');
                  alert('Base URL copied to clipboard!');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Copy Base URL
              </button>
            </div>
          </div>

          {/* Swagger UI Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div id="swagger-ui"></div>
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
}

// Export the swagger spec as JSON endpoint
export async function getServerSideProps() {
  return {
    props: {},
  };
}
