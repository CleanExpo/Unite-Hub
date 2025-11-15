/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporarily ignore TypeScript errors during build (legacy Convex code)
    ignoreBuildErrors: true,
  },
  // Enable standalone output for Docker
  output: 'standalone',
  redirects: async () => [
    {
      source: '/dashboard',
      destination: '/dashboard/overview',
      permanent: false,
    },
  ],
};

export default nextConfig;
