/**
 * Dynamic Sitemap Generation
 *
 * Generates a complete sitemap including:
 * - Static pages (home, pricing, about, etc.)
 * - Dynamic region pages (/regions/[country]/[city])
 * - Blog posts (if applicable)
 *
 * Next.js automatically serves this at /sitemap.xml
 */

import { MetadataRoute } from 'next';
import { getAllRegions } from '@/lib/seo/regionCopy';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://synthex.social';

  // Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/#pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Dynamic region pages - HIGH PRIORITY for local SEO
  const regionPages: MetadataRoute.Sitemap = getAllRegions().map(({ country, city }) => ({
    url: `${baseUrl}/regions/${country}/${city}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85, // High priority for local SEO
  }));

  // Marketing pages
  const marketingPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Blog pages (if they exist)
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Combine all pages
  return [
    ...staticPages,
    ...regionPages, // Region pages get high priority
    ...marketingPages,
    ...blogPages,
  ];
}
