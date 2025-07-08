// OneFoodDialer - Protected Route Component
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { getCurrentUserWithBusiness } from '../lib/auth';

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requireBusiness = true,
  redirectTo = '/login',
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push(redirectTo);
          return;
        }

        const userWithBusiness = await getCurrentUserWithBusiness(session.user.id);

        if (!userWithBusiness) {
          router.push('/unauthorized');
          return;
        }

        // Check role authorization
        if (allowedRoles.length > 0 && !allowedRoles.includes(userWithBusiness.role)) {
          router.push('/unauthorized');
          return;
        }

        // Check business requirement
        if (
          requireBusiness &&
          !userWithBusiness.businessId &&
          userWithBusiness.role !== 'SUPER_ADMIN'
        ) {
          router.push('/setup-business');
          return;
        }

        setUser(userWithBusiness);
        setAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push(redirectTo);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [allowedRoles, requireBusiness, redirectTo, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Router will handle redirect
  }

  return children;
}

// Specific role-based wrappers
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BUSINESS_OWNER']}>{children}</ProtectedRoute>
  );
}

export function CustomerRoute({ children }) {
  return <ProtectedRoute allowedRoles={['CUSTOMER']}>{children}</ProtectedRoute>;
}

export function KitchenRoute({ children }) {
  return <ProtectedRoute allowedRoles={['KITCHEN_MANAGER', 'STAFF']}>{children}</ProtectedRoute>;
}

export function BusinessRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['BUSINESS_OWNER', 'KITCHEN_MANAGER', 'STAFF']}>
      {children}
    </ProtectedRoute>
  );
}
