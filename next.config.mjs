/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  
  // Build optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Error handling
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Experimental features
  experimental: {
    serverActions: true,
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Webpack configuration with automatic bundle analysis
  webpack: (config, { isServer, dev }) => {
    // Automatically enable bundle analysis for production builds or when explicitly requested
    const shouldAnalyze = process.env.ANALYZE === 'true' || 
                         (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production')
    
    if (shouldAnalyze && !isServer) {
      try {
        const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')()
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: 'bundle-stats.json',
          })
        )
        console.log('📊 Bundle analysis enabled for this build')
      } catch (error) {
        console.warn('⚠️ Bundle analyzer not available, skipping analysis')
      }
    }
    
    // Handle problematic modules
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'canvas',
        'jsdom',
        'pdfkit',
        'canvas-prebuilt',
        'node-canvas',
      ]
    }
    
    // Client-side fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        canvas: false,
        crypto: false,
      }
    }
    
    // Optimization for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-Deployment-ID',
            value: process.env.VERCEL_DEPLOYMENT_ID || 'local',
          },
          {
            key: 'X-Git-Commit',
            value: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
          },
        ],
      },
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // Automatically expose Vercel system variables to client
  env: {
    // Public variables (safe to expose to client)
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL || 'localhost:3000',
    NEXT_PUBLIC_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || 'local',
    NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    NEXT_PUBLIC_GIT_BRANCH: process.env.VERCEL_GIT_COMMIT_REF || 'local',
    NEXT_PUBLIC_REGION: process.env.VERCEL_REGION || 'local',
    
    // Build information
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_NODE_VERSION: process.version,
  },
}

export default nextConfig
