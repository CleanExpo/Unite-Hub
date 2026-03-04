/**
 * Breadcrumbs Component - Phase 2 Step 3
 *
 * Navigation breadcrumb trail for hierarchical navigation
 * Features:
 * - Auto-generated from URL path
 * - Manual override support
 * - Link support with custom labels
 * - Accessible (ARIA landmarks, keyboard navigation)
 * - Dark mode compatible
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbsProps {
  /**
   * Custom breadcrumb items (overrides auto-generated)
   */
  items?: BreadcrumbItem[];

  /**
   * Show home icon as first item
   * @default true
   */
  showHome?: boolean;

  /**
   * Home link href
   * @default '/'
   */
  homeHref?: string;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Convert URL segment to human-readable label
 */
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    items.push({
      label: formatSegment(segment),
      href: currentPath,
    });
  }

  return items;
}

export function Breadcrumbs({
  items: customItems,
  showHome = true,
  homeHref = '/',
  className = '',
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const items = customItems || generateBreadcrumbs(pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-2">
        {/* Home link */}
        {showHome && (
          <li>
            <Link
              href={homeHref}
              className="text-gray-400 hover:text-gray-100 transition-colors"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
        )}

        {/* Breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className="flex items-center space-x-2">
              {/* Separator */}
              {(showHome || index > 0) && (
                <ChevronRight className="h-4 w-4 text-gray-600" aria-hidden="true" />
              )}

              {/* Breadcrumb link or text */}
              {isLast ? (
                <span
                  className="text-gray-100 font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-400 hover:text-gray-100 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Preset: Staff breadcrumbs with staff home link
 */
export function StaffBreadcrumbs({
  items,
  className,
}: Omit<BreadcrumbsProps, 'showHome' | 'homeHref'>) {
  return (
    <Breadcrumbs
      items={items}
      showHome={true}
      homeHref="/staff"
      className={className}
    />
  );
}

/**
 * Preset: Client breadcrumbs with client home link
 */
export function ClientBreadcrumbs({
  items,
  className,
}: Omit<BreadcrumbsProps, 'showHome' | 'homeHref'>) {
  return (
    <Breadcrumbs
      items={items}
      showHome={true}
      homeHref="/client"
      className={className}
    />
  );
}
