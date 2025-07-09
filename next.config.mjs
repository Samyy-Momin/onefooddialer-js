/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Environment variable validation during build
  env: {
    // Ensure critical environment variables are available during build
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  },

  // Webpack configuration for better error handling
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js modules in client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;
