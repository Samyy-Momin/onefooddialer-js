# OneFoodDialer UI Components Guide

## Overview

This guide covers the professional UI components created for OneFoodDialer's
production-ready SaaS interface.

## Components

### 1. Layout Component

**Location**: `src/components/Layout.js`

A comprehensive layout component with sidebar navigation, top bar, and footer.

#### Features

- **Responsive Sidebar**: Collapsible on mobile, fixed on desktop
- **Role-based Navigation**: Different menu items based on user role
- **User Context**: Displays user info and business context
- **Professional Styling**: Clean, modern SaaS interface

#### Usage

```jsx
import Layout from '../components/Layout';

export default function MyPage() {
  return (
    <Layout title="Page Title">
      <div className="p-8">{/* Your page content */}</div>
    </Layout>
  );
}
```

#### Props

- `title` (string): Page title shown in top bar
- `children` (React.Node): Page content

### 2. Card Component

**Location**: `src/components/Card.js`

Reusable card component for dashboards and data display.

#### Features

- **Multiple Variants**: StatsCard, MetricCard, CustomCard
- **Loading States**: Built-in skeleton loading
- **Trend Indicators**: Up/down/neutral trend arrows
- **Color Themes**: Blue, green, red, yellow, purple, gray
- **Interactive**: Optional click handlers

#### Usage

```jsx
import { StatsCard, MetricCard, CustomCard } from '../components/Card';

// Stats Card with automatic icon
<StatsCard
  title="Total Customers"
  value="1,234"
  subtitle="Active customers"
  trend="up"
  trendValue="+12%"
  color="blue"
/>

// Metric Card
<MetricCard
  title="Revenue"
  value="₹45,678"
  subtitle="This month"
  color="green"
  onClick={() => router.push('/revenue')}
/>

// Custom Card with children
<CustomCard title="Recent Activity" color="gray">
  <div className="space-y-2">
    {/* Custom content */}
  </div>
</CustomCard>
```

#### Props

- `title` (string): Card title
- `value` (string): Main value to display
- `subtitle` (string): Secondary text
- `icon` (React.Node): Custom icon
- `trend` ('up'|'down'|'neutral'): Trend direction
- `trendValue` (string): Trend percentage/value
- `color` (string): Theme color
- `loading` (boolean): Show loading skeleton
- `onClick` (function): Click handler
- `children` (React.Node): Custom content

### 3. FilterBar Component

**Location**: `src/components/FilterBar.js`

Professional filter interface for data tables.

#### Features

- **Multiple Filter Types**: Text, select, date, daterange, number
- **Expandable**: Show/hide additional filters
- **Active Filter Display**: Visual indicators for applied filters
- **Clear Functionality**: Clear individual or all filters
- **Responsive Design**: Mobile-friendly layout

#### Usage

```jsx
import FilterBar from '../components/FilterBar';

const filters = [
  { label: 'Search', key: 'search', type: 'text' },
  {
    label: 'Status',
    key: 'status',
    type: 'select',
    options: ['Active', 'Inactive'],
  },
  { label: 'Date', key: 'date', type: 'date' },
  {
    label: 'Date Range',
    key: 'dateRange',
    type: 'daterange',
  },
];

<FilterBar
  filters={filters}
  filterValues={filterValues}
  onFilterChange={handleFilterChange}
  onClearFilters={handleClearFilters}
/>;
```

#### Filter Types

- **text**: Text input with search icon
- **select**: Dropdown with options
- **date**: Date picker
- **daterange**: Two date inputs (from/to)
- **number**: Number input with min/max/step

#### Specialized Components

```jsx
// Simple search bar
<SearchFilterBar
  searchValue={search}
  onSearchChange={setSearch}
  placeholder="Search customers..."
/>

// Quick filter buttons
<QuickFilterBar
  options={['All', 'Active', 'Inactive']}
  selectedValue={status}
  onSelectionChange={setStatus}
  label="Status"
/>
```

### 4. Enhanced ListPage Component

