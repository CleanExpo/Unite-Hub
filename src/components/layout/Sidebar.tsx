/**
 * Sidebar Component
 *
 * Collapsible side navigation for dashboard layouts.
 * Responsive with mobile overlay and smooth animations.
 *
 * @example
 * <Sidebar
 *   items={[
 *     { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
 *     { label: "Contacts", href: "/dashboard/contacts", icon: <ContactsIcon /> },
 *     { label: "Campaigns", href: "/dashboard/campaigns", icon: <CampaignsIcon /> }
 *   ]}
 *   currentPath="/dashboard/contacts"
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes, useState } from 'react';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string;
  external?: boolean;
  divider?: boolean;
}

export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  /** Logo/branding component */
  logo?: ReactNode;

  /** Sidebar menu items */
  items: SidebarItem[];

  /** Current active path for highlighting */
  currentPath?: string;

  /** User profile section */
  footer?: ReactNode;

  /** Width of expanded sidebar @default '280px' */
  expandedWidth?: string;

  /** Collapsible @default true */
  collapsible?: boolean;

  /** Show toggle button @default true */
  showToggle?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Sidebar Component
 *
 * Uses design tokens:
 * - Background: bg-bg-card, border-border-subtle
 * - Active item: bg-bg-hover, text-accent-500, border-l-accent-500
 * - Text: text-text-primary, text-text-secondary
 * - Hover: hover:bg-bg-hover, transition-colors
 */
export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      logo,
      items,
      currentPath,
      footer,
      expandedWidth = '280px',
      collapsible = true,
      showToggle = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => {
      return currentPath === href || currentPath?.startsWith(href + '/');
    };

    return (
      <>
        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          ref={ref}
          className={`
            fixed lg:static
            top-0 left-0 bottom-0
            h-screen lg:h-auto
            bg-bg-card
            border-r border-border-subtle
            overflow-y-auto
            transition-all duration-normal ease-out
            z-40
            ${isCollapsed && collapsible ? 'w-24' : `w-full lg:w-[${expandedWidth}]`}
            ${!mobileOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
            ${className}
          `.trim()}
          {...props}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div
              className={`
                flex items-center justify-between gap-3
                px-4 md:px-6
                py-4 md:py-5
                border-b border-border-subtle
                flex-shrink-0
              `}
            >
              {/* Logo */}
              {logo && (
                <div
                  className={`
                    flex items-center gap-3
                    flex-1
                    overflow-hidden
                    ${isCollapsed && collapsible ? 'justify-center' : ''}
                  `}
                >
                  <div className="flex-shrink-0 text-accent-500 font-bold text-lg">
                    {logo}
                  </div>
                  {(!isCollapsed || !collapsible) && (
                    <span className="text-sm font-bold text-text-primary truncate hidden sm:inline">
                      Synthex
                    </span>
                  )}
                </div>
              )}

              {/* Close Button (Mobile) */}
              <button
                className="lg:hidden flex-shrink-0 p-2 text-text-primary hover:text-accent-500 rounded-md transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Collapse Toggle (Desktop) */}
              {collapsible && showToggle && (
                <button
                  className="hidden lg:flex flex-shrink-0 p-2 text-text-primary hover:text-accent-500 rounded-md transition-colors"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <svg
                    className="w-5 h-5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isCollapsed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    )}
                  </svg>
                </button>
              )}
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 md:px-4">
              <div className="space-y-1">
                {items.map((item, index) => (
                  <div key={index}>
                    {/* Divider */}
                    {item.divider && (
                      <div className="my-4 border-t border-border-subtle" />
                    )}

                    {/* Menu Item */}
                    {!item.divider && (
                      <a
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className={`
                          flex items-center gap-3
                          px-3 py-2.5 md:px-4
                          rounded-md
                          text-sm font-medium
                          transition-all duration-fast ease-out
                          border-l-4 border-transparent
                          group
                          ${isActive(item.href)
                            ? 'bg-bg-hover text-accent-500 border-l-accent-500'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                          }
                        `}
                        onClick={() => {
                          setMobileOpen(false);
                        }}
                      >
                        {/* Icon */}
                        {item.icon && (
                          <span
                            className={`
                              flex-shrink-0 text-base
                              ${isActive(item.href) ? 'text-accent-500' : 'text-text-secondary group-hover:text-text-primary'}
                            `}
                          >
                            {item.icon}
                          </span>
                        )}

                        {/* Label */}
                        {(!isCollapsed || !collapsible) && (
                          <span className="flex-1 truncate">
                            {item.label}
                          </span>
                        )}

                        {/* Badge */}
                        {item.badge && (!isCollapsed || !collapsible) && (
                          <span
                            className={`
                              flex-shrink-0
                              px-2 py-0.5
                              rounded-full text-xs font-bold
                              bg-accent-500 text-white
                            `}
                          >
                            {item.badge}
                          </span>
                        )}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Footer */}
            {footer && (
              <div
                className={`
                  flex-shrink-0
                  px-3 md:px-4 py-4
                  border-t border-border-subtle
                  ${isCollapsed && collapsible ? 'flex justify-center' : ''}
                `}
              >
                {footer}
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Menu Toggle Button (when sidebar is closed) */}
        {!mobileOpen && (
          <button
            className="fixed bottom-6 right-6 lg:hidden z-30 p-3 bg-accent-500 text-white rounded-full shadow-lg hover:bg-accent-400 transition-all"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </>
    );
  }
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;
