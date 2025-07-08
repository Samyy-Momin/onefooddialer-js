// OneFoodDialer - CRM Page using ListPage Component
import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import ListPage from '../components/ListPage';
import { AdminRoute } from '../components/ProtectedRoute';

export default function CRM() {
  const handleRowClick = customer => {
    // Navigate to customer detail page
    window.location.href = `/crm/${customer.id}`;
  };

  return (
    <AdminRoute>
      <Layout title="Customer Management">
        <ListPage
          title="Customer Management"
          dataUrl="/api/customers"
          columns={[
            { label: 'Customer Code', key: 'customerCode' },
            { label: 'Name', key: 'user.profile.firstName' },
            { label: 'Email', key: 'user.email' },
            { label: 'Phone', key: 'user.profile.phone' },
            { label: 'Wallet Balance', key: 'walletBalance' },
            { label: 'Loyalty Points', key: 'loyaltyPoints' },
            { label: 'Active Subscriptions', key: 'activeSubscriptions' },
            { label: 'Status', key: 'isActive' },
            { label: 'Joined Date', key: 'createdAt' },
          ]}
          filters={[
            {
              label: 'Search',
              key: 'search',
              type: 'text',
            },
            {
              label: 'Status',
              key: 'status',
              type: 'select',
              options: ['active', 'inactive'],
            },
            {
              label: 'Loyalty Tier',
              key: 'loyaltyTier',
              type: 'select',
              options: ['bronze', 'silver', 'gold', 'platinum'],
            },
            {
              label: 'Plan Type',
              key: 'planType',
              type: 'select',
              options: ['DAILY', 'WEEKLY', 'MONTHLY'],
            },
          ]}
          renderActions={
            <Link
              href="/crm/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Customer
            </Link>
          }
          onRowClick={handleRowClick}
          emptyMessage="No customers found. Add your first customer to get started."
          enableInlineEdit={true}
          editableColumns={['user.profile.phone', 'loyaltyPoints', 'isActive']}
        />
      </Layout>
    </AdminRoute>
  );
}