**Location**: `src/components/ListPage.js`

Production-ready data table with advanced features.

#### New Features

- **Professional Loading Skeleton**: Realistic loading states
- **Enhanced Error Handling**: Detailed error messages with retry
- **Improved Empty States**: Contextual empty messages
- **Better Table Styling**: Alternating rows, hover effects
- **Real API Integration**: Authentication, error handling
- **FilterBar Integration**: Uses new FilterBar component

#### Usage

```jsx
import ListPage from '../components/ListPage';

<ListPage
  title="Customer Management"
  dataUrl="/api/customers"
  columns={[
    { label: 'Name', key: 'user.profile.firstName' },
    { label: 'Email', key: 'user.email' },
    { label: 'Status', key: 'isActive' },
  ]}
  filters={[
    { label: 'Search', key: 'search', type: 'text' },
    {
      label: 'Status',
      key: 'status',
      type: 'select',
      options: ['active', 'inactive'],
    },
  ]}
  renderActions={
    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
      + Add Customer
    </button>
  }
  onRowClick={customer => router.push(`/customers/${customer.id}`)}
/>;
```

## Design System

### Colors

- **Primary**: Blue (#2563eb)
- **Success**: Green (#059669)
- **Warning**: Yellow (#d97706)
- **Error**: Red (#dc2626)
- **Gray Scale**: Various gray shades for text and backgrounds

### Typography

- **Headings**: Font weights 600-800
- **Body**: Font weight 400-500
- **Small Text**: Font size 12-14px
- **Labels**: Uppercase, tracking-wide

### Spacing

- **Consistent Scale**: 4px base unit (1, 2, 3, 4, 6, 8, 12, 16, 24, 32)
- **Component Padding**: 16-24px
- **Section Margins**: 24-32px

### Shadows

- **Cards**: shadow-sm (subtle)
- **Dropdowns**: shadow-lg (prominent)
- **Modals**: shadow-xl (elevated)

## Best Practices

### Component Usage

1. **Always use Layout** for authenticated pages
2. **Use Cards** for dashboard metrics and grouped content
3. **Use FilterBar** for any data filtering needs
4. **Use ListPage** for all data tables

### Styling Guidelines

1. **Consistent Colors**: Use design system colors
2. **Proper Spacing**: Follow spacing scale
3. **Responsive Design**: Mobile-first approach
4. **Accessibility**: Proper contrast and focus states

### Performance

1. **Loading States**: Always show loading skeletons
2. **Error Handling**: Provide clear error messages
3. **Optimistic Updates**: Update UI before API response
4. **Pagination**: Use for large datasets

## Migration Guide

### From Old Components

```jsx
// Old way
<>
  <Navbar />
  <main className="p-8">
    {/* content */}
  </main>
</>

// New way
<Layout title="Page Title">
  <div className="p-8">
    {/* content */}
  </div>
</Layout>
```

### From Custom Tables

```jsx
// Old way - 100+ lines of custom table code

// New way
<ListPage
  title="Data"
  dataUrl="/api/data"
  columns={columns}
  filters={filters}
/>
```

## Examples

### Dashboard Page

```jsx
import Layout from '../components/Layout';
import { StatsCard } from '../components/Card';

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Customers"
            value="1,234"
            trend="up"
            trendValue="+12%"
            color="blue"
          />
          <StatsCard
            title="Revenue"
            value="₹45,678"
            trend="up"
            trendValue="+8%"
            color="green"
          />
        </div>

        {/* More dashboard content */}
      </div>
    </Layout>
  );
}
```

### Data Management Page

```jsx
import Layout from '../components/Layout';
import ListPage from '../components/ListPage';

export default function Customers() {
  return (
    <Layout title="Customers">
      <ListPage
        title="Customer Management"
        dataUrl="/api/customers"
        columns={columns}
        filters={filters}
        renderActions={actions}
      />
    </Layout>
  );
}
```

This component system provides a professional, consistent, and maintainable
foundation for the entire OneFoodDialer application.
