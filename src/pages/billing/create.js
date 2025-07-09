// OneFoodDialer - Create Invoice Page
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { AdminRoute } from '../../components/ProtectedRoute';

export default function CreateInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    items: [
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    taxRate: 0.18, // 18% GST
    discountAmount: 0,
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Ensure we're on the client side before accessing localStorage
      if (typeof window === 'undefined') {
        return;
      }

      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/customers', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleInputChange = e => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value,
    };
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const removeItem = index => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * formData.taxRate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - formData.discountAmount;
  };

  const validateForm = () => {
    if (!formData.customerId) {
      setError('Please select a customer');
      return false;
    }

    if (formData.items.length === 0) {
      setError('Please add at least one item');
      return false;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.description || item.quantity <= 0 || item.unitPrice < 0) {
        setError(
          `Item ${i + 1}: Please provide description, positive quantity, and valid unit price`
        );
        return false;
      }
    }

    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      setError('Due date cannot be in the past');
      return false;
    }

    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Ensure we're on the client side before accessing localStorage
      if (typeof window === 'undefined') {
        setError('This action is not available during server-side rendering');
        return;
      }

      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create invoice');
      }

      // Success - redirect to billing page
      router.push('/billing?success=Invoice created successfully');
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError(error.message || 'Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminRoute>
      <Layout title="Create Invoice">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Invoice</h1>
            <p className="text-gray-600">Generate an invoice for a customer</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            {/* Invoice Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
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
                        {customer.user?.profile?.firstName} {customer.user?.profile?.lastName} (
                        {customer.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxRate * 100}
                    onChange={e =>
                      handleInputChange({
                        target: {
                          name: 'taxRate',
                          value: parseFloat(e.target.value) / 100 || 0,
                          type: 'number',
                        },
                      })
                    }
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="discountAmount"
                    value={formData.discountAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    placeholder="Any additional notes or terms..."
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Invoice Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Item description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={e => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                          ₹{(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tax ({(formData.taxRate * 100).toFixed(1)}%):
                  </span>
                  <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                </div>
                {formData.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">
                      -₹{formData.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/billing')}
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
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {loading ? 'Creating Invoice...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </AdminRoute>
  );
}
