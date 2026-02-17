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
  serverExternalPackages: ['zustand', '@clerk/nextjs'],

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

  // Note: webpack config may not work with Turbopack (used in dev).
  // Only light-touch client-side optimization — Next.js handles
  // server-side code splitting internally (do NOT override it).
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      };
    }
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

  // Security and caching headers
  headers: async () => [
    // Aggressive caching for static assets (JavaScript, CSS, fonts)
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // Aggressive caching for public static files
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // Image optimization caching with stale-while-revalidate
    {
      source: '/_next/image',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400',
        },
      ],
    },
    // No caching for API routes (use Redis instead)
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, must-revalidate',
        },
      ],
    },
    // Security headers for all routes
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

// Sentry build options for source map uploading
const sentryBuildOptions = {
  silent: true,
  org: process.env.SENTRY_ORG || 'unite-hub',
  project: process.env.SENTRY_PROJECT || 'unite-hub-web',
};

// Sentry runtime options
const sentryOptions = {
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

// Only wrap with Sentry webpack plugin when SENTRY_AUTH_TOKEN is available.
// This prevents the Sentry webpack plugin from interfering with Turbopack builds.
// On Vercel, SENTRY_AUTH_TOKEN is set as an env var so production builds get Sentry source maps.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryBuildOptions, sentryOptions)
  : nextConfig;
