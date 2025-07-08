// OneFoodDialer - Enhanced Customer Dashboard with Authentication
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { CustomerRoute } from "../components/ProtectedRoute";
import { formatCurrency } from "../lib/utils";

export default function Customer() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState(new Map());

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Fetch customer subscriptions
      const subscriptionsRes = await fetch("/api/subscriptions");
      const subscriptionsData = await subscriptionsRes.json();

      // Fetch available plans
      const plansRes = await fetch("/api/subscription-plans");
      const plansData = await plansRes.json();

      setSubscriptions(subscriptionsData.data || []);
      setAvailablePlans(plansData.data || []);

      // Mock wallet balance - in real app, fetch from API
      setWalletBalance(2500);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestion = async () => {
    try {
      const res = await fetch("/api/gpt");
      const data = await res.json();
      setAiSuggestion(data.result);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
    }
  };

  const pauseSubscription = async (subscriptionId) => {
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "PAUSED" }),
      });

      if (res.ok) {
        fetchCustomerData(); // Refresh data
      }
    } catch (error) {
      console.error("Error pausing subscription:", error);
    }
  };

  const resumeSubscription = async (subscriptionId) => {
    try {
      // Optimistic update
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionId
            ? { ...sub, status: "ACTIVE", isOptimistic: true }
            : sub
        )
      );

      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (res.ok) {
        const updatedSubscription = await res.json();
        // Replace optimistic update with real data
        setSubscriptions((prev) =>
          prev.map((sub) =>
            sub.id === subscriptionId ? updatedSubscription : sub
          )
        );
      } else {
        // Revert optimistic update on error
        fetchCustomerData();
      }
    } catch (error) {
      console.error("Error resuming subscription:", error);
      fetchCustomerData(); // Revert on error
    }
  };

  // Handle optimistic updates for new subscriptions
  const handleOptimisticSubscription = (subscription, tempId = null) => {
    if (subscription === null && tempId) {
      // Remove optimistic update
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== tempId));
    } else if (subscription) {
      if (subscription.isOptimistic) {
        // Add optimistic subscription
        setSubscriptions((prev) => [subscription, ...prev]);
      } else {
        // Replace optimistic with real data
        setSubscriptions((prev) =>
          prev.map((sub) => (sub.id === tempId ? subscription : sub))
        );
      }
    }
  };

  const handleSubscriptionSuccess = (subscription, tempId = null) => {
    if (subscription) {
      handleOptimisticSubscription(subscription, tempId);
      setShowCreateForm(false);
    } else {
      setShowCreateForm(false);
    }
  };

  const handleSubscriptionError = (error) => {
    console.error("Subscription error:", error);
    // Show error message to user
    alert(error);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-8 bg-gray-100 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading your dashboard...</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <CustomerRoute>
      <Navbar />
      <main className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Welcome to OneFoodDialer</h1>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {["dashboard", "subscriptions", "plans", "wallet"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {selectedTab === "dashboard" && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Active Subscriptions
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {subscriptions.filter((s) => s.status === "ACTIVE").length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Wallet Balance
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(walletBalance)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Orders
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {subscriptions.reduce(
                    (acc, s) => acc + (s.orders?.length || 0),
                    0
                  )}
                </p>
              </div>
            </div>

            {/* AI Suggestion */}
            <div className="bg-white p-6 rounded-xl shadow mb-8">
              <h3 className="text-lg font-bold mb-4">AI Meal Recommendation</h3>
              <button
                onClick={getSuggestion}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
              >
                Get AI Subscription Suggestion
              </button>
              {aiSuggestion && (
                <div className="bg-gray-100 p-4 rounded">
                  <p>{aiSuggestion}</p>
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {subscriptions.slice(0, 3).map((subscription) => (
                  <div
                    key={subscription.id}
                    className="border-l-4 border-blue-500 pl-4"
                  >
                    <h4 className="font-semibold">{subscription.plan?.name}</h4>
                    <p className="text-sm text-gray-600">
                      Next delivery:{" "}
                      {subscription.nextBillingDate
                        ? new Date(
                            subscription.nextBillingDate
                          ).toLocaleDateString()
                        : "Not scheduled"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span
                        className={`font-semibold ${
                          subscription.status === "ACTIVE"
                            ? "text-green-600"
                            : subscription.status === "PAUSED"
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Subscriptions Tab */}
        {selectedTab === "subscriptions" && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-4">My Subscriptions</h3>
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">
                        {subscription.plan?.name}
                      </h4>
                      <p className="text-gray-600">
                        {subscription.plan?.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(subscription.plan?.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        /{subscription.plan?.type.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p
                        className={`font-semibold ${
                          subscription.status === "ACTIVE"
                            ? "text-green-600"
                            : subscription.status === "PAUSED"
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {subscription.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Kitchen</p>
                      <p>{subscription.kitchen?.name || "Not assigned"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Start Date</p>
                      <p>
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next Billing</p>
                      <p>
                        {subscription.nextBillingDate
                          ? new Date(
                              subscription.nextBillingDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {subscription.status === "ACTIVE" ? (
                      <button
                        onClick={() => pauseSubscription(subscription.id)}
                        className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded text-sm hover:bg-yellow-200"
                      >
                        Pause
                      </button>
                    ) : subscription.status === "PAUSED" ? (
                      <button
                        onClick={() => resumeSubscription(subscription.id)}
                        className="bg-green-100 text-green-600 px-3 py-1 rounded text-sm hover:bg-green-200"
                      >
                        Resume
                      </button>
                    ) : null}
                    <button className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200">
                      View Details
                    </button>
                    <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200">
                      Modify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Plans Tab */}
        {selectedTab === "plans" && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-4">
              Available Subscription Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <h4 className="font-bold text-lg mb-2">{plan.name}</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-green-600">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      /{plan.type.toLowerCase()}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <p>Duration: {plan.duration} days</p>
                    {plan.maxOrders && <p>Max Orders: {plan.maxOrders}</p>}
                    {plan.discount && <p>Discount: {plan.discount}%</p>}
                  </div>

                  {/* Plan Items */}
                  {plan.planItems && plan.planItems.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Includes:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.planItems.slice(0, 3).map((item) => (
                          <li key={item.id} className="flex justify-between">
                            <span>{item.menuItem.name}</span>
                            <span>x{item.quantity}</span>
                          </li>
                        ))}
                        {plan.planItems.length > 3 && (
                          <li className="text-gray-500">
                            +{plan.planItems.length - 3} more items
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
                    Subscribe Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {selectedTab === "wallet" && (
          <div className="space-y-6">
            {/* Wallet Balance */}
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Wallet Balance</h3>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Add Money
                </button>
              </div>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(walletBalance)}
                </p>
                <p className="text-gray-600">Available Balance</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {/* Mock transaction data - in real app, fetch from API */}
                {[
                  {
                    id: 1,
                    type: "DEBIT",
                    amount: 150,
                    description: "Daily Tiffin Order",
                    date: "2025-07-08",
                  },
                  {
                    id: 2,
                    type: "CREDIT",
                    amount: 500,
                    description: "Wallet Recharge",
                    date: "2025-07-07",
                  },
                  {
                    id: 3,
                    type: "DEBIT",
                    amount: 300,
                    description: "Weekly Plan Payment",
                    date: "2025-07-06",
                  },
                ].map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center py-3 border-b"
                  >
                    <div>
                      <p className="font-semibold">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`font-bold ${
                        transaction.type === "CREDIT"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "CREDIT" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </CustomerRoute>
  );
}
