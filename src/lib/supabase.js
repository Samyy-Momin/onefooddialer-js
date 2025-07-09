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

// Client component helper
export const createSupabaseClient = () => {
  return createClientComponentClient();
};

// Server component helper
export const createSupabaseServerClient = context => {
  return createServerComponentClient(context);
};

// Admin client with service role key
export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
