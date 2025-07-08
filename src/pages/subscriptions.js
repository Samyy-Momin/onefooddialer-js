// OneFoodDialer - Subscriptions Page using ListPage Component
import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import ListPage from '../components/ListPage';
import { BusinessRoute } from '../components/ProtectedRoute';

export default function Subscriptions() {
  const handleRowClick = subscription => {
    // Navigate to subscription detail page
    window.location.href = `/subscriptions/${subscription.id}`;
  };

  return (
    <BusinessRoute>
      <Navbar />
      <ListPage
        title="Subscription Management"
        dataUrl="/api/subscriptions"
        columns={[
          { label: 'Customer', key: 'customer.user.profile.firstName' },
          { label: 'Email', key: 'customer.user.email' },
          { label: 'Plan', key: 'plan.name' },
          { label: 'Plan Type', key: 'plan.type' },
          { label: 'Price', key: 'plan.price' },
          { label: 'Kitchen', key: 'kitchen.name' },
          { label: 'Start Date', key: 'startDate' },
          { label: 'End Date', key: 'endDate' },
          { label: 'Next Billing', key: 'nextBillingDate' },
          { label: 'Status', key: 'status' },
          { label: 'Auto Renew', key: 'autoRenew' },
        ]}
        filters={[
          {
            label: 'Search Customer',
            key: 'search',
            type: 'text',
          },
          {
            label: 'Status',
            key: 'status',
            type: 'select',
            options: ['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'],
          },
          {
            label: 'Plan Type',
            key: 'planType',
            type: 'select',
            options: ['DAILY', 'WEEKLY', 'MONTHLY'],
          },
          {
            label: 'Kitchen',
            key: 'kitchenId',
            type: 'select',
            options: [], // This would be populated from API
          },
          {
            label: 'Auto Renew',
            key: 'autoRenew',
            type: 'select',
            options: ['true', 'false'],
          },
        ]}
        renderActions={
          <div className="flex space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Export Subscriptions
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
              Bulk Actions
            </button>
            <Link
              href="/subscriptions/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Create Subscription
            </Link>
          </div>
        }
        onRowClick={handleRowClick}
        emptyMessage="No subscriptions found. Create your first subscription to get started."
        pageSize={12}
      />
    </BusinessRoute>
  );
}
