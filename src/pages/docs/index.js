// OneFoodDialer - API Documentation Page with Swagger UI
import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { AdminRoute } from '../../components/ProtectedRoute';

export default function ApiDocs() {
  useEffect(() => {
    // Load Swagger UI dynamically
    const loadSwaggerUI = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Import Swagger UI bundle
          const SwaggerUIBundle = (await import('swagger-ui-dist/swagger-ui-bundle.js')).default;
          
          SwaggerUIBundle({
            url: '/api/docs',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.presets.standalone
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
            requestInterceptor: (request) => {
              // Add auth token if available
              const token = localStorage.getItem('supabase.auth.token');
              if (token) {
                request.headers.Authorization = `Bearer ${token}`;
              }
              return request;
            },
            responseInterceptor: (response) => {
              // Handle response logging
              console.log('API Response:', response);
              return response;
            },
            onComplete: () => {
              console.log('Swagger UI loaded successfully');
            },
            onFailure: (error) => {
              console.error('Swagger UI failed to load:', error);
            }
          });
        } catch (error) {
          console.error('Failed to load Swagger UI:', error);
        }
      }
    };

    loadSwaggerUI();
  }, []);

  return (
    <AdminRoute>
      <Layout title="API Documentation">
        <Head>
          <title>API Documentation - OneFoodDialer</title>
          <meta name="description" content="Complete API documentation for OneFoodDialer subscription management system" />
          <link
            rel="stylesheet"
            type="text/css"
            href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css"
          />
          <style jsx>{`
            .swagger-ui .topbar {
              display: none;
            }
            .swagger-ui .info {
              margin: 20px 0;
            }
            .swagger-ui .scheme-container {
              background: #fafafa;
              padding: 10px;
              border-radius: 4px;
            }
          `}</style>
        </Head>
        
        <div className="min-h-screen bg-gray-50">
          {/* Header Section */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  OneFoodDialer API Documentation
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  Comprehensive REST API documentation for the OneFoodDialer subscription-based 
                  business management system. Explore endpoints, test requests, and integrate with ease.
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-900">50+</div>
                    <div className="text-sm text-blue-700">API Endpoints</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-900">8</div>
                    <div className="text-sm text-green-700">Core Modules</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-900">JWT</div>
                    <div className="text-sm text-yellow-700">Authentication</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-900">REST</div>
                    <div className="text-sm text-purple-700">API Standard</div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <a
                    href="/api/docs"
                    download="onefooddialer-openapi.json"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download OpenAPI Spec
                  </a>
                  
                  <a
                    href="/docs/postman-collection.json"
                    download="onefooddialer-postman.json"
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Download Postman Collection
                  </a>
                  
                  <button
                    onClick={() => {
                      const baseUrl = window.location.origin + '/api';
                      navigator.clipboard.writeText(baseUrl);
                      alert('Base URL copied to clipboard!');
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Base URL
                  </button>
                </div>

                {/* API Modules Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">🔐 Authentication</h3>
                    <p className="text-sm text-gray-600">Login, signup, logout, token management</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">👥 CRM</h3>
                    <p className="text-sm text-gray-600">Customer management, profiles, loyalty</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">📦 Orders</h3>
                    <p className="text-sm text-gray-600">Order processing, tracking, fulfillment</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">🔄 Subscriptions</h3>
                    <p className="text-sm text-gray-600">Subscription plans, renewals, management</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">🧾 Billing</h3>
                    <p className="text-sm text-gray-600">Invoices, payments, financial tracking</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">💰 Wallet</h3>
                    <p className="text-sm text-gray-600">Digital wallet, transactions, balances</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">🍳 Kitchen</h3>
                    <p className="text-sm text-gray-600">Kitchen management, menu items, capacity</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">📊 Analytics</h3>
                    <p className="text-sm text-gray-600">Dashboard stats, reports, insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Swagger UI Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div id="swagger-ui" className="min-h-screen">
                {/* Loading state */}
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading API Documentation...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-800 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">📧 Support</h4>
                  <p className="text-gray-300">support@onefooddialer.com</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📚 Documentation</h4>
                  <p className="text-gray-300">Complete guides and tutorials</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🚀 Rate Limits</h4>
                  <p className="text-gray-300">1000 requests/hour per user</p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-700">
                <p className="text-gray-400">
                  © 2025 OneFoodDialer. Built with ❤️ for food delivery businesses.
                </p>
              </div>
            </div>
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
