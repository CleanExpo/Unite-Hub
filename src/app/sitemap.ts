import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://unitegroup.com.au';

// Define all static routes
const staticRoutes = [
  '/',
  '/about',
  '/about-us',
  '/services',
  '/services/initial-consultation',
  '/services/software-development',
  '/services/strategic-seo',
  '/services/business-strategy',
  '/services/quality-assurance',
  '/services/expert-education',
  '/pricing',
  '/contact',
  '/blog',
  '/case-studies',
  '/faq',
  '/privacy',
  '/terms',
  '/careers',
];

// Define supported locales
const locales = ['en', 'es', 'fr'];

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();
  
  // Generate URLs for all locale/route combinations
  const urls: MetadataRoute.Sitemap = [];
  
  // Add root URL
  urls.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1,
  });
  
  // Add all static routes for each locale
  locales.forEach(locale => {
    staticRoutes.forEach(route => {
      urls.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: currentDate,
        changeFrequency: route === '/' ? 'daily' : 'weekly',
        priority: route === '/' ? 1 : route.startsWith('/services') ? 0.9 : 0.8,
      });
    });
  });
  
  // Add dynamic routes (blog posts, case studies, etc.)
  // These would typically come from a database
  // For now, we'll add placeholders
  
  return urls;
}
