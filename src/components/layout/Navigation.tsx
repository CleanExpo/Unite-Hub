/**
 * Navigation Component
 *
 * Scrollable header with blur background effect and smooth animations.
 * Responsive navigation with mobile menu support.
 *
 * @example
 * <Navigation
 *   logo={<LogoIcon />}
 *   items={[
 *     { label: "Features", href: "#features" },
 *     { label: "Pricing", href: "#pricing" },
 *     { label: "Docs", href: "/docs" }
 *   ]}
 *   cta={{ label: "Get Started", href: "/signup" }}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes, useState } from 'react';

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  icon?: ReactNode;
}

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  /** Logo component or node */
  logo?: ReactNode;

  /** Navigation items */
  items: NavItem[];

  /** Primary CTA button */
  cta?: {
    label: string;
    href: string;
  };

  /** Secondary CTA button */
  secondaryCTA?: {
    label: string;
    href: string;
  };

  /** Sticky position @default true */
  sticky?: boolean;

  /** Blur background effect @default true */
  blur?: boolean;

  /** Show border bottom @default false */
  border?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Navigation Component
 *
 * Uses design tokens:
 * - Background: bg-base with opacity, backdrop-blur effect
 * - Border: border-border-subtle
 * - Text: text-text-primary, text-text-secondary
 * - Links: hover:text-accent-500, smooth transitions
 * - CTA: Button style (primary variant)
 */
export const Navigation = forwardRef<HTMLElement, NavigationProps>(
  (
    {
      logo,
      items,
      cta,
      secondaryCTA,
      sticky = true,
      blur = true,
      border = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
      <nav
        ref={ref}
        className={`
          w-full
          ${sticky ? 'sticky top-0 z-40' : 'relative'}
          transition-all duration-normal ease-out
          ${className}
        `.trim()}
        {...props}
      >
        {/* Blur Background */}
        <div
          className={`
            absolute inset-0
            bg-bg-base
            ${blur ? 'backdrop-blur-md bg-opacity-80' : 'bg-opacity-100'}
            ${border ? 'border-b border-border-subtle' : ''}
            -z-10
          `}
        />

        {/* Nav Container */}
        <div className="relative px-6 md:px-8 lg:px-10 py-4 md:py-5">
          <div className="flex items-center justify-between gap-8 max-w-7xl mx-auto">
            {/* Logo */}
            {logo && (
              <div
                className={`
                  flex-shrink-0
                  flex items-center
                  text-accent-500
                  font-bold
                  text-xl
                `}
              >
                {logo}
              </div>
            )}

            {/* Desktop Menu */}
            <div
              className={`
                hidden md:flex
                items-center gap-1
                flex-1
              `}
            >
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className={`
                    px-4 py-2
                    text-sm font-medium
                    text-text-primary
                    hover:text-accent-500
                    transition-colors duration-fast ease-out
                    rounded-md
                    hover:bg-bg-hover
                    flex items-center gap-2
                  `}
                >
                  {item.icon && <span className="text-sm">{item.icon}</span>}
                  {item.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {secondaryCTA && (
                <a
                  href={secondaryCTA.href}
                  className={`
                    px-5 py-2.5
                    text-sm font-semibold
                    text-text-primary
                    bg-transparent
                    border border-border-subtle
                    rounded-md
                    hover:bg-bg-hover
                    hover:border-border-medium
                    transition-all duration-normal ease-out
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                  `}
                >
                  {secondaryCTA.label}
                </a>
              )}

              {cta && (
                <a
                  href={cta.href}
                  className={`
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
                  {cta.label}
                </a>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`
                md:hidden
                flex-shrink-0
                w-10 h-10
                flex items-center justify-center
                text-text-primary
                hover:text-accent-500
                transition-colors duration-fast ease-out
                focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                rounded-md
              `}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {/* Hamburger Icon */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              className={`
                md:hidden
                absolute top-full left-0 right-0
                bg-bg-card
                border-b border-border-subtle
                backdrop-blur-md
                animate-in fade-in slide-in-from-top-2 duration-200
              `}
            >
              <div className="flex flex-col gap-1 p-4">
                {/* Mobile Menu Items */}
                {items.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={`
                      px-4 py-3
                      text-sm font-medium
                      text-text-primary
                      hover:text-accent-500
                      hover:bg-bg-hover
                      rounded-md
                      transition-colors duration-fast ease-out
                      flex items-center gap-2
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <span className="text-sm">{item.icon}</span>}
                    {item.label}
                  </a>
                ))}

                {/* Mobile CTA Buttons */}
                <div className="flex flex-col gap-2 pt-4 border-t border-border-subtle mt-4">
                  {secondaryCTA && (
                    <a
                      href={secondaryCTA.href}
                      className={`
                        w-full
                        px-4 py-2.5
                        text-sm font-semibold text-center
                        text-text-primary
                        bg-transparent
                        border border-border-subtle
                        rounded-md
                        hover:bg-bg-hover
                        transition-all duration-normal ease-out
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {secondaryCTA.label}
                    </a>
                  )}

                  {cta && (
                    <a
                      href={cta.href}
                      className={`
                        w-full
                        px-4 py-2.5
                        text-sm font-semibold text-center
                        text-white
                        bg-accent-500
                        rounded-md
                        hover:bg-accent-400
                        transition-all duration-normal ease-out
                        shadow-button-primary
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {cta.label}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }
);

Navigation.displayName = 'Navigation';

export default Navigation;
