# ListPage Component Usage Guide

## Overview

The `ListPage` component is a reusable, feature-rich table component that
provides:

- Data fetching from API endpoints
- Filtering and search functionality
- Pagination
- Loading and error states
- Responsive design
- Row click handling
- Custom action buttons

## Basic Usage

```jsx
import ListPage from '../components/ListPage';

export default function MyPage() {
  return (
    <ListPage
      title="My Data"
      dataUrl="/api/my-data"
      columns={[
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Status', key: 'status' },
      ]}
    />
  );
}
```

## Props

### Required Props

- `title` (string): Page title displayed at the top
- `dataUrl` (string): API endpoint to fetch data from
- `columns` (array): Column definitions with `label` and `key`

### Optional Props

- `filters` (array): Filter definitions for search/filter bar
- `renderActions` (React element): Custom action buttons
- `onRowClick` (function): Handler for row clicks
- `emptyMessage` (string): Message when no data found
- `pageSize` (number): Items per page (default: 10)

## Column Configuration

```jsx
columns={[
  { label: 'Customer Name', key: 'user.profile.firstName' }, // Nested object
  { label: 'Amount', key: 'totalAmount' }, // Auto-formatted as currency
  { label: 'Created Date', key: 'createdAt' }, // Auto-formatted as date
  { label: 'Status', key: 'status' }, // Auto-styled status badge
  { label: 'Active', key: 'isActive' }, // Boolean values as Yes/No badges
]}
```

## Filter Configuration

```jsx
filters={[
  {
    label: 'Search',
    key: 'search',
    type: 'text'
  },
  {
    label: 'Status',
    key: 'status',
    type: 'select',
    options: ['ACTIVE', 'INACTIVE', 'PENDING']
  },
  {
    label: 'Date',
    key: 'date',
    type: 'date'
  },
]}
```

### Filter Types

- `text`: Text input for search
- `select`: Dropdown with predefined options
- `date`: Date picker input

## Action Buttons

```jsx
renderActions={
  <div className="flex space-x-3">
    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
      Export
    </button>
    <a
      href="/create"
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      + Add New
    </a>
  </div>
}
```

## Row Click Handling

```jsx
const handleRowClick = item => {
  // Navigate to detail page
  window.location.href = `/details/${item.id}`;

  // Or use Next.js router
  // router.push(`/details/${item.id}`);
};

<ListPage
  onRowClick={handleRowClick}
  // ... other props
/>;
```

## API Response Format

The component expects API responses in one of these formats:

### Paginated Response

```json
{
  "data": [...],
  "pagination": {
    "totalPages": 5,
    "totalItems": 50,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

### Simple Array Response

```json
{
  "data": [...]
}
```

### Direct Array Response

```json
[...]
```

## Automatic Formatting

The component automatically formats certain data types:

### Currency Fields

Any field containing "amount", "price", or "balance" is formatted as currency.

### Date Fields

Any field containing "date" or "At" is formatted as a localized date.

### Status Fields

Fields named "status" are displayed as colored badges.

### Boolean Fields

Boolean values are displayed as "Yes/No" badges.

## Complete Example

```jsx
import React from 'react';
import Navbar from '../components/Navbar';
import ListPage from '../components/ListPage';
import { AdminRoute } from '../components/ProtectedRoute';

export default function CustomersPage() {
  const handleRowClick = customer => {
    window.location.href = `/customers/${customer.id}`;
  };

  return (
    <AdminRoute>
      <Navbar />
      <ListPage
        title="Customer Management"
        dataUrl="/api/customers"
        columns={[
          { label: 'Customer Code', key: 'customerCode' },
          { label: 'Name', key: 'user.profile.firstName' },
          { label: 'Email', key: 'user.email' },
          { label: 'Phone', key: 'user.profile.phone' },
          { label: 'Wallet Balance', key: 'walletBalance' },
          { label: 'Status', key: 'isActive' },
          { label: 'Joined Date', key: 'createdAt' },
        ]}
        filters={[
          {
            label: 'Search',
            key: 'search',
            type: 'text',
          },
          {
            label: 'Status',
            key: 'status',
            type: 'select',
            options: ['active', 'inactive'],
          },
        ]}
        renderActions={
          <div className="flex space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Export CSV
            </button>
            <a
              href="/customers/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Customer
            </a>
          </div>
        }
        onRowClick={handleRowClick}
        emptyMessage="No customers found. Add your first customer to get started."
        pageSize={15}
      />
    </AdminRoute>
  );
}
```

## Styling

The component uses Tailwind CSS classes and follows the OneFoodDialer design
system:

- White background with shadow for main container
- Gray background for the page
- Blue color scheme for interactive elements
- Responsive design with mobile-friendly layout
- Hover effects and transitions

## Error Handling

The component includes built-in error handling:

- Loading states with spinner
- Error messages with retry functionality
- Empty state messages
- Network error handling

## Performance Features

- Pagination to handle large datasets
- Debounced filtering (filters trigger new API calls)
- Optimized re-renders
- Responsive table with horizontal scroll on mobile
