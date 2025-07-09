// OneFoodDialer - Reusable List Page Component with CSV Export
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../lib/utils';
import FilterBar from './FilterBar';
import { Parser } from 'json2csv';

export default function ListPage({
  title,
  columns = [],
  dataUrl,
  filters = [],
  renderActions = null,
  onRowClick = null,
  emptyMessage = 'No data found',
  pageSize = 10,
  enableInlineEdit = false,
  editableColumns = [],
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage.toString());
        queryParams.append('limit', pageSize.toString());

        // Add filter values to query
        Object.entries(filterValues).forEach(([key, value]) => {
          if (value && value.trim() !== '') {
            queryParams.append(key, value);
          }
        });

        // Get auth token for authenticated requests (client-side only)
        const headers = {
          'Content-Type': 'application/json',
        };

        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('supabase.auth.token');
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        const response = await fetch(`${dataUrl}?${queryParams}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in again.');
          } else if (response.status === 403) {
            throw new Error('Access denied. You do not have permission to view this data.');
          } else if (response.status === 404) {
            throw new Error(
              'Data not found. The requested resource may have been moved or deleted.'
            );
          } else if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
          }
        }

        const result = await response.json();

        // Handle various API response formats
        if (result.success === false) {
          throw new Error(result.message || 'API returned an error');
        }

        // Handle paginated responses
        if (result.data && result.pagination) {
          setData(result.data);
          setTotalPages(
            result.pagination.totalPages || Math.ceil(result.pagination.totalItems / pageSize)
          );
          setTotalItems(result.pagination.totalItems);
        }
        // Handle simple data array responses
        else if (Array.isArray(result.data)) {
          setData(result.data);
          setTotalPages(Math.ceil(result.data.length / pageSize));
          setTotalItems(result.data.length);
        }
        // Handle direct array responses
        else if (Array.isArray(result)) {
          setData(result);
          setTotalPages(Math.ceil(result.length / pageSize));
          setTotalItems(result.length);
        }
        // Handle empty or invalid responses
        else {
          setData([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An unexpected error occurred while fetching data.');
        setData([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataUrl, filterValues, currentPage, pageSize]);

  const refreshData = () => {
    // Force re-render by updating a dependency
    setCurrentPage(prev => prev);
  };

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Prepare data for CSV export
      const csvData = data.map(item => {
        const csvRow = {};

        columns.forEach(col => {
          const value = getNestedValue(item, col.key);
          let formattedValue = value;

          // Handle special formatting for CSV
          if (
            col.key.includes('amount') ||
            col.key.includes('price') ||
            col.key.includes('balance')
          ) {
            formattedValue = typeof value === 'number' ? value.toFixed(2) : '0.00';
          } else if (col.key.includes('date') || col.key.includes('At')) {
            formattedValue = value ? new Date(value).toLocaleDateString() : '';
          } else if (typeof value === 'boolean') {
            formattedValue = value ? 'Yes' : 'No';
          } else if (col.key.includes('.') && value) {
            // Handle nested object display (like customer name)
            if (col.key.includes('firstName')) {
              const lastName = getNestedValue(item, col.key.replace('firstName', 'lastName'));
              formattedValue = `${value} ${lastName || ''}`.trim();
            } else {
              formattedValue = value;
            }
          } else {
            formattedValue = value || '';
          }

          csvRow[col.label] = formattedValue;
        });

        return csvRow;
      });

      // Configure CSV parser
      const fields = columns.map(col => ({
        label: col.label,
        value: col.label,
      }));

      const json2csvParser = new Parser({
        fields,
        header: true,
        delimiter: ',',
        quote: '"',
        escape: '"',
        excelStrings: false,
        withBOM: true, // Add BOM for Excel compatibility
      });

      // Generate CSV content
      const csvContent = json2csvParser.parse(csvData);

      // Create and download file
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      // Generate filename with current date and time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${sanitizedTitle}_${dateStr}_${timeStr}.csv`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      // Show success message
      console.log(`CSV exported successfully: ${filename}`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleCellEdit = (rowIndex, columnKey, currentValue) => {
    if (!enableInlineEdit || !editableColumns.includes(columnKey)) return;

    setEditingCell(`${rowIndex}-${columnKey}`);
    setEditValue(currentValue || '');
  };

  const handleEditSave = async (rowIndex, columnKey) => {
    const item = data[rowIndex];
    const cellKey = `${rowIndex}-${columnKey}`;
    const originalValue = getNestedValue(item, columnKey);

    // Don't save if value hasn't changed
    if (editValue === originalValue) {
      setEditingCell(null);
      setEditValue('');
      return;
    }

    try {
      // Validate input before saving
      if (columnKey.includes('email') && editValue && !isValidEmail(editValue)) {
        alert('Please enter a valid email address');
        return;
      }

      if (columnKey.includes('phone') && editValue && !isValidPhone(editValue)) {
        alert('Please enter a valid phone number');
        return;
      }

      // Optimistic update with loading state
      const updatedData = [...data];
      const updatedItem = { ...item };

      // Handle nested properties
      if (columnKey.includes('.')) {
        const keys = columnKey.split('.');
        let current = updatedItem;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = editValue;
      } else {
        updatedItem[columnKey] = editValue;
      }

      updatedData[rowIndex] = {
        ...updatedItem,
        isOptimistic: true,
        isSaving: true,
      };
      setData(updatedData);

      // Prepare update payload
      const updatePayload = {};
      if (columnKey.includes('.')) {
        // For nested properties, send the full nested object
        const keys = columnKey.split('.');
        let current = updatePayload;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = current[keys[i]] || {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = editValue;
      } else {
        updatePayload[columnKey] = editValue;
      }

      // Send update to server
      const response = await fetch(`${dataUrl}/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();

      // Update with server response
      const finalData = [...data];
      finalData[rowIndex] = {
        ...result.data,
        isOptimistic: false,
        isSaving: false,
        lastUpdated: new Date().toISOString(),
      };
      setData(finalData);

      // Show success feedback
      showToast('Updated successfully', 'success');
    } catch (error) {
      console.error('Error updating:', error);

      // Revert optimistic update
      const revertedData = [...data];
      revertedData[rowIndex] = {
        ...item,
        isOptimistic: false,
        isSaving: false,
      };
      setData(revertedData);

      // Show error feedback
      showToast(error.message || 'Failed to update. Please try again.', 'error');
    } finally {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Helper functions for validation
  const isValidEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = phone => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  // Simple toast notification system
  const showToast = (message, type = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => (toast.style.transform = 'translateX(0)'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e, rowIndex, columnKey) => {
    if (e.key === 'Enter') {
      handleEditSave(rowIndex, columnKey);
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const renderFilterBar = () => {
    if (filters.length === 0) return null;

    return (
      <FilterBar
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />
    );
  };

  const renderCellValue = (item, column, rowIndex) => {
    const value = getNestedValue(item, column.key);
    const cellKey = `${rowIndex}-${column.key}`;
    const isEditing = editingCell === cellKey;
    const isEditable = enableInlineEdit && editableColumns.includes(column.key);

    // If editing this cell, show input
    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => handleEditSave(rowIndex, column.key)}
          onKeyPress={e => handleKeyPress(e, rowIndex, column.key)}
          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );
    }

    // Handle special formatting
    let displayValue;

    if (
      column.key.includes('amount') ||
      column.key.includes('price') ||
      column.key.includes('balance')
    ) {
      displayValue = formatCurrency(value);
    } else if (column.key.includes('date') || column.key.includes('At')) {
      displayValue = value ? new Date(value).toLocaleDateString() : '-';
    } else if (column.key === 'status') {
      displayValue = (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(value)}`}>
          {value}
        </span>
      );
    } else if (typeof value === 'boolean') {
      displayValue = (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? 'Yes' : 'No'}
        </span>
      );
    } else if (column.key.includes('.') && value) {
      // For names, combine first and last name
      if (column.key.includes('firstName')) {
        const lastName = getNestedValue(item, column.key.replace('firstName', 'lastName'));
        displayValue = `${value} ${lastName || ''}`.trim();
      } else {
        displayValue = value || '-';
      }
    } else {
      displayValue = value || '-';
    }

    // Wrap in editable container if applicable
    if (isEditable) {
      return (
        <div
          className={`cursor-pointer p-2 rounded transition-all duration-200 ${
            isEditing
              ? 'bg-blue-100 border-2 border-blue-300'
              : 'hover:bg-blue-50 border-2 border-transparent hover:border-blue-200'
          }`}
          onClick={() => !isEditing && handleCellEdit(rowIndex, column.key, value)}
          title={isEditing ? 'Editing...' : 'Click to edit'}
        >
          <div className="flex items-center justify-between">
            <span className={item.isSaving ? 'opacity-50' : ''}>{displayValue}</span>
            <div className="flex items-center ml-2 space-x-1">
              {item.isSaving && (
                <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
              )}
              {item.isOptimistic && !item.isSaving && (
                <span className="text-xs text-blue-500" title="Pending save">
                  ●
                </span>
              )}
              {item.lastUpdated && !item.isOptimistic && (
                <span className="text-xs text-green-500" title="Recently updated">
                  ✓
                </span>
              )}
              {!isEditing && (
                <svg
                  className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      );
    }

    return displayValue;
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const getStatusColor = status => {
    const statusColors = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      UNPAID: 'bg-red-100 text-red-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-red-100 text-red-800',
      DELIVERED: 'bg-green-100 text-green-800',
      PREPARING: 'bg-orange-100 text-orange-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
    };
    return statusColors[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="px-3 py-2 text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center space-x-4">
          {/* Enhanced CSV Export Button */}
          <div className="relative">
            <button
              onClick={exportToCSV}
              disabled={loading || data.length === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              title={`Export ${data.length} records to CSV`}
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
              {data.length > 0 && (
                <span className="ml-2 bg-green-500 text-xs px-2 py-1 rounded-full">
                  {data.length}
                </span>
              )}
            </button>

            {/* Tooltip for disabled state */}
            {(loading || data.length === 0) && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {loading ? 'Loading data...' : 'No data to export'}
              </div>
            )}
          </div>

          {/* Custom Actions */}
          {renderActions}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-md rounded-xl p-6">
        {/* Filter Bar */}
        {renderFilterBar()}

        {/* Loading State - Professional Skeleton */}
        {loading && (
          <div className="animate-pulse">
            {/* Filter skeleton */}
            {filters.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filters.map((_, index) => (
                    <div key={index}>
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Table skeleton */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    {columns.map((_, index) => (
                      <th key={index} className="pb-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(pageSize)].map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                      {columns.map((_, colIndex) => (
                        <td key={colIndex} className="py-3">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination skeleton */}
            <div className="mt-6 flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State - Professional Error UI */}
        {error && (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <div className="space-x-3">
              <button
                onClick={refreshData}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            {data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-700 text-sm font-medium">
                        {columns.map(column => (
                          <th
                            key={column.key}
                            className="px-6 py-4 font-semibold tracking-wider uppercase text-xs"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className={`text-sm transition-colors duration-150 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } ${
                            onRowClick
                              ? 'cursor-pointer hover:bg-blue-50 hover:shadow-sm'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => onRowClick?.(item)}
                        >
                          {columns.map(column => (
                            <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                              {renderCellValue(item, column, index)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {renderPagination()}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 mb-6">
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No data found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">{emptyMessage}</p>

                {Object.keys(filterValues).length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Try adjusting your search or filter criteria
                    </p>
                    <button
                      onClick={clearFilters}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Get started by adding your first record</p>
                    <button
                      onClick={refreshData}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
