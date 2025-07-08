// OneFoodDialer - Create Subscription Page
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { AdminRoute } from '../../components/ProtectedRoute';

export default function CreateSubscription() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    planId: '',
    kitchenId: '',
    startDate: new Date().toISOString().split('T')[0],
    autoRenew: true,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, plansRes, kitchensRes] = await Promise.all([
        fetch('/api/customers', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          },
        }),
        fetch('/api/subscription-plans', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          },
        }),
        fetch('/api/kitchens', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          },
        }),
      ]);

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.data || []);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.data || []);
      } else {
        // Create default plans if none exist
        setPlans([
          { id: 'plan-1', name: 'Basic Plan', price: 299.99, type: 'MONTHLY', duration: 30 },
          { id: 'plan-2', name: 'Premium Plan', price: 499.99, type: 'MONTHLY', duration: 30 },
          { id: 'plan-3', name: 'Enterprise Plan', price: 799.99, type: 'MONTHLY', duration: 30 }
        ]);
      }

      if (kitchensRes.ok) {
        const kitchensData = await kitchensRes.json();
        setKitchens(kitchensData.data || []);
      } else {
        // Create default kitchen if none exist
        setKitchens([
          { id: 'kitchen-1', name: 'Main Kitchen', address: { city: 'Mumbai' } }
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.customerId || !formData.planId || !formData.kitchenId) {
      setError('Please select customer, plan, and kitchen');
      return false;
    }

    const startDate = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      setError('Start date cannot be in the past');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create subscription');
      }

      // Success - redirect to subscriptions page
      router.push('/subscriptions?success=Subscription created successfully');

    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(error.message || 'Failed to create subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(plan => plan.id === formData.planId);

  return (
    <AdminRoute>
      <Layout title="Create Subscription">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Subscription</h1>
            <p className="text-gray-600">Subscribe a customer to a meal plan</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Subscription Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer *
                  </label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.user?.profile?.firstName} {customer.user?.profile?.lastName} ({customer.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Plan *
                  </label>
                  <select
                    name="planId"
                    value={formData.planId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a plan</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price} ({plan.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kitchen *
                  </label>
                  <select
                    name="kitchenId"
                    value={formData.kitchenId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a kitchen</option>
                    {kitchens.map(kitchen => (
                      <option key={kitchen.id} value={kitchen.id}>
                        {kitchen.name} {kitchen.address?.city && `- ${kitchen.address.city}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="autoRenew"
                      checked={formData.autoRenew}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Auto-renew subscription
                    </span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special instructions or notes..."
                  />
                </div>
              </div>
            </div>

            {/* Plan Summary */}
            {selectedPlan && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Plan Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Plan:</span>
                    <p className="text-blue-900">{selectedPlan.name}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Price:</span>
                    <p className="text-blue-900">₹{selectedPlan.price}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Duration:</span>
                    <p className="text-blue-900">{selectedPlan.duration} days</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Type:</span>
                    <p className="text-blue-900">{selectedPlan.type}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/subscriptions')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Creating Subscription...' : 'Create Subscription'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </AdminRoute>
  );
}
