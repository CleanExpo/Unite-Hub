'use client';

/**
 * MetadataUpdater Component
 * Phase 15 Week 5-6 - Production Polish
 *
 * Updates document title and meta tags based on current route.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Route to title mapping - comprehensive coverage
const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/overview': 'Overview',
  '/dashboard/contacts': 'Contacts',
  '/dashboard/campaigns': 'Campaigns',
  '/dashboard/content': 'Content',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/settings': 'Settings',
  '/dashboard/profile': 'Profile',
  '/dashboard/billing': 'Billing',
  '/dashboard/ai-tools': 'AI Tools',
  '/dashboard/emails': 'Emails',
  '/staff': 'Staff Portal',
  '/staff/projects': 'Projects',
  '/staff/tasks': 'Tasks',
  '/staff/reports': 'Reports',
  '/staff/scope-review': 'Scope Review',
  '/staff/time-tracker': 'Time Tracker',
  '/client': 'Client Portal',
  '/client/projects': 'My Projects',
  '/client/proposals': 'Proposals',
  '/client/vault': 'Document Vault',
  '/client/ideas': 'Ideas',
};

// Default meta description
const defaultDescription = 'AI-powered CRM and marketing automation platform';

interface MetadataUpdaterProps {
  baseTitle?: string;
  separator?: string;
}

export function MetadataUpdater({
  baseTitle = 'Unite-Hub',
  separator = ' | ',
}: MetadataUpdaterProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
return;
}

    // Find matching route title
    let pageTitle = '';

    // Check exact match first
    if (routeTitles[pathname]) {
      pageTitle = routeTitles[pathname];
    } else {
      // Check for partial matches (for nested routes)
      const segments = pathname.split('/').filter(Boolean);
      for (let i = segments.length; i > 0; i--) {
        const partialPath = '/' + segments.slice(0, i).join('/');
        if (routeTitles[partialPath]) {
          pageTitle = routeTitles[partialPath];
          break;
        }
      }

      // Fallback: generate from last segment
      if (!pageTitle && segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // Skip UUIDs
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(lastSegment);
        if (!isUuid) {
          pageTitle = lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
    }

    // Update document title
    document.title = pageTitle ? `${pageTitle}${separator}${baseTitle}` : baseTitle;

    // Update meta description with fallback
    const description = pageTitle
      ? `${pageTitle} - ${defaultDescription}`
      : defaultDescription;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MetadataUpdater]', { pathname, pageTitle, description });
    }

    // Update OG tags
    updateMetaTag('og:title', pageTitle ? `${pageTitle}${separator}${baseTitle}` : baseTitle);
    updateMetaTag('og:description', description);
    updateMetaTag('og:type', 'website');

    // Update Twitter tags
    updateMetaTag('twitter:title', pageTitle ? `${pageTitle}${separator}${baseTitle}` : baseTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:card', 'summary');
  }, [pathname, baseTitle, separator]);

  return null;
}

function updateMetaTag(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) ||
    document.querySelector(`meta[name="${property}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    if (property.startsWith('og:')) {
      meta.setAttribute('property', property);
    } else {
      meta.setAttribute('name', property);
    }
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

export default MetadataUpdater;
