import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';
import path from 'node:path';

// Enable bundle analyzer with ANALYZE=true environment variable
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

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

// Wrap with bundle analyzer, then Sentry
export default bundleAnalyzer(
  withSentryConfig(
    nextConfig,
    {
      silent: true,
      org: process.env.SENTRY_ORG || 'unite-hub',
      project: process.env.SENTRY_PROJECT || 'unite-hub-web',
    },
    {
      widenClientFileUpload: true,
      transpileClientSDK: true,
      tunnelRoute: "/monitoring",
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    }
  )
);
