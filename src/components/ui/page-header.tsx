'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader Component
 *
 * Consistent page header with title, description, breadcrumbs, and actions.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm">
          <Link
            href="/dashboard"
            className="flex items-center text-text-muted hover:text-text-secondary transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>

          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-text-muted" />
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={item.href}
                  className="ml-1 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="ml-1 text-text-primary font-medium">
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-text-muted text-sm sm:text-base">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PageHeaderSkeleton
 *
 * Loading state for PageHeader
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-1">
        <div className="h-4 w-4 rounded bg-bg-hover animate-pulse" />
        <div className="h-4 w-4 rounded bg-bg-hover animate-pulse" />
        <div className="h-4 w-20 rounded bg-bg-hover animate-pulse" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-bg-hover animate-pulse" />
          <div className="h-4 w-64 rounded bg-bg-hover animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded bg-bg-hover animate-pulse" />
      </div>
    </div>
  );
}

export default PageHeader;
