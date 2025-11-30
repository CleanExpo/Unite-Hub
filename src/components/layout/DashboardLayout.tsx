/**
 * DashboardLayout Component
 *
 * Combines Navigation, Sidebar, and main content area.
 * Responsive layout with proper spacing and alignment.
 *
 * @example
 * <DashboardLayout
 *   navigationLogo={<LogoIcon />}
 *   navigationItems={[{ label: "Docs", href: "/docs" }]}
 *   sidebarLogo={<SynthexIcon />}
 *   sidebarItems={[
 *     { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
 *     { label: "Contacts", href: "/dashboard/contacts", icon: <ContactsIcon /> }
 *   ]}
 *   currentPath="/dashboard/contacts"
 * >
 *   <YourContentHere />
 * </DashboardLayout>
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface DashboardLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /** Navigation logo */
  navigationLogo?: ReactNode;

  /** Navigation menu items */
  navigationItems?: Array<{
    label: string;
    href: string;
    external?: boolean;
    icon?: ReactNode;
  }>;

  /** Navigation CTA button */
  navigationCTA?: {
    label: string;
    href: string;
  };

  /** Sidebar logo */
  sidebarLogo?: ReactNode;

  /** Sidebar menu items */
  sidebarItems?: Array<{
    label: string;
    href: string;
    icon?: ReactNode;
    badge?: string;
    divider?: boolean;
  }>;

  /** Current active path */
  currentPath?: string;

  /** Sidebar footer content */
  sidebarFooter?: ReactNode;

  /** Main content area */
  children?: ReactNode;

  /** Show sidebar @default true */
  showSidebar?: boolean;

  /** Show navigation @default true */
  showNavigation?: boolean;

  /** Sidebar collapsible @default true */
  sidebarCollapsible?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * DashboardLayout Component
 *
 * Structure:
 * - Navigation (top, sticky)
 * - Sidebar (left, collapsible)
 * - Main content (right, scrollable)
 *
 * Uses design tokens for spacing and colors throughout
 */
export const DashboardLayout = forwardRef<HTMLDivElement, DashboardLayoutProps>(
  (
    {
      navigationLogo,
      navigationItems = [],
      navigationCTA,
      sidebarLogo,
      sidebarItems = [],
      currentPath,
      sidebarFooter,
      children,
      showSidebar = true,
      showNavigation = true,
      sidebarCollapsible = true,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          w-full h-screen
          bg-bg-base
          flex flex-col
          ${className}
        `.trim()}
        {...props}
      >
        {/* Navigation */}
        {showNavigation && (
          <nav
            className={`
              sticky top-0 z-40
              w-full
              bg-bg-base
              border-b border-border-subtle
              backdrop-blur-md bg-opacity-80
            `}
          >
            <div className="px-6 md:px-8 lg:px-10 py-4 md:py-5 flex items-center justify-between gap-8 max-w-full">
              {/* Logo */}
              {navigationLogo && (
                <div className="flex-shrink-0 text-accent-500 font-bold text-xl">
                  {navigationLogo}
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Navigation CTA */}
              {navigationCTA && (
                <a
                  href={navigationCTA.href}
                  className={`
                    flex-shrink-0
                    px-6 py-2.5
                    text-sm font-semibold
                    text-white
                    bg-accent-500
                    rounded-md
                    hover:bg-accent-400
                    active:bg-accent-600
                    transition-all duration-normal ease-out
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                    shadow-button-primary
                  `}
                >
                  {navigationCTA.label}
                </a>
              )}
            </div>
          </nav>
        )}

        {/* Main Container */}
        <div
          className={`
            flex-1
            flex
            overflow-hidden
          `}
        >
          {/* Sidebar */}
          {showSidebar && (
            <aside
              className={`
                hidden lg:block
                w-64 xl:w-72
                bg-bg-card
                border-r border-border-subtle
                overflow-y-auto
                flex-shrink-0
              `}
            >
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                {sidebarLogo && (
                  <div
                    className={`
                      flex items-center gap-3
                      px-6 py-4 md:py-5
                      border-b border-border-subtle
                      flex-shrink-0
                    `}
                  >
                    <div className="text-accent-500 font-bold text-lg">
                      {sidebarLogo}
                    </div>
                  </div>
                )}

                {/* Sidebar Menu */}
                <nav className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-1">
                    {sidebarItems.map((item, index) => (
                      <div key={index}>
                        {/* Divider */}
                        {item.divider && (
                          <div className="my-4 border-t border-border-subtle" />
                        )}

                        {/* Menu Item */}
                        {!item.divider && (
                          <a
                            href={item.href}
                            className={`
                              flex items-center gap-3
                              px-4 py-2.5
                              rounded-md
                              text-sm font-medium
                              transition-all duration-fast ease-out
                              border-l-4 border-transparent
                              group
                              ${currentPath === item.href || currentPath?.startsWith(item.href + '/')
                                ? 'bg-bg-hover text-accent-500 border-l-accent-500'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                              }
                            `}
                          >
                            {/* Icon */}
                            {item.icon && (
                              <span
                                className={`
                                  flex-shrink-0 text-base
                                  ${currentPath === item.href || currentPath?.startsWith(item.href + '/')
                                    ? 'text-accent-500'
                                    : 'text-text-secondary group-hover:text-text-primary'
                                  }
                                `}
                              >
                                {item.icon}
                              </span>
                            )}

                            {/* Label */}
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>

                            {/* Badge */}
                            {item.badge && (
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

                {/* Sidebar Footer */}
                {sidebarFooter && (
                  <div className="flex-shrink-0 px-4 py-4 border-t border-border-subtle">
                    {sidebarFooter}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main
            className={`
              flex-1
              overflow-y-auto
              bg-bg-base
            `}
          >
            {children}
          </main>
        </div>
      </div>
    );
  }
);

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;
