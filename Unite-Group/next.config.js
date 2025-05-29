// const withNextIntl = require('next-intl/plugin')('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tell Next.js to use the src directory
  distDir: '.next',
  images: {
    domains: [
      'localhost',
      'unite-group.vercel.app',
      'cdn.unite-group.vercel.app',
      'unite-group-cdn.vercel.app'
    ],
    unoptimized: process.env.NODE_ENV === 'development',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // Ensure proper handling of environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CDN_ENABLED: process.env.NODE_ENV === 'production' ? 'true' : process.env.NEXT_PUBLIC_CDN_ENABLED,
    NEXT_PUBLIC_CDN_PROVIDER: process.env.NEXT_PUBLIC_CDN_PROVIDER || 'vercel',
    NEXT_PUBLIC_CDN_BASE_URL: process.env.NEXT_PUBLIC_CDN_BASE_URL,
    ENABLE_CDN_REDIRECT: process.env.ENABLE_CDN_REDIRECT || 'false',
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

module.exports = nextConfig;
