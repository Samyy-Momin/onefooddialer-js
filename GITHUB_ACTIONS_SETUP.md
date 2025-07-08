# GitHub Actions Setup Guide for OneFoodDialer

This guide provides detailed instructions for setting up GitHub Actions CI/CD
pipeline for OneFoodDialer deployment.

## 🚀 Overview

The GitHub Actions workflow provides:

- ✅ Automated testing (linting, formatting, unit tests)
- ✅ Build validation
- ✅ Preview deployments for pull requests
- ✅ Production deployment on main branch
- ✅ Health checks and monitoring integration
- ✅ End-to-end testing

## 📋 Prerequisites

1. **GitHub Repository** - Your OneFoodDialer code in a GitHub repository
2. **Vercel Account** - For deployment hosting
3. **Supabase Project** - For database and authentication
4. **Optional**: Sentry, LogRocket, Google Analytics accounts for monitoring

## 🔧 Step-by-Step Setup

### Step 1: Vercel Setup

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

3. **Login and Link Project**

   ```bash
   # Login to Vercel
   vercel login

   # Navigate to your project directory
   cd your-onefooddialer-project

   # Link the project
   vercel link
   ```

4. **Get Organization and Project IDs**

   ```bash
   # This creates .vercel/project.json with your IDs
   cat .vercel/project.json
   ```

   Example output:

   ```json
   {
     "orgId": "team_xxxxxxxxxxxxxxxxxx",
     "projectId": "prj_xxxxxxxxxxxxxxxxxx"
   }
   ```

5. **Get Vercel Token**
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Name it "GitHub Actions"
   - Copy the token (you won't see it again)

### Step 2: Supabase Setup

1. **Create Supabase Project**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Create new project

2. **Get API Keys**
   - Go to Settings → API
   - Copy `URL` and `anon public` key

3. **Get Database URL**
   - Go to Settings → Database
   - Copy the connection string under "Connection string"
   - Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Configure GitHub Secrets

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click `Settings` → `Secrets and variables` → `Actions`

2. **Add Required Secrets**

   Click "New repository secret" for each:

   **Deployment Secrets (Required):**

   ```
   VERCEL_TOKEN=your_vercel_token_here
   VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxx
   VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
   ```

### Step 4: Optional Monitoring Setup

#### Sentry (Error Monitoring)

1. Create account at [sentry.io](https://sentry.io)
2. Create new Next.js project
3. Get DSN from Project Settings → Client Keys
4. Create auth token at Settings → Auth Tokens
5. Add secrets:
   ```
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   SENTRY_ORG=your-org-name
   SENTRY_PROJECT=your-project-name
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

#### LogRocket (Session Replay)

1. Create account at [logrocket.com](https://logrocket.com)
2. Create new application
3. Get App ID from dashboard
4. Add secret:
   ```
   NEXT_PUBLIC_LOGROCKET_APP_ID=your-app-id
   ```

#### Google Analytics

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID
3. Add secret:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### Step 5: Test the Workflow

1. **Push to Main Branch**

   ```bash
   git add .
   git commit -m "feat: setup GitHub Actions deployment"
   git push origin main
   ```

2. **Create Pull Request**

   ```bash
   git checkout -b feature/test-deployment
   git push origin feature/test-deployment
   # Create PR on GitHub
   ```

3. **Monitor Workflow**
   - Go to Actions tab in your GitHub repository
   - Watch the workflow run
   - Check for any errors

## 🔍 Troubleshooting

### Common Issues

1. **"Secret not found" errors**
   - Verify secret names match exactly (case-sensitive)
   - Ensure secrets are set in repository settings, not organization

2. **Vercel deployment fails**
   - Check VERCEL_TOKEN is valid
   - Verify VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct
   - Ensure Vercel project is linked to correct GitHub repository

3. **Build failures**
   - Check all required environment variables are set
   - Verify Supabase credentials are correct
   - Review build logs for specific errors

4. **Health check fails**
   - Ensure `/api/health` endpoint is working
   - Check if deployment is fully ready (may need longer wait time)
   - Verify database connectivity

### Debugging Steps

1. **Check Workflow Logs**
   - Go to Actions tab → Click on failed workflow
   - Expand failed steps to see detailed logs

2. **Test Locally**

   ```bash
   # Test build locally
   npm run build

   # Test health endpoint
   npm run dev
   curl http://localhost:3000/api/health
   ```

3. **Verify Secrets**
   ```bash
   # Test Vercel CLI with your token
   vercel --token your_token_here whoami
   ```

## 📊 Workflow Features

### Automated Testing

- ESLint code quality checks
- Prettier formatting validation
- Jest unit tests with coverage
- Build validation

### Deployment

- Preview deployments for pull requests
- Production deployment on main branch
- Automatic health checks
- Rollback capabilities

### Monitoring

- Sentry error tracking and release monitoring
- Performance monitoring
- Real-time alerts

### Security

- Secret validation before deployment
- Environment isolation
- Secure token handling

## 🎯 Best Practices

1. **Branch Protection**
   - Require PR reviews
   - Require status checks to pass
   - Restrict direct pushes to main

2. **Environment Management**
   - Use different Vercel projects for staging/production
   - Separate Supabase projects for different environments
   - Environment-specific secrets

3. **Monitoring**
   - Set up alerts for deployment failures
   - Monitor application performance
   - Track error rates

4. **Security**
   - Regularly rotate tokens
   - Use least-privilege access
   - Monitor secret usage

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Verify all secrets are correctly configured
4. Test components individually (Vercel CLI, Supabase connection, etc.)

---

**Next Steps**: After setup is complete, refer to
[DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guidelines.
