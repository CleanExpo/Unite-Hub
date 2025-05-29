/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Ensure proper handling of environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Avoid issues with canvas and other problematic modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add problematic modules to externals
      config.externals = [...(config.externals || []), 'canvas']
    }
    return config
  },
}

module.exports = nextConfig
