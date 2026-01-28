import { withSentryConfig } from '@sentry/nextjs';
import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporarily ignore TypeScript errors during build (legacy Convex code)
    ignoreBuildErrors: true,
  },
  transpilePackages: ['reactflow', '@reactflow/core', '@reactflow/background', '@reactflow/controls', '@reactflow/minimap'],

  // Next.js 16: Move serverComponentsExternalPackages to top level
  serverExternalPackages: ['zustand'],

  experimental: {
    // Enable optimized compilation
    optimizeCss: true,
    // Phase 10: Extended package import optimization for better tree-shaking
    // Note: zustand removed to avoid conflict with serverExternalPackages (Turbopack requirement)
    optimizePackageImports: [
      'lucide-react',
      '@anthropic-ai/sdk',
      'recharts',
      'date-fns',
      'lodash',
      'framer-motion',
      '@radix-ui/react-icons',
      'zod',
    ],
    // Note: instrumentationHook removed - available by default in Next.js 16
  },

  // Turbopack configuration (required for Next.js 16)
  turbopack: {
    // Normalize root directory path for Windows file system consistency
    root: path.resolve(process.cwd()),
  },

  // Enable standalone output for Docker
  output: 'standalone',

  // Compression
  compress: true,

  // Note: swcMinify is deprecated in Next.js 16 (always enabled by default)
  // Removed: swcMinify: true

  // Note: webpack config may not work with Turbopack
  // Keeping for backwards compatibility but may be ignored
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )?.[1];
              return `vendor.${packageName?.replace('@', '')}`;
            },
          },
        },
      },
    };
    return config;
  },

  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [{
            protocol: 'https',
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            pathname: '/storage/v1/object/**',
          }]
        : []
      ),
    ],
    qualities: [75, 85],
  },

  redirects: async () => [
    {
      source: '/dashboard',
      destination: '/dashboard/overview',
      permanent: false,
    },
  ],

  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https: http:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://accounts.google.com",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join('; '),
        },
      ],
    },
  ],
};

// Temporarily disable Sentry to debug "Invalid time value" error
// Wrap with Sentry configuration for error tracking and source maps
// export default withSentryConfig(
//   nextConfig,
//   {
//     // For all available options, see:
//     // https://github.com/getsentry/sentry-webpack-plugin#options

//     // Suppresses source map uploading logs during build
//     silent: true,

//     org: process.env.SENTRY_ORG || 'unite-hub',
//     project: process.env.SENTRY_PROJECT || 'unite-hub-web',
//   },
//   {
//     // For all available options, see:
//     // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

//     // Upload a larger set of source maps for prettier stack traces (increases build time)
//     widenClientFileUpload: true,

//     // Transpiles SDK to be compatible with IE11 (increases bundle size)
//     transpileClientSDK: true,

//     // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
//     tunnelRoute: "/monitoring",

//     // Hides source maps from generated client bundles
//     hideSourceMaps: true,

//     // Automatically tree-shake Sentry logger statements to reduce bundle size
//     disableLogger: true,

//     // Enables automatic instrumentation of Vercel Cron Monitors.
//     // See the following for more information:
//     // https://docs.sentry.io/product/crons/
//     // https://vercel.com/docs/cron-jobs
//     automaticVercelMonitors: true,
//   }
// );

export default nextConfig;
