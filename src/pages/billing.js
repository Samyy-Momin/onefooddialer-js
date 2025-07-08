// OneFoodDialer - Billing Page using ListPage Component
import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import ListPage from '../components/ListPage';
import { AdminRoute } from '../components/ProtectedRoute';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Billing() {
  const handleRowClick = invoice => {
    // Navigate to invoice detail page
    window.location.href = `/billing/${invoice.id}`;
  };

  const generatePDF = invoice => {
    const doc = new jsPDF();
    doc.text('OneFoodDialer - Invoice', 14, 20);
    doc.text(`Invoice ID: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(
      `Customer: ${invoice.customer?.user?.profile?.firstName} ${invoice.customer?.user?.profile?.lastName}`,
      14,
      40
    );
    doc.text(`Amount: ${invoice.totalAmount}`, 14, 50);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, 60);
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <AdminRoute>
      <Layout title="Billing & Invoices">
        <ListPage
          title="Billing & Invoices"
          dataUrl="/api/invoices"
          columns={[
            {
              label: 'Invoice ID',
              key: 'invoiceNumber',
              render: value => (
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{value}</span>
              ),
            },
            {
              label: 'Customer',
              key: 'customer',
              render: customer => (
                <div>
                  <div className="font-medium">
                    {customer?.user?.profile?.firstName} {customer?.user?.profile?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{customer?.user?.email}</div>
                </div>
              ),
            },
            {
              label: 'Amount',
              key: 'totalAmount',
              render: value => (
                <span className="font-semibold text-green-600">
                  ₹{parseFloat(value || 0).toFixed(2)}
                </span>
              ),
            },
            {
              label: 'Tax',
              key: 'taxAmount',
              render: value => (
                <span className="text-gray-600">₹{parseFloat(value || 0).toFixed(2)}</span>
              ),
            },
            {
              label: 'Status',
              key: 'status',
              render: value => {
                const statusColors = {
                  PENDING: 'bg-yellow-100 text-yellow-800',
                  PAID: 'bg-green-100 text-green-800',
                  OVERDUE: 'bg-red-100 text-red-800',
                  CANCELLED: 'bg-gray-100 text-gray-800',
                  REFUNDED: 'bg-blue-100 text-blue-800',
                };
                return (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[value] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {value}
                  </span>
                );
              },
            },
            {
              label: 'Due Date',
              key: 'dueDate',
              render: value => (value ? new Date(value).toLocaleDateString() : '-'),
            },
            {
              label: 'Created',
              key: 'createdAt',
              render: value => new Date(value).toLocaleDateString(),
            },
          ]}
          filters={[
            {
              label: 'Search Invoice',
              key: 'search',
              type: 'text',
            },
            {
              label: 'Status',
              key: 'status',
              type: 'select',
              options: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'],
            },
            {
              label: 'Date Range',
              key: 'dateRange',
              type: 'select',
              options: ['7', '30', '90'],
            },
            {
              label: 'Customer ID',
              key: 'customerId',
              type: 'text',
            },
          ]}
          renderActions={
            <div className="flex space-x-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                Export All
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                Bulk Actions
              </button>
              <Link
                href="/billing/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Create Invoice
              </Link>
            </div>
          }
          renderRowActions={invoice => (
            <div className="flex space-x-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  generatePDF(invoice);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
                title="Download PDF"
              >
                📄 PDF
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  window.location.href = `/billing/${invoice.id}`;
                }}
                className="text-green-600 hover:text-green-800 text-sm"
                title="View Details"
              >
                👁️ View
              </button>
            </div>
          )}
          onRowClick={handleRowClick}
          emptyMessage="No invoices found. Invoices will be generated automatically when orders are placed."
        />
      </Layout>
    </AdminRoute>
  );
}
