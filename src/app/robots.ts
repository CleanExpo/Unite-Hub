/**
 * Robots.txt Configuration
 *
 * Defines which pages search engines can crawl.
 * Next.js automatically serves this at /robots.txt
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // API routes
          '/dashboard/',     // Private dashboard
          '/admin/',         // Admin panel
          '/founder/',       // Founder tools
          '/_next/',         // Next.js internals
          '/auth/',          // Auth pages
          '/login',          // Login page
          '/signup',         // Signup page
          '/console/',       // Internal console
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/founder/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/founder/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
