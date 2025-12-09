'use client';

/**
 * Breadcrumbs Component
 * Global UX Shell - Phase 15 Week 5-6
 *
 * Production-polished breadcrumbs with:
 * - Improved title-case fallbacks
 * - Better UUID handling
 * - Smooth transitions
 * - ARIA navigation
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route label mapping - comprehensive labels for all routes
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
  edit: 'Edit',
  create: 'Create',
  staff: 'Staff Portal',
  client: 'Client Portal',
  projects: 'Projects',
  tasks: 'Tasks',
  reports: 'Reports',
  analytics: 'Analytics',
  'scope-review': 'Scope Review',
  proposals: 'Proposals',
  vault: 'Vault',
  ideas: 'Ideas',
  'time-tracker': 'Time Tracker',
};

// Helper function to convert kebab-case to Title Case
function toTitleCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname);

  if (breadcrumbs.length === 0) {
return null;
}

  // Truncate middle items if more than 3 segments
  const shouldTruncate = breadcrumbs.length > 3;
  const displayBreadcrumbs = shouldTruncate
    ? [breadcrumbs[0], { label: '...', href: undefined }, ...breadcrumbs.slice(-2)]
    : breadcrumbs;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('animate-in fade-in slide-in-from-left-2 duration-200', className)}
    >
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center p-1 -m-1 rounded hover:text-foreground hover:bg-muted transition-all duration-150"
            aria-label="Home"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </Link>
        </li>

        {displayBreadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5 animate-in fade-in duration-150" style={{ animationDelay: `${index * 50}ms` }}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
            {item.label === '...' ? (
              <span
                className="px-1.5 py-0.5 text-muted-foreground cursor-default"
                title={`${breadcrumbs.length - 3} more items`}
              >
                ...
              </span>
            ) : item.href && index < displayBreadcrumbs.length - 1 ? (
              <Link
                href={item.href}
                className="px-1.5 py-0.5 -mx-1.5 rounded hover:text-foreground hover:bg-muted transition-all duration-150 truncate max-w-[150px]"
                title={item.label}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-foreground font-medium truncate max-w-[200px]"
                aria-current="page"
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string | null): BreadcrumbItem[] {
  if (!pathname) {
return [];
}

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip 'dashboard', 'staff', 'client' as first segment (we show home icon)
    if (i === 0 && ['dashboard', 'staff', 'client'].includes(segment)) {
      continue;
    }

    // Check if segment is a UUID - show contextual label
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

    // Check if segment looks like a short ID (e.g., "abc123")
    const isShortId = /^[a-z0-9]{6,}$/i.test(segment) && !routeLabels[segment];

    let label: string;
    if (isUuid || isShortId) {
      // Use contextual label based on previous segment
      const prevSegment = segments[i - 1];
      if (prevSegment === 'contacts') {
        label = 'Contact Details';
      } else if (prevSegment === 'projects') {
        label = 'Project Details';
      } else if (prevSegment === 'campaigns') {
        label = 'Campaign Details';
      } else if (prevSegment === 'proposals') {
        label = 'Proposal Details';
      } else {
        label = 'Details';
      }
    } else {
      // Use mapped label or generate title case
      label = routeLabels[segment] || toTitleCase(segment);
    }

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

export default Breadcrumbs;
