// OneFoodDialer - Subscription Creation Form with Optimistic Updates
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../lib/utils';

export default function SubscriptionForm({
  onSuccess,
  onError,
  customerId,
  businessId,
  onOptimisticUpdate,
}) {
  const [formData, setFormData] = useState({
    planId: '',
    kitchenId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoRenew: true,
    deliveryAddress: '',
    deliveryInstructions: '',
    customizations: {},
  });

  const [plans, setPlans] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlansAndKitchens = async () => {
      try {
        setLoading(true);

        const [plansRes, kitchensRes] = await Promise.all([
          fetch(`/api/subscription-plans?businessId=${businessId}`),
          fetch(`/api/kitchens?businessId=${businessId}`),
        ]);

        const plansData = await plansRes.json();
        const kitchensData = await kitchensRes.json();

        setPlans(plansData.data || []);
        setKitchens(kitchensData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        onError?.('Failed to load plans and kitchens');
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchPlansAndKitchens();
    }
  }, [businessId, onError]);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.planId) {
      onError?.('Please select a subscription plan');
      return;
    }

    setSubmitting(true);

    try {
      // Optimistic update - immediately show the new subscription
      const selectedPlan = plans.find(p => p.id === formData.planId);
      const selectedKitchen = kitchens.find(k => k.id === formData.kitchenId);

      const optimisticSubscription = {
        id: `temp-${Date.now()}`,
        status: 'ACTIVE',
        startDate: formData.startDate,
        endDate: formData.endDate,
        nextBillingDate: calculateNextBillingDate(formData.startDate, selectedPlan?.type),
        plan: selectedPlan,
        kitchen: selectedKitchen,
        customizations: formData.customizations,
        deliveryAddress: formData.deliveryAddress,
        deliveryInstructions: formData.deliveryInstructions,
        autoRenew: formData.autoRenew,
        isOptimistic: true, // Flag to identify optimistic updates
      };

      // Trigger optimistic update
      onOptimisticUpdate?.(optimisticSubscription);

      // Make API call
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          businessId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      const subscription = await response.json();

      // Replace optimistic update with real data
      onSuccess?.(subscription, optimisticSubscription.id);

      // Reset form
      setFormData({
        planId: '',
        kitchenId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        autoRenew: true,
        deliveryAddress: '',
        deliveryInstructions: '',
        customizations: {},
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      onError?.(error.message);

      // Remove optimistic update on error
      onOptimisticUpdate?.(null, optimisticSubscription.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-bold mb-6">Create New Subscription</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plan Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subscription Plan *
          </label>
          <select
            value={formData.planId}
            onChange={e => handleInputChange('planId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a plan</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {formatCurrency(plan.price)}/{plan.type.toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Kitchen Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kitchen (Optional)</label>
          <select
            value={formData.kitchenId}
            onChange={e => handleInputChange('kitchenId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Auto-assign kitchen</option>
            {kitchens.map(kitchen => (
              <option key={kitchen.id} value={kitchen.id}>
                {kitchen.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={e => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={e => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Delivery Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
          <textarea
            value={formData.deliveryAddress}
            onChange={e => handleInputChange('deliveryAddress', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter delivery address..."
          />
        </div>

        {/* Delivery Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Instructions
          </label>
          <textarea
            value={formData.deliveryInstructions}
            onChange={e => handleInputChange('deliveryInstructions', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Special delivery instructions..."
          />
        </div>

        {/* Auto Renew */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoRenew"
            checked={formData.autoRenew}
            onChange={e => handleInputChange('autoRenew', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoRenew" className="ml-2 block text-sm text-gray-700">
            Auto-renew subscription
          </label>
        </div>

        {/* Plan Summary */}
        {selectedPlan && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-2">Plan Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Plan:</strong> {selectedPlan.name}
              </p>
              <p>
                <strong>Price:</strong> {formatCurrency(selectedPlan.price)}/
                {selectedPlan.type.toLowerCase()}
              </p>
              <p>
                <strong>Duration:</strong> {selectedPlan.duration} days
              </p>
              {selectedPlan.description && (
                <p>
                  <strong>Description:</strong> {selectedPlan.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => onSuccess?.(null)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.planId}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Subscription'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper function to calculate next billing date
function calculateNextBillingDate(startDate, planType) {
  const date = new Date(startDate);

  switch (planType) {
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString();
}
