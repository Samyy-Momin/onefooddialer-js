// OneFoodDialer - Wallet Page using ListPage Component
import React from "react";
import Navbar from "../components/Navbar";
import ListPage from "../components/ListPage";
import { AdminRoute } from "../components/ProtectedRoute";

export default function Wallet() {
  const handleRowClick = (customer) => {
    // Navigate to customer wallet detail page
    window.location.href = `/wallet/${customer.id}`;
  };

  return (
    <AdminRoute>
      <Navbar />
      <ListPage
        title="Wallet Management"
        dataUrl="/api/customers"
        columns={[
          { label: "Customer Code", key: "customerCode" },
          { label: "Customer Name", key: "user.profile.firstName" },
          { label: "Email", key: "user.email" },
          { label: "Phone", key: "user.profile.phone" },
          { label: "Wallet Balance", key: "walletBalance" },
          { label: "Loyalty Points", key: "loyaltyPoints" },
          { label: "Last Transaction", key: "lastTransactionDate" },
          { label: "Total Spent", key: "totalSpent" },
          { label: "Status", key: "isActive" },
        ]}
        filters={[
          {
            label: "Search Customer",
            key: "search",
            type: "text",
          },
          {
            label: "Balance Range",
            key: "balanceRange",
            type: "select",
            options: ["0-100", "100-500", "500-1000", "1000+"],
          },
          {
            label: "Loyalty Tier",
            key: "loyaltyTier",
            type: "select",
            options: ["bronze", "silver", "gold", "platinum"],
          },
          {
            label: "Status",
            key: "status",
            type: "select",
            options: ["active", "inactive"],
          },
        ]}
        renderActions={
          <div className="flex space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Export Wallets
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
              Bulk Credit
            </button>
            <a
              href="/wallet/transactions"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              View All Transactions
            </a>
          </div>
        }
        onRowClick={handleRowClick}
        emptyMessage="No wallet data found. Customer wallets will appear here once they are created."
      />
    </AdminRoute>
  );
}
