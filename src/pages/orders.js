// OneFoodDialer - Orders Page using ListPage Component
import React from 'react';
import Layout from '../components/Layout';
import ListPage from '../components/ListPage';
import { BusinessRoute } from '../components/ProtectedRoute';

export default function Orders() {
  const handleRowClick = order => {
    // Navigate to order detail page
    window.location.href = `/orders/${order.id}`;
  };

  return (
    <BusinessRoute>
      <Layout title="Order Management">
        <ListPage
          title="Order Management"
          dataUrl="/api/orders"
          columns={[
            { label: 'Order ID', key: 'orderNumber' },
            { label: 'Customer', key: 'customer.user.profile.firstName' },
            { label: 'Plan', key: 'subscription.plan.name' },
            { label: 'Kitchen', key: 'kitchen.name' },
            { label: 'Amount', key: 'finalAmount' },
            { label: 'Scheduled For', key: 'scheduledFor' },
            { label: 'Status', key: 'status' },
            { label: 'Type', key: 'type' },
            { label: 'Created Date', key: 'createdAt' },
          ]}
          filters={[
            {
              label: 'Search Order ID',
              key: 'search',
              type: 'text',
            },
            {
              label: 'Status',
              key: 'status',
              type: 'select',
              options: [
                'PENDING',
                'CONFIRMED',
                'PREPARING',
                'READY',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'CANCELLED',
              ],
            },
            {
              label: 'Type',
              key: 'type',
              type: 'select',
              options: ['SUBSCRIPTION', 'BULK', 'ONE_TIME'],
            },
            {
              label: 'Kitchen',
              key: 'kitchenId',
              type: 'select',
              options: [], // This would be populated from API
            },
            {
              label: 'Date',
              key: 'date',
              type: 'date',
            },
          ]}
          renderActions={
            <div className="flex space-x-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                Export Orders
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                Bulk Update
              </button>
              <a
                href="/orders/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Create Order
              </a>
            </div>
          }
          onRowClick={handleRowClick}
          emptyMessage="No orders found. Orders will appear here once customers place them."
          pageSize={15}
        />
      </Layout>
    </BusinessRoute>
  );
}
