// OneFoodDialer - Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import {
  createClientComponentClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
const finalSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalSupabaseAnonKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Client-side Supabase client
export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
export const supabaseAdmin = createClient(finalSupabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
