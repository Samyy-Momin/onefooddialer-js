#!/usr/bin/env node

/**
 * OneFoodDialer Environment Validation Script
 * 
 * This script validates that all required environment variables are properly configured
 * for both local development and GitHub Actions deployment.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Required environment variables for different contexts
const requiredVars = {
  local: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL'
  ],
  github: [
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL'
  ],
  optional: [
    'SENTRY_AUTH_TOKEN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'NEXT_PUBLIC_SENTRY_DSN',
    'NEXT_PUBLIC_LOGROCKET_APP_ID',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'PAYMENT_GATEWAY_KEY',
    'SMS_API_KEY'
  ]
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateUrl(url, name) {
  try {
    new URL(url);
    return true;
  } catch {
    log(`  ❌ ${name} is not a valid URL`, 'red');
    return false;
  }
}

function validateSupabaseUrl(url) {
  if (!validateUrl(url, 'NEXT_PUBLIC_SUPABASE_URL')) return false;
  
  if (!url.includes('.supabase.co')) {
    log('  ⚠️  URL should be a Supabase URL (*.supabase.co)', 'yellow');
    return false;
  }
  
  return true;
}

function validateSupabaseKey(key) {
  if (!key.startsWith('eyJ')) {
    log('  ❌ Supabase key should start with "eyJ" (JWT format)', 'red');
    return false;
  }
  
  return true;
}

function validateDatabaseUrl(url) {
  if (!url.startsWith('postgresql://')) {
    log('  ❌ DATABASE_URL should start with "postgresql://"', 'red');
    return false;
  }
  
  return true;
}

function validateEnvironmentVariable(name, value) {
  if (!value) {
    return false;
  }

  // Specific validations
  switch (name) {
    case 'NEXT_PUBLIC_SUPABASE_URL':
      return validateSupabaseUrl(value);
    
    case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
      return validateSupabaseKey(value);
    
    case 'DATABASE_URL':
      return validateDatabaseUrl(value);
    
    case 'NEXT_PUBLIC_SENTRY_DSN':
      return validateUrl(value, 'NEXT_PUBLIC_SENTRY_DSN');
    
    case 'NEXTAUTH_URL':
      return validateUrl(value, 'NEXTAUTH_URL');
    
    default:
      return true;
  }
}

function checkLocalEnvironment() {
  log('\n🔍 Checking Local Environment (.env.local)...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red');
    log('💡 Create .env.local file and copy variables from .env.example', 'yellow');
    return false;
  }

  // Load .env.local
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  let allValid = true;

  // Check required variables
  requiredVars.local.forEach(varName => {
    const value = envVars[varName];
    
    if (!value) {
      log(`❌ ${varName} is missing`, 'red');
      allValid = false;
    } else if (!validateEnvironmentVariable(varName, value)) {
      log(`❌ ${varName} is invalid`, 'red');
      allValid = false;
    } else {
      log(`✅ ${varName}`, 'green');
    }
  });

  // Check optional variables
  log('\n📋 Optional Variables:', 'cyan');
  requiredVars.optional.forEach(varName => {
    const value = envVars[varName];
    
    if (value) {
      if (validateEnvironmentVariable(varName, value)) {
        log(`✅ ${varName} (configured)`, 'green');
      } else {
        log(`⚠️  ${varName} (configured but invalid)`, 'yellow');
      }
    } else {
      log(`⚪ ${varName} (not configured)`, 'reset');
    }
  });

  return allValid;
}

function checkGitHubSecrets() {
  log('\n🔍 GitHub Actions Secrets Checklist...', 'blue');
  log('ℹ️  These should be configured in GitHub repository settings:', 'cyan');
  log('   Settings → Secrets and variables → Actions\n', 'cyan');

  log('📋 Required Deployment Secrets:', 'magenta');
  requiredVars.github.forEach(varName => {
    log(`  ⚪ ${varName}`, 'reset');
  });

  log('\n📋 Optional Monitoring Secrets:', 'magenta');
  requiredVars.optional.filter(varName => 
    varName.includes('SENTRY') || 
    varName.includes('LOGROCKET') || 
    varName.includes('GA_MEASUREMENT')
  ).forEach(varName => {
    log(`  ⚪ ${varName}`, 'reset');
  });

  log('\n💡 To validate GitHub secrets, check your workflow runs:', 'yellow');
  log('   https://github.com/your-username/your-repo/actions', 'yellow');
}

function showSetupInstructions() {
  log('\n📚 Setup Instructions:', 'blue');
  log('', 'reset');
  log('1. Local Development:', 'bold');
  log('   cp .env.example .env.local', 'cyan');
  log('   # Edit .env.local with your values', 'cyan');
  log('', 'reset');
  log('2. Supabase Setup:', 'bold');
  log('   • Create project at https://app.supabase.com', 'cyan');
  log('   • Get URL and anon key from Settings → API', 'cyan');
  log('   • Get database URL from Settings → Database', 'cyan');
  log('', 'reset');
  log('3. Vercel Setup:', 'bold');
  log('   npm install -g vercel', 'cyan');
  log('   vercel login', 'cyan');
  log('   vercel link', 'cyan');
  log('   cat .vercel/project.json  # Get org and project IDs', 'cyan');
  log('', 'reset');
  log('4. GitHub Secrets:', 'bold');
  log('   • Go to repository Settings → Secrets and variables → Actions', 'cyan');
  log('   • Add each required secret from the checklist above', 'cyan');
  log('', 'reset');
  log('📖 For detailed instructions, see:', 'yellow');
  log('   • README.md - Environment Variables section', 'yellow');
  log('   • GITHUB_ACTIONS_SETUP.md - Complete setup guide', 'yellow');
}

function main() {
  log('🍽️  OneFoodDialer Environment Validation', 'bold');
  log('=' .repeat(50), 'cyan');

  const localValid = checkLocalEnvironment();
  checkGitHubSecrets();
  showSetupInstructions();

  log('\n' + '=' .repeat(50), 'cyan');
  
  if (localValid) {
    log('✅ Local environment is properly configured!', 'green');
    log('🚀 You can now run: npm run dev', 'green');
  } else {
    log('❌ Local environment needs configuration', 'red');
    log('🔧 Please fix the issues above before running the application', 'red');
  }

  log('\n💡 Run this script anytime with: node scripts/validate-env.js', 'yellow');
}

// Run the validation
main();
