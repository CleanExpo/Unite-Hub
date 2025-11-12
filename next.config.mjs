/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporarily ignore TypeScript errors during build (legacy Convex code)
    ignoreBuildErrors: true,
  },
  redirects: async () => [
    {
      source: '/dashboard',
      destination: '/dashboard/overview',
      permanent: false,
    },
  ],
};

export default nextConfig;
