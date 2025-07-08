# OneFoodDialer Deployment Guide

This guide covers deploying OneFoodDialer to production using Vercel with GitHub
integration.

## Prerequisites

- GitHub account
- Vercel account (connected to GitHub)
- Supabase project
- Domain name (optional)

## Environment Setup

### 1. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Go to Settings → Database to get your connection string:
   - `DATABASE_URL`

### 2. Monitoring Setup

#### Sentry (Error Monitoring)

1. Create account at [sentry.io](https://sentry.io)
2. Create new project for "Next.js"
3. Get your DSN and add to environment variables:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`

#### LogRocket (Session Replay)

1. Create account at [logrocket.com](https://logrocket.com)
2. Create new application
3. Get your App ID:
   - `NEXT_PUBLIC_LOGROCKET_APP_ID`

#### Google Analytics (Optional)

1. Create GA4 property
2. Get Measurement ID:
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID`

## GitHub Repository Setup

### 1. Create Repository

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: OneFoodDialer SaaS platform"

# Add GitHub remote (replace with your repository)
git remote add origin https://github.com/yourusername/onefooddialer.git
git branch -M main
git push -u origin main
```

### 2. GitHub Secrets

Add these secrets in GitHub repository settings → Secrets and variables →
Actions:

**Required Secrets:**

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

**Optional Monitoring Secrets:**

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `NEXT_PUBLIC_LOGROCKET_APP_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

## Vercel Deployment

### 1. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2. Environment Variables

Add all environment variables in Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.example`
3. Set different values for Production, Preview, and Development

### 3. Domain Configuration (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Database Setup

### 1. Run Migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (if using migration files)
npm run db:migrate
```

### 2. Seed Data (Optional)

Create a seed script to populate initial data:

```bash
# Create seed script
npm run db:seed
```

## Monitoring Configuration

### 1. Sentry Setup

The application is pre-configured with Sentry. Just add the environment
variables:

- Error tracking
- Performance monitoring
- Release tracking
- User feedback

### 2. LogRocket Setup

Session replay is automatically initialized when `NEXT_PUBLIC_LOGROCKET_APP_ID`
is set.

### 3. Health Checks

The application includes a health check endpoint at `/api/health` that monitors:

- Database connectivity
- Supabase connection
- Memory usage
- Environment variables
- API endpoints

## Deployment Process

### Automatic Deployment

1. **Push to `main` branch** → Deploys to production
2. **Create Pull Request** → Creates preview deployment
3. **Push to `develop` branch** → Deploys to staging (if configured)

### Manual Deployment

```bash
# Deploy to production
npm run deploy:vercel

# Deploy preview
npm run deploy:preview
```

## Post-Deployment Checklist

- [ ] Health check passes: `https://yourdomain.com/api/health`
- [ ] Authentication works (login/signup)
- [ ] Database operations work
- [ ] Monitoring is receiving data
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] Performance is acceptable
- [ ] Error tracking is working

## Monitoring & Alerts

### 1. Uptime Monitoring

Set up uptime monitoring using:

- Vercel Analytics (built-in)
- UptimeRobot
- Pingdom
- StatusCake

Monitor these endpoints:

- `https://yourdomain.com/api/health`
- `https://yourdomain.com/login`
- `https://yourdomain.com/dashboard/admin`

### 2. Performance Monitoring

- Core Web Vitals via Vercel Analytics
- Real User Monitoring via LogRocket
- Error rates via Sentry
- API response times via health checks

### 3. Business Metrics

Track key business metrics:

- User registrations
- Subscription creations
- Revenue metrics
- Customer activity

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify database connectivity
   - Review build logs

2. **Runtime Errors**
   - Check Sentry for error details
   - Verify API endpoints
   - Check database schema

3. **Performance Issues**
   - Review Vercel Analytics
   - Check database query performance
   - Monitor memory usage

### Support

- Check GitHub Issues
- Review Vercel documentation
- Contact support team

## Security Considerations

- All environment variables are encrypted
- HTTPS is enforced
- Security headers are configured
- Rate limiting is implemented
- Input validation is in place
- SQL injection protection via Prisma

## Backup & Recovery

- Database backups via Supabase
- Code versioning via GitHub
- Environment variable backups
- Monitoring data retention

---

For more detailed information, refer to the main README.md file.
