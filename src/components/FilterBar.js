// OneFoodDialer - Reusable FilterBar Component
import React, { useState } from 'react';

export default function FilterBar({
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  className = '',
  showClearButton = true,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onFilterChange?.(key, value);
  };

  const handleClearAll = () => {
    onClearFilters?.();
  };

  const hasActiveFilters = Object.values(filterValues).some(value => 
    value && value.toString().trim() !== ''
  );

  if (filters.length === 0) return null;

  const visibleFilters = isExpanded ? filters : filters.slice(0, 4);
  const hasMoreFilters = filters.length > 4;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mb-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {Object.values(filterValues).filter(v => v && v.toString().trim() !== '').length} active
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {hasMoreFilters && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Show Less' : `Show All (${filters.length})`}
            </button>
          )}
          
          {showClearButton && hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleFilters.map((filter) => (
          <div key={filter.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {filter.label}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {filter.type === 'select' ? (
              <select
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">
                  {filter.placeholder || `All ${filter.label}`}
                </option>
                {filter.options?.map((option) => (
                  <option key={option.value || option} value={option.value || option}>
                    {option.label || option}
                  </option>
                ))}
              </select>
            ) : filter.type === 'date' ? (
              <input
                type="date"
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : filter.type === 'daterange' ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filterValues[`${filter.key}_from`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
                  placeholder="From"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <input
                  type="date"
                  value={filterValues[`${filter.key}_to`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
                  placeholder="To"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            ) : filter.type === 'number' ? (
              <input
                type="number"
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}...`}
                min={filter.min}
                max={filter.max}
                step={filter.step}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : (
              <div className="relative">
                <input
                  type={filter.type || 'text'}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder || `Search by ${filter.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm text-gray-500">Active filters:</span>
            {Object.entries(filterValues).map(([key, value]) => {
              if (!value || value.toString().trim() === '') return null;
              
              const filter = filters.find(f => f.key === key);
              const filterLabel = filter?.label || key;
              
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filterLabel}: {value}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized FilterBar Components
export function SearchFilterBar({ 
  searchValue = '', 
  onSearchChange, 
  placeholder = 'Search...', 
  className = '' 
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mb-6 ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {searchValue && (
          <button
            onClick={() => onSearchChange?.('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function QuickFilterBar({ 
  options = [], 
  selectedValue = '', 
  onSelectionChange, 
  label = 'Quick Filter',
  className = '' 
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">{label}:</span>
        <div className="flex items-center space-x-2">
          {options.map((option) => (
            <button
              key={option.value || option}
              onClick={() => onSelectionChange?.(option.value || option)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedValue === (option.value || option)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {option.label || option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
