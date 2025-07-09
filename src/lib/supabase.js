// OneFoodDialer - Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import {
  createClientComponentClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';

// Get environment variables with comprehensive safety checks
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Critical fix: Handle masked environment variables from GitHub Actions
// GitHub Actions masks secrets as *** which causes Invalid URL errors
if (supabaseUrl && supabaseUrl.includes('***')) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL contains masked values, using fallback');
  supabaseUrl = undefined; // Force fallback
}

if (supabaseAnonKey && supabaseAnonKey.includes('***')) {
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY contains masked values, using fallback');
  supabaseAnonKey = undefined; // Force fallback
}

// Validate environment variables with better error handling
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  console.error('Missing Supabase environment variables:', missingVars);

  // During build time, provide fallback values to prevent build failures
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    console.warn('Using fallback Supabase configuration for build process');
  } else {
    throw new Error(`Missing Supabase environment variables: ${missingVars.join(', ')}`);
  }
}

// Use fallback values during build if needed
// Ensure URLs don't contain masked values (GitHub Actions masks secrets as ***)
let finalSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
let finalSupabaseAnonKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Additional comprehensive safety checks for any remaining masked values
if (
  finalSupabaseUrl &&
  (finalSupabaseUrl.includes('***') ||
    finalSupabaseUrl === '***' ||
    finalSupabaseUrl.endsWith('***/'))
) {
  console.warn('Supabase URL contains masked values, using safe fallback');
  finalSupabaseUrl = 'https://placeholder.supabase.co';
}

if (
  finalSupabaseAnonKey &&
  (finalSupabaseAnonKey.includes('***') || finalSupabaseAnonKey === '***')
) {
  console.warn('Supabase key contains masked values, using safe fallback');
  finalSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';
}

// Final validation: ensure we have valid URL format
try {
  new URL(finalSupabaseUrl);
} catch (error) {
  console.warn('Final Supabase URL validation failed, using safe fallback:', error.message);
  finalSupabaseUrl = 'https://placeholder.supabase.co';
}

// Client-side Supabase client with build-time safety
let supabaseClient;
try {
  // Additional check: if we're in build mode and URL looks suspicious, use minimal config
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    // We're in build mode - use absolute minimal configuration
    if (!finalSupabaseUrl.startsWith('https://') || finalSupabaseUrl.includes('***')) {
      console.warn('Build-time: Using minimal Supabase configuration');
      finalSupabaseUrl = 'https://placeholder.supabase.co';
      finalSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';
    }
  }

  supabaseClient = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a minimal fallback client
  supabaseClient = createClient(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export const supabase = supabaseClient;

// Client component helper (with build-time safety)
export const createSupabaseClient = () => {
  try {
    return createClientComponentClient();
  } catch (error) {
    console.warn('Failed to create Supabase client component client:', error.message);
    return supabase; // Fallback to main client
  }
};

// Server component helper (with build-time safety)
export const createSupabaseServerClient = context => {
  try {
    return createServerComponentClient(context);
  } catch (error) {
    console.warn('Failed to create Supabase server component client:', error.message);
    return supabase; // Fallback to main client
  }
};

// Admin client with service role key (with fallbacks for build time)
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Handle masked service role key from GitHub Actions
if (serviceRoleKey && serviceRoleKey.includes('***')) {
  console.warn('Service role key contains masked values, using fallback');
  serviceRoleKey = undefined; // Force fallback
}

// Use fallback if undefined
serviceRoleKey = serviceRoleKey || 'placeholder-service-key';

// Additional safety: ensure no masked values remain
if (serviceRoleKey && (serviceRoleKey.includes('***') || serviceRoleKey === '***')) {
  console.warn('Service role key still contains masked values, using safe fallback');
  serviceRoleKey = 'placeholder-service-key';
}

// Create admin client with comprehensive error handling
let supabaseAdminClient;
try {
  supabaseAdminClient = createClient(finalSupabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} catch (error) {
  console.error('Failed to create Supabase admin client:', error);
  // Create a minimal fallback admin client
  supabaseAdminClient = createClient('https://placeholder.supabase.co', 'placeholder-service-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseAdmin = supabaseAdminClient;

export default supabase;
