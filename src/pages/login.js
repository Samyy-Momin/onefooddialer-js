// OneFoodDialer - Login Page with Role-based Redirects
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signInWithSupabase } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const redirectBasedOnRole = user => {
      const role = user.role || user.user_metadata?.role;

      switch (role) {
        case 'SUPER_ADMIN':
          router.push('/dashboard/admin');
          break;
        case 'BUSINESS_OWNER':
          router.push('/dashboard/admin');
          break;
        case 'KITCHEN_MANAGER':
          router.push('/dashboard/kitchen');
          break;
        case 'STAFF':
          router.push('/dashboard/kitchen');
          break;
        case 'CUSTOMER':
          router.push('/customer');
          break;
        default:
          router.push('/customer');
      }
    };

    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        redirectBasedOnRole(session.user);
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user, session, profile } = await signInWithSupabase(
        formData.email,
        formData.password
      );

      if (user && profile) {
        // Store user data in localStorage for client-side access
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: user.id,
            email: user.email,
            role: profile.role,
            businessId: profile.businessId,
            businesses: profile.businesses,
          })
        );

        // Redirect based on role
        const role = profile.role || profile.user_metadata?.role;

        switch (role) {
          case 'SUPER_ADMIN':
            router.push('/dashboard/admin');
            break;
          case 'BUSINESS_OWNER':
            router.push('/dashboard/admin');
            break;
          case 'KITCHEN_MANAGER':
            router.push('/dashboard/kitchen');
            break;
          case 'STAFF':
            router.push('/dashboard/kitchen');
            break;
          case 'CUSTOMER':
            router.push('/customer');
            break;
          default:
            router.push('/customer');
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to OneFoodDialer
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-100 text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
              <div className="bg-white p-3 rounded border">
                <p className="font-semibold">Admin: admin@onefooddialer.com</p>
                <p className="text-gray-600">Password: admin123</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="font-semibold">Customer: customer@onefooddialer.com</p>
                <p className="text-gray-600">Password: customer123</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="font-semibold">Kitchen: kitchen@onefooddialer.com</p>
                <p className="text-gray-600">Password: kitchen123</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
