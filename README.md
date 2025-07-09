# 🍽️ OneFoodDialer

**Professional-Grade Subscription-Based Business Management System**

OneFoodDialer is a production-ready SaaS platform designed for food delivery and
subscription businesses. Built with modern technologies and enterprise-grade
features, it provides complete business management capabilities including
customer relationship management, order processing, subscription handling,
billing, wallet management, and real-time analytics.

## 🌟 Key Highlights

- **🏢 Multi-Tenant Architecture** - Complete business isolation and data
  security
- **⚡ Real-Time Dashboard** - Live analytics with auto-refresh every 60 seconds
- **📊 Interactive API Docs** - Complete Swagger UI with testing capabilities
- **✏️ Inline Editing** - Edit data directly in tables with optimistic updates
- **📈 CSV Export** - Export any table data with smart formatting
- **🔐 Enterprise Security** - JWT authentication with role-based access control
- **📱 Mobile Responsive** - Works perfectly on all devices
- **🚀 Production Ready** - Deployed and tested for real-world usage

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [⚙️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🔧 Environment Setup](#-environment-setup)
- [📚 API Documentation](#-api-documentation)
- [🚀 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)

## ✨ Features

### 🎯 Core Business Features

- **Multi-Tenant Architecture** - Complete business isolation and data security
- **Role-Based Access Control** - 5 distinct user roles with granular
  permissions
- **Subscription Management** - Flexible subscription plans with auto-renewal
- **Order Processing** - Complete order lifecycle from creation to delivery
- **Billing & Invoicing** - Automated invoice generation with tax calculations
- **Wallet System** - Digital wallet with transaction history
- **Real-Time Analytics** - Live dashboard with business metrics

### 🔐 Authentication & Security

- **Supabase Authentication** - Secure JWT-based authentication
- **Multi-Business Support** - Users can belong to multiple businesses
- **Session Management** - Persistent sessions with auto-refresh
- **Protected Routes** - Component-level route protection
- **API Security** - Token-based API authentication

### 💼 Business Management

- **Customer Relationship Management (CRM)** - Complete customer lifecycle
  management
- **Kitchen Management** - Multi-kitchen support with capacity tracking
- **Inventory Tracking** - Real-time inventory management
- **Staff Management** - Role-based staff access and permissions
- **Business Analytics** - Comprehensive reporting and insights

### 🎨 User Experience

- **Professional UI/UX** - Modern, responsive design system
- **Real-Time Updates** - Live data updates across the platform
- **Mobile-Friendly** - Responsive design for all devices
- **Accessibility** - WCAG compliant interface
- **Dark/Light Mode** - User preference support

## 🏗️ System Architecture

### High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OneFoodDialer System Architecture                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│    Frontend Layer   │    │     API Layer       │    │   Database Layer    │
│     (Next.js)       │    │   (Next.js API)     │    │   (PostgreSQL)      │
│                     │    │                     │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ React Pages     │ │◄──►│ │ REST Endpoints  │ │◄──►│ │ Prisma ORM      │ │
│ │ • Dashboard     │ │    │ │ • /api/customers│ │    │ │ • User Models   │ │
│ │ • CRM           │ │    │ │ • /api/orders   │ │    │ │ • Business Data │ │
│ │ • Orders        │ │    │ │ • /api/billing  │ │    │ │ • Transactions  │ │
│ │ • Billing       │ │    │ │ • /api/wallet   │ │    │ │ • Relationships │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
│                     │    │                     │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ UI Components   │ │    │ │ Middleware      │ │    │ │ Multi-Tenant    │ │
│ │ • ListPage      │ │    │ │ • Authentication│ │    │ │ • Row Level Sec │ │
│ │ • Cards         │ │    │ │ • Authorization │ │    │ │ • Data Isolation│ │
│ │ • Forms         │ │    │ │ • Validation    │ │    │ │ • Audit Logs    │ │
│ │ • Filters       │ │    │ │ • Error Handling│ │    │ │ • Backups       │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
│                     │    │                     │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Real-time       │ │    │ │ Business Logic  │ │    │ │ Performance     │ │
│ │ • Auto-refresh  │ │    │ │ • CRUD Ops      │ │    │ │ • Indexing      │ │
│ │ • Optimistic UI │ │    │ │ • Calculations  │ │    │ │ • Query Opt     │ │
│ │ • Live Updates  │ │    │ │ • Notifications │ │    │ │ • Connection    │ │
│ │ • CSV Export    │ │    │ │ • Integrations  │ │    │ │   Pooling       │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Authentication    │    │   External Services │    │   Monitoring &      │
│   (Supabase Auth)   │    │                     │    │   Analytics         │
│                     │    │ ┌─────────────────┐ │    │                     │
│ • JWT Tokens        │    │ │ Payment Gateway │ │    │ • Error Tracking    │
│ • Role-based Access │    │ │ • Stripe/Razorpay│ │    │ • Performance Logs  │
│ • Session Mgmt      │    │ └─────────────────┘ │    │ • User Analytics    │
│ • Password Reset    │    │ ┌─────────────────┐ │    │ • Business Metrics  │
│ • Multi-factor Auth │    │ │ Email Service   │ │    │ • Real-time Alerts  │
│                     │    │ │ • SMTP/SendGrid │ │    │                     │
│                     │    │ └─────────────────┘ │    │                     │
│                     │    │ ┌─────────────────┐ │    │                     │
│                     │    │ │ File Storage    │ │    │                     │
│                     │    │ │ • Supabase      │ │    │                     │
│                     │    │ │ • Cloudinary    │ │    │                     │
│                     │    │ └─────────────────┘ │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───►│  Component  │───►│  API Route  │───►│  Business   │───►│  Database   │
│ Interaction │    │   (React)   │    │ (Next.js)   │    │   Logic     │    │(PostgreSQL)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                   ▲                   │                   │                   │
       │                   │                   ▼                   ▼                   ▼
       │                   │            ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
       │                   │            │ Middleware  │    │ Validation  │    │   Prisma    │
       │                   │            │• Auth Check │    │• Input Val  │    │    ORM      │
       │                   │            │• Rate Limit │    │• Bus Rules  │    │• Queries    │
       │                   │            │• Logging    │    │• Transform  │    │• Relations  │
       │                   │            └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                                                           │
       │                   └─────────────────── Real-time Updates ◄──────────────────┘
       │
       └─────────────────────────── Optimistic UI Updates ◄─────────────────────────────────┘

Response Flow:
Database → Prisma → Business Logic → API Response → Component State → UI Update
```

### Module Architecture

```
OneFoodDialer Modules:

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Core Modules                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  🔐 Authentication    👥 CRM Module       📦 Order Management                   │
│  • User login/signup  • Customer profiles • Order processing                    │
│  • JWT tokens        • Contact info      • Status tracking                     │
│  • Role management   • Loyalty points    • Kitchen assignment                  │
│  • Session handling  • Wallet balance    • Delivery scheduling                 │
│                                                                                 │
│  🔄 Subscriptions     🧾 Billing Module   💰 Wallet System                     │
│  • Plan management   • Invoice generation• Digital wallet                      │
│  • Auto-renewal      • Payment tracking  • Transaction history                 │
│  • Status updates    • Tax calculations  • Balance management                  │
│  • Customer linking  • Payment methods   • Credit/debit ops                    │
│                                                                                 │
│  🍳 Kitchen Mgmt      📊 Analytics        🔧 System Admin                      │
│  • Kitchen profiles  • Real-time stats   • User management                     │
│  • Menu management   • Revenue reports   • Business settings                   │
│  • Capacity tracking • Customer insights • System monitoring                   │
│  • Operating hours   • Performance data  • Audit logs                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🔄 Data Flow Architecture

```
User Action → Component → API Route → Middleware → Business Logic → Database
     ↑                                                                  │
     └─────────────── Real-time Updates ←─────────────────────────────┘
```

## ⚙️ Tech Stack

### Frontend

- **Next.js 13+** - React framework with App Router
- **React 18** - UI library with hooks and context
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database

### Authentication & Security

- **Supabase Auth** - Authentication and user management
- **JWT Tokens** - Secure API authentication
- **Row Level Security** - Database-level security

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** - Unit testing framework

### Deployment

- **Vercel** - Frontend and API deployment
- **Supabase Cloud** - Database and auth hosting
- **GitHub Actions** - CI/CD pipeline

## 🚀 Quick Start

<!-- Updated Vercel token - testing complete CI/CD pipeline -->

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- Supabase account
- PostgreSQL database (or Supabase)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/onefooddialer.git
cd onefooddialer
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration (see
[Environment Variables](#environment-variables)).

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
npx prisma db seed
```

### 5. Start Development Server

```bash
# Start the development server
npm run dev
# or
yarn dev

# Server will start at http://localhost:3000
```

### 6. Access the Application

1. **Main Application**: [http://localhost:3000](http://localhost:3000)
2. **Admin Dashboard**:
   [http://localhost:3000/dashboard/admin](http://localhost:3000/dashboard/admin)
3. **API Documentation**:
   [http://localhost:3000/docs](http://localhost:3000/docs)
4. **Customer Portal**:
   [http://localhost:3000/customer/dashboard](http://localhost:3000/customer/dashboard)

### 7. Default Login Credentials

After seeding the database, you can use these default accounts:

```bash
# Super Admin
Email: admin@onefooddialer.com
Password: admin123

# Business Owner
Email: owner@business.com
Password: owner123

# Customer
Email: customer@example.com
Password: customer123
```

### 8. Verify Installation

Check that all features are working:

- [ ] ✅ Login/Authentication working
- [ ] ✅ Dashboard loads with real-time stats
- [ ] ✅ CRM page shows customer list
- [ ] ✅ CSV export functionality works
- [ ] ✅ Inline editing in tables works
- [ ] ✅ API documentation accessible at `/docs`
- [ ] ✅ Real-time dashboard updates every 60 seconds

## 🔧 Environment Setup

### Environment Variables

Create a `.env.local` file in the root directory:

| Variable                        | Description                  | Required | Example                                   |
| ------------------------------- | ---------------------------- | -------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL         | ✅       | `https://xxx.supabase.co`                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key       | ✅       | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key    | ✅       | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `DATABASE_URL`                  | PostgreSQL connection string | ✅       | `postgresql://user:pass@host:5432/db`     |
| `NEXTAUTH_SECRET`               | NextAuth.js secret           | ✅       | `your-secret-key`                         |
| `NEXTAUTH_URL`                  | Application URL              | ✅       | `http://localhost:3000`                   |
| `SMTP_HOST`                     | Email SMTP host              | ❌       | `smtp.gmail.com`                          |
| `SMTP_PORT`                     | Email SMTP port              | ❌       | `587`                                     |
| `SMTP_USER`                     | Email SMTP username          | ❌       | `your-email@gmail.com`                    |
| `SMTP_PASS`                     | Email SMTP password          | ❌       | `your-app-password`                       |
| `PAYMENT_GATEWAY_KEY`           | Payment gateway API key      | ❌       | `pk_test_xxx`                             |
| `SMS_API_KEY`                   | SMS service API key          | ❌       | `your-sms-api-key`                        |

### 📦 GitHub Actions Secrets

For automated deployment via GitHub Actions, configure these secrets in your
repository settings (`Settings → Secrets and variables → Actions`):

#### Required Deployment Secrets

| Secret Name                     | Description                  | Required | Where to Get                                                         |
| ------------------------------- | ---------------------------- | -------- | -------------------------------------------------------------------- |
| `VERCEL_TOKEN`                  | Vercel deployment token      | ✅       | [Vercel Account Settings](https://vercel.com/account/tokens)         |
| `VERCEL_ORG_ID`                 | Vercel organization ID       | ✅       | Run `vercel link` in project directory                               |
| `VERCEL_PROJECT_ID`             | Vercel project ID            | ✅       | Run `vercel link` in project directory                               |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL         | ✅       | [Supabase Dashboard](https://app.supabase.com) → Settings → API      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key       | ✅       | [Supabase Dashboard](https://app.supabase.com) → Settings → API      |
| `DATABASE_URL`                  | PostgreSQL connection string | ✅       | [Supabase Dashboard](https://app.supabase.com) → Settings → Database |

#### Optional Monitoring Secrets

| Secret Name                     | Description                     | Required | Where to Get                                               |
| ------------------------------- | ------------------------------- | -------- | ---------------------------------------------------------- |
| `SENTRY_AUTH_TOKEN`             | Sentry authentication token     | ❌       | [Sentry Settings](https://sentry.io/settings/auth-tokens/) |
| `SENTRY_ORG`                    | Sentry organization slug        | ❌       | Your Sentry organization name                              |
| `SENTRY_PROJECT`                | Sentry project slug             | ❌       | Your Sentry project name                                   |
| `NEXT_PUBLIC_SENTRY_DSN`        | Sentry Data Source Name         | ❌       | [Sentry Project Settings](https://sentry.io) → Client Keys |
| `NEXT_PUBLIC_LOGROCKET_APP_ID`  | LogRocket application ID        | ❌       | [LogRocket Dashboard](https://app.logrocket.com)           |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID | ❌       | [Google Analytics](https://analytics.google.com)           |

#### How to Set Up Secrets

1. **Go to your GitHub repository**
2. **Navigate to**: `Settings → Secrets and variables → Actions`
3. **Click**: `New repository secret`
4. **Add each secret** with the exact name and value from the table above

#### Vercel Setup Commands

To get your Vercel organization and project IDs:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project (run in project directory)
vercel link

# This will create .vercel/project.json with your IDs
cat .vercel/project.json
```

#### Deployment Workflow Features

- ✅ **Automated Testing** - Runs linting, formatting, and unit tests
- ✅ **Build Validation** - Ensures the application builds successfully
- ✅ **Preview Deployments** - Creates preview URLs for pull requests
- ✅ **Production Deployment** - Deploys to production on main branch
- ✅ **Health Checks** - Validates deployment with health endpoint
- ✅ **Error Monitoring** - Integrates with Sentry for release tracking
- ✅ **E2E Testing** - Runs end-to-end tests against preview deployments

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI**:
  [http://localhost:3000/docs/api](http://localhost:3000/docs/api)
- **Postman Collection**: Download from `/docs/postman-collection.json`

### API Endpoints Overview

| Module             | Endpoints              | Description                   |
| ------------------ | ---------------------- | ----------------------------- |
| **Authentication** | `/api/auth/*`          | Login, signup, password reset |
| **CRM**            | `/api/customers/*`     | Customer management           |
| **Orders**         | `/api/orders/*`        | Order processing and tracking |
| **Subscriptions**  | `/api/subscriptions/*` | Subscription management       |
| **Billing**        | `/api/invoices/*`      | Invoice and payment handling  |
| **Wallet**         | `/api/wallet/*`        | Digital wallet operations     |
| **Analytics**      | `/api/dashboard/*`     | Business metrics and reports  |

### Authentication

All API endpoints require authentication via Bearer token:

```bash
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting

- **1000 requests per hour** per authenticated user
- **100 requests per hour** for unauthenticated endpoints

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Ensure `NEXTAUTH_URL` points to your production domain

3. **Database Migration**
   ```bash
   # Run migrations on production database
   npx prisma db push
   ```

### Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Verify API endpoints
- [ ] Check real-time features
- [ ] Test payment integration (if configured)

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md)
for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🆘 Support

- **Documentation**: [/docs/api](http://localhost:3000/docs/api)
- **Issues**:
  [GitHub Issues](https://github.com/yourusername/onefooddialer/issues)
- **Email**: support@onefooddialer.com
- **Discord**: [Join our community](https://discord.gg/onefooddialer)

---

**Built with ❤️ by the OneFoodDialer Team**
