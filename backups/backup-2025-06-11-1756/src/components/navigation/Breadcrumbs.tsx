'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/SEOHead';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Skip breadcrumbs on homepage
  if (pathname === '/' || pathname === '/en' || pathname === '/es' || pathname === '/fr') {
    return null;
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname?.split('/').filter(Boolean) || [];
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', href: '/' }
    ];

    // Remove locale from segments if present
    const locales = ['en', 'es', 'fr'];
    if (locales.includes(segments[0])) {
      segments.shift();
    }

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      // Transform segment to readable name
      const name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        name,
        href: isLast ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  
  // Generate schema for SEO
  const schemaItems = breadcrumbs.map((item, index) => ({
    name: item.name,
    url: item.href ? `https://unitegroup.com.au${item.href}` : undefined
  }));

  const breadcrumbSchema = generateBreadcrumbSchema(schemaItems);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <nav 
        aria-label="Breadcrumb" 
        className="container mx-auto px-4 py-4"
      >
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <li key={item.name} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                )}
                
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center"
                  >
                    {index === 0 && <Home className="h-4 w-4 mr-1" />}
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.name}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
