import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resilient Next.js configuration for Docker builds
const nextConfig = {
  // CRITICAL: Enable standalone output for Docker
  output: 'standalone',
  
  // React optimizations
  reactStrictMode: true,
  
  // Memory optimization for Docker builds
  experimental: {
    webpackMemoryOptimizations: true,
    esmExternals: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // For monorepos, adjust the tracing root (moved from experimental)
  outputFileTracingRoot: path.join(__dirname, './'),
  
  // Exclude unnecessary files from standalone build
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
      'node_modules/@esbuild/win32-x64',
      'node_modules/@esbuild/darwin-x64',
      'node_modules/@esbuild/darwin-arm64',
      '.git/**/*',
      'tests/**/*',
      'docs/**/*',
      '*.md',
      'archived_docs/**/*',
      'backups/**/*',
    ],
  },
  
  // Production optimizations
  compress: true,
  productionBrowserSourceMaps: true,
  
  // Image optimization for Docker
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unite-group.com', 
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    domains: [],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // TypeScript configuration (resilient)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration (resilient)
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Environment variables
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    DOCKER_BUILD: process.env.DOCKER_BUILD || '',
  },
  
  // Webpack optimization for Docker builds
  webpack: (config, { isServer, dev }) => {
    // Aliases for better module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/types': path.resolve(__dirname, 'src/types'),
    };
    
    // Disable webpack cache in Docker if needed
    if (!dev && process.env.DISABLE_WEBPACK_CACHE === 'true') {
      config.cache = false;
    }
    
    // Optimize bundle splitting for production
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier());
            },
            name: 'lib',
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
        maxAsyncRequests: 25,
        maxInitialRequests: 20,
      };
    }
    
    // Memory optimization
    if (process.env.NODE_ENV === 'production') {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    
    // Add proper module resolution
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', ...config.resolve.extensions];
    
    // Handle ESM modules
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    return config;
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options', 
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
