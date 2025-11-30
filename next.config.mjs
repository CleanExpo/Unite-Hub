/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable standalone output for Vercel/Docker
  output: 'standalone',

  typescript: {
    // Ignore TypeScript errors during Vercel builds
    ignoreBuildErrors: process.env.VERCEL === '1',
  },

  eslint: {
    // Ignore ESLint during Vercel builds
    ignoreDuringBuilds: process.env.VERCEL === '1',
  },

  transpilePackages: ['reactflow', '@reactflow/core', '@reactflow/background', '@reactflow/controls', '@reactflow/minimap'],

  // Next.js 16: Move serverComponentsExternalPackages to top level
  serverExternalPackages: [
    'zustand',
    'sharp',
    'puppeteer',
    'puppeteer-core',
    '@sparticuz/chromium',
    'pdfkit',
    'canvas'
  ],

  experimental: {
    // CRITICAL: Exclude large files from serverless function bundles
    outputFileTracingExcludes: {
      '*': [
        './logs/**',
        './health-check-reports/**',
        './**/*.log',
        './**/*.log.*',
        './node_modules/@swc/core-linux-x64-gnu',
        './node_modules/@swc/core-linux-x64-musl',
        './node_modules/@esbuild/linux-x64',
        './node_modules/sharp/vendor/**',
        './src/lib/__tests__/**',
        './coverage/**',
        './.git/**'
      ]
    },
    // Enable optimized compilation
    optimizeCss: true,
    // Phase 10: Extended package import optimization for better tree-shaking
    optimizePackageImports: [
      'lucide-react',
      '@anthropic-ai/sdk',
      'recharts',
      'date-fns',
      'lodash',
      'lodash-es',
      'framer-motion',
      '@radix-ui/react-icons',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'zod',
    ],
    // Note: instrumentationHook removed - available by default in Next.js 16
  },

  // Turbopack configuration (required for Next.js 16)
  turbopack: {
    // Specify the correct root directory to avoid workspace detection errors
    root: process.cwd(),
  },

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
      { protocol: 'https', hostname: '**' }
    ],
    formats: ['image/avif', 'image/webp']
  },

  // Disable production source maps to reduce bundle size
  productionBrowserSourceMaps: false,

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

export default nextConfig;
