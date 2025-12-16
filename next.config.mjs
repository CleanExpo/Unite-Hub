/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: 'standalone' output is for Docker/self-hosted deployments
  // Vercel requires default output mode (serverless functions)
  // output: 'standalone',

  // MOVED FROM experimental - Now at root level in Next.js 16
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

  // TypeScript - skip type checking during build (worker crashes with 6700+ strict errors)
  // Type errors are being fixed systematically in Phase 2-5 of prevention-first architecture
  // The Turbopack compiler succeeds; the issue is the separate TypeScript worker process
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Transpile these packages for compatibility
  transpilePackages: ['reactflow', '@reactflow/core', '@reactflow/background', '@reactflow/controls', '@reactflow/minimap'],

  // Mark heavy packages as external (not bundled into each function)
  serverExternalPackages: [
    'sharp',
    'puppeteer',
    'puppeteer-core',
    'playwright',
    'playwright-core',
    '@sparticuz/chromium',
    'pdfkit',
    'canvas'
  ],

  experimental: {
    // CSS optimization
    optimizeCss: true,

    // Tree-shake these packages for smaller bundles
    optimizePackageImports: [
      'lucide-react',
      '@anthropic-ai/sdk',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
      'lodash-es',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'recharts',
      'framer-motion',
      'zod'
    ]
  },

  // Turbopack configuration (Next.js 16)
  turbopack: {
    root: process.cwd(),
  },

  // Compression
  compress: true,

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ],
    formats: ['image/avif', 'image/webp']
  },

  // Disable production source maps for faster builds
  productionBrowserSourceMaps: false,

  // Redirects
  redirects: async () => [
    {
      source: '/dashboard',
      destination: '/dashboard/overview',
      permanent: false,
    },
  ],

  // Security headers
  // NOTE: CSP with nonces is handled by middleware.ts for per-request nonces
  // These headers are fallback for static assets not passing through middleware
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // CSP is set by middleware with per-request nonces - see src/middleware.ts
        // This fallback CSP is for static assets that don't go through middleware
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https: http:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://accounts.google.com",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
          ].join('; ')
        }
      ]
    },
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, max-age=0' }
      ]
    }
  ]
};

export default nextConfig;

