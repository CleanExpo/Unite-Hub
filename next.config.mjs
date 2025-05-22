/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
  // Improved webpack configuration to handle problematic modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark canvas and related modules as external to prevent bundling
      config.externals = [
        ...(config.externals || []),
        'canvas',
        'jsdom',
        'pdfkit',
        'canvas-prebuilt',
        'node-canvas',
      ];
    }
    
    // Add fallbacks for node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        canvas: false,
      };
    }
    
    return config;
  },
}

export default nextConfig
