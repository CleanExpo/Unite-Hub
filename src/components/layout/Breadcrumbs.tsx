'use client';

/**
 * Breadcrumbs Component
 * Global UX Shell - Phase 15 Week 3-4
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route label mapping
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  overview: 'Overview',
  contacts: 'Contacts',
  campaigns: 'Campaigns',
  emails: 'Emails',
  sequences: 'Sequences',
  content: 'Content',
  templates: 'Templates',
  calendar: 'Calendar',
  settings: 'Settings',
  profile: 'Profile',
  billing: 'Billing',
  'ai-tools': 'AI Tools',
  'marketing-copy': 'Marketing Copy',
  'code-generator': 'Code Generator',
  team: 'Team',
  workspaces: 'Workspaces',
  integrations: 'Integrations',
  new: 'New',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4" />
            {item.href && index < breadcrumbs.length - 1 ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string | null): BreadcrumbItem[] {
  if (!pathname) return [];

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip 'dashboard' as we show home icon
    if (segment === 'dashboard' && i === 0) continue;

    // Check if segment is a UUID (skip it or show "Details")
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

    const label = isUuid
      ? 'Details'
      : routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

export default Breadcrumbs;
