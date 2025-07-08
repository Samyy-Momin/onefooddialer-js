// OneFoodDialer - Kitchen Dashboard for Staff
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { KitchenRoute } from '../../components/ProtectedRoute';
import { formatCurrency } from '../../lib/utils';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('orders');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchKitchenData = async () => {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams();
        if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

        const [ordersRes, inventoryRes] = await Promise.all([
          fetch(`/api/orders?${queryParams}`),
          fetch('/api/inventory'),
        ]);

        const ordersData = await ordersRes.json();
        const inventoryData = await inventoryRes.json();

        setOrders(ordersData.data || []);
        setInventory(inventoryData.data || []);
      } catch (error) {
        console.error('Error fetching kitchen data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKitchenData();
  }, [statusFilter]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Optimistic update
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId ? { ...order, status: newStatus, isOptimistic: true } : order
          )
        );

        // Refresh data to get real update
        setTimeout(() => {
          const fetchKitchenData = async () => {
            try {
              const queryParams = new URLSearchParams();
              if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

              const [ordersRes, inventoryRes] = await Promise.all([
                fetch(`/api/orders?${queryParams}`),
                fetch('/api/inventory'),
              ]);

              const ordersData = await ordersRes.json();
              const inventoryData = await inventoryRes.json();

              setOrders(ordersData.data || []);
              setInventory(inventoryData.data || []);
            } catch (error) {
              console.error('Error fetching kitchen data:', error);
            }
          };
          fetchKitchenData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = currentStatus => {
    const statusFlow = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
    };
    return statusFlow[currentStatus];
  };

  const getStatusAction = currentStatus => {
    const actions = {
      PENDING: 'Confirm',
      CONFIRMED: 'Start Preparing',
      PREPARING: 'Mark Ready',
      READY: 'Send for Delivery',
      OUT_FOR_DELIVERY: 'Mark Delivered',
    };
    return actions[currentStatus];
  };

  if (loading) {
    return (
      <KitchenRoute>
        <Navbar />
        <main className="p-8 bg-gray-100 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading kitchen dashboard...</div>
          </div>
        </main>
      </KitchenRoute>
    );
  }

  return (
    <KitchenRoute>
      <Navbar />
      <main className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Kitchen Dashboard</h1>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {['orders', 'inventory'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Orders Tab */}
        {selectedTab === 'orders' && (
          <>
            {/* Status Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Orders</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                </select>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-xl shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {order.customer?.user?.profile?.firstName}{' '}
                        {order.customer?.user?.profile?.lastName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Scheduled: {new Date(order.scheduledFor).toLocaleString()}
                    </p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(order.finalAmount)}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2">Items:</h4>
                    <div className="space-y-1">
                      {order.orderItems?.slice(0, 3).map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.menuItem.name}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                      {order.orderItems?.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{order.orderItems.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {getNextStatus(order.status) && (
                      <button
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
                      >
                        {getStatusAction(order.status)}
                      </button>
                    )}

                    {['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status) && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        className="w-full bg-red-100 text-red-600 py-2 px-4 rounded hover:bg-red-200 text-sm"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found for the selected filter.</p>
              </div>
            )}
          </>
        )}

        {/* Inventory Tab */}
        {selectedTab === 'inventory' && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-4">Inventory Status</h3>

            {inventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-600 border-b text-sm">
                      <th className="pb-2">Item</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Current Stock</th>
                      <th className="pb-2">Min Stock</th>
                      <th className="pb-2">Unit</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id} className="border-t text-sm">
                        <td className="py-2 font-semibold">{item.name}</td>
                        <td className="py-2">{item.category}</td>
                        <td className="py-2">{item.currentStock}</td>
                        <td className="py-2">{item.minStock}</td>
                        <td className="py-2">{item.unit}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.currentStock <= item.minStock
                                ? 'bg-red-100 text-red-800'
                                : item.currentStock <= item.minStock * 2
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.currentStock <= item.minStock
                              ? 'Low Stock'
                              : item.currentStock <= item.minStock * 2
                                ? 'Warning'
                                : 'Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No inventory items found.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </KitchenRoute>
  );
}
