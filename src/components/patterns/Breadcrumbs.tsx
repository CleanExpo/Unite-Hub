/**
 * Breadcrumbs Component
 *
 * Navigation breadcrumbs for showing page hierarchy and enabling navigation.
 * Responsive with automatic truncation on mobile.
 *
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Settings' },
 *   ]}
 * />
 *
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/', icon: <HomeIcon /> },
 *     { label: 'Contacts', href: '/contacts' },
 *     { label: 'John Doe' },
 *   ]}
 *   separator="/"
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import Link from './Link';

export interface BreadcrumbItem {
  /** Label text or node */
  label: string | ReactNode;

  /** Navigation href (optional - if not provided, item is just text) */
  href?: string;

  /** Optional icon */
  icon?: ReactNode;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];

  /** Separator between items (default: '/') */
  separator?: ReactNode;

  /** Show icons in breadcrumbs */
  showIcons?: boolean;

  /** Custom CSS class */
  className?: string;
}

/**
 * Breadcrumbs Component
 *
 * Uses design tokens:
 * - Text: text-text-secondary
 * - Links: text-accent-500, hover:text-accent-400
 * - Active: text-text-primary, font-medium
 * - Separator: text-text-secondary
 * - Spacing: gap-2
 */
export const Breadcrumbs = forwardRef<HTMLDivElement, BreadcrumbsProps>(
  (
    {
      items,
      separator = '/',
      showIcons = true,
      className = '',
      ...props
    },
    ref
  ) => {
    if (!items || items.length === 0) {
      return null;
    }

    return (
      <nav
        ref={ref}
        className={`flex items-center gap-2 overflow-x-auto ${className}`}
        aria-label="Breadcrumbs"
        {...props}
      >
        <ol className="flex items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const content = (
              <span className="flex items-center gap-1 whitespace-nowrap">
                {showIcons && item.icon && (
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                )}
                <span>{item.label}</span>
              </span>
            );

            return (
              <li key={index} className="flex items-center gap-2">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-sm text-accent-500 hover:text-accent-400 transition-colors duration-fast flex items-center gap-1"
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    className={`text-sm ${
                      isLast
                        ? 'text-text-primary font-medium'
                        : 'text-text-secondary'
                    }`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {content}
                  </span>
                )}

                {/* Separator */}
                {!isLast && (
                  <span
                    className="text-text-secondary text-sm flex-shrink-0"
                    aria-hidden="true"
                  >
                    {separator}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;
