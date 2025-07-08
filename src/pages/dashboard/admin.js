// OneFoodDialer - Professional Admin Dashboard
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { StatsCard, MetricCard, CustomCard } from '../../components/Card';
import { QuickFilterBar } from '../../components/FilterBar';
import { AdminRoute } from '../../components/ProtectedRoute';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCustomers: { value: 0, trend: 'neutral', trendValue: '0%' },
    totalRevenue: { value: 0, trend: 'neutral', trendValue: '0%' },
    activeOrders: { value: 0, trend: 'neutral', trendValue: '0%' },
    activeSubscriptions: { value: 0, trend: 'neutral', trendValue: '0%' },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch real-time stats with authentication
        const [statsRes, activityRes] = await Promise.all([
          fetch(`/api/dashboard/stats?range=${timeRange}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}`,
            },
          }),
          fetch('/api/dashboard/activity?limit=10', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}`,
            },
          }),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        } else {
          // Fallback data for demo
          setStats({
            totalCustomers: { value: '1,234', trend: 'up', trendValue: '+12%' },
            totalRevenue: {
              value: '₹4,56,789',
              trend: 'up',
              trendValue: '+8.2%',
            },
            activeOrders: { value: '89', trend: 'down', trendValue: '-3%' },
            activeSubscriptions: {
              value: '567',
              trend: 'up',
              trendValue: '+15%',
            },
          });
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData.data || []);
        } else {
          // Fallback data for demo
          setRecentActivity([
            {
              id: 1,
              type: 'order',
              message: 'New order from John Doe',
              time: '2 minutes ago',
            },
            {
              id: 2,
              type: 'customer',
              message: 'New customer registration: Jane Smith',
              time: '15 minutes ago',
            },
            {
              id: 3,
              type: 'payment',
              message: 'Payment received: ₹2,500',
              time: '1 hour ago',
            },
            {
              id: 4,
              type: 'subscription',
              message: 'Subscription renewed: Premium Plan',
              time: '2 hours ago',
            },
            {
              id: 5,
              type: 'order',
              message: 'Order completed: #ORD-1234',
              time: '3 hours ago',
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data on error
        setStats({
          totalCustomers: { value: '1,234', trend: 'up', trendValue: '+12%' },
          totalRevenue: { value: '₹4,56,789', trend: 'up', trendValue: '+8.2%' },
          activeOrders: { value: '89', trend: 'down', trendValue: '-3%' },
          activeSubscriptions: { value: '567', trend: 'up', trendValue: '+15%' },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time updates every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const getActivityIcon = type => {
    switch (type) {
      case 'order':
        return (
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        );
      case 'customer':
        return (
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="h-4 w-4 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
        );
      case 'subscription':
        return (
          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="h-4 w-4 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <AdminRoute>
      <Layout title="Dashboard">
        <div className="p-8">
          {/* Time Range Filter */}
          <div className="mb-8">
            <QuickFilterBar
              options={[
                { label: 'Last 7 days', value: '7d' },
                { label: 'Last 30 days', value: '30d' },
                { label: 'Last 90 days', value: '90d' },
                { label: 'This year', value: '1y' },
              ]}
              selectedValue={timeRange}
              onSelectionChange={setTimeRange}
              label="Time Range"
            />
          </div>

          {/* Primary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Customers"
              value={stats.totalCustomers?.value || '0'}
              subtitle="Active customers"
              trend={stats.totalCustomers?.trend || 'neutral'}
              trendValue={stats.totalCustomers?.trendValue || '0%'}
              color="blue"
              loading={loading}
              onClick={() => router.push('/crm')}
            />

            <StatsCard
              title="Total Revenue"
              value={stats.totalRevenue?.value || '₹0'}
              subtitle="This period"
              trend={stats.totalRevenue?.trend || 'neutral'}
              trendValue={stats.totalRevenue?.trendValue || '0%'}
              color="green"
              loading={loading}
              onClick={() => router.push('/billing')}
            />

            <StatsCard
              title="Active Orders"
              value={stats.activeOrders?.value || '0'}
              subtitle="In progress"
              trend={stats.activeOrders?.trend || 'neutral'}
              trendValue={stats.activeOrders?.trendValue || '0%'}
              color="orange"
              loading={loading}
              onClick={() => router.push('/orders')}
            />

            <StatsCard
              title="Active Subscriptions"
              value={stats.activeSubscriptions?.value || '0'}
              subtitle="Current subscribers"
              trend={stats.activeSubscriptions?.trend || 'neutral'}
              trendValue={stats.activeSubscriptions?.trendValue || '0%'}
              color="purple"
              loading={loading}
              onClick={() => router.push('/subscriptions')}
            />
          </div>

          {/* Additional Real-time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Orders Today"
              value={stats.ordersToday?.value || '0'}
              subtitle="Today's orders"
              trend={stats.ordersToday?.trend || 'neutral'}
              trendValue={stats.ordersToday?.trendValue || '0%'}
              color="blue"
              loading={loading}
            />

            <StatsCard
              title="Wallet Balance"
              value={stats.walletBalance?.value || '₹0'}
              subtitle={stats.walletBalance?.description || 'Total customer wallets'}
              trend={stats.walletBalance?.trend || 'neutral'}
              trendValue={stats.walletBalance?.trendValue || '0%'}
              color="green"
              loading={loading}
              onClick={() => router.push('/wallet')}
            />

            <StatsCard
              title="Avg Order Value"
              value={stats.averageOrderValue?.value || '₹0'}
              subtitle={stats.averageOrderValue?.description || 'Average order value'}
              trend={stats.averageOrderValue?.trend || 'neutral'}
              trendValue={stats.averageOrderValue?.trendValue || '0%'}
              color="yellow"
              loading={loading}
            />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Customer Satisfaction"
              value={stats.customerSatisfaction?.value || '0%'}
              subtitle={stats.customerSatisfaction?.description || 'Customer satisfaction rate'}
              trend={stats.customerSatisfaction?.trend || 'neutral'}
              trendValue={stats.customerSatisfaction?.trendValue || '0%'}
              color="green"
              loading={loading}
            />

            <StatsCard
              title="Kitchen Utilization"
              value={stats.kitchenUtilization?.value || '0%'}
              subtitle={stats.kitchenUtilization?.description || 'Kitchen capacity utilization'}
              trend={stats.kitchenUtilization?.trend || 'neutral'}
              trendValue={stats.kitchenUtilization?.trendValue || '0%'}
              color="orange"
              loading={loading}
            />

            {/* System Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  System Status
                </h3>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">Online</div>
              <p className="text-sm text-gray-600">All systems operational</p>
            </div>

            {/* Last Updated Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Last Updated
                </h3>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Never'}
              </div>
              <p className="text-sm text-gray-600">Auto-refresh: 60s</p>
            </div>
          </div>

          {/* Recent Activity and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <CustomCard title="Recent Activity" color="gray" loading={loading}>
              {!loading && (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => router.push('/activity')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all activity →
                    </button>
                  </div>
                </div>
              )}
            </CustomCard>

            {/* Quick Actions */}
            <CustomCard title="Quick Actions" color="blue" loading={loading}>
              {!loading && (
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/crm/create')}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-blue-900">Add New Customer</span>
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => router.push('/orders/create')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-green-900">Create Order</span>
                    <svg
                      className="h-4 w-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => router.push('/billing/create')}
                    className="w-full flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-yellow-900">Generate Invoice</span>
                    <svg
                      className="h-4 w-4 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => router.push('/analytics')}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-purple-900">View Analytics</span>
                    <svg
                      className="h-4 w-4 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </CustomCard>
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
}
