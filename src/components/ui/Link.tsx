/**
 * Link Component
 *
 * Enhanced link component with smooth underline animation and
 * proper focus ring support.
 *
 * @example
 * // Basic link
 * <Link href="/">Home</Link>
 *
 * @example
 * // External link
 * <Link href="https://example.com" external>
 *   External Site
 * </Link>
 */

import { forwardRef, AnchorHTMLAttributes, ReactNode } from 'react';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Link destination */
  href: string;

  /** Link text content */
  children?: ReactNode;

  /** Whether this is an external link @default false */
  external?: boolean;

  /** Open external links in new tab @default true */
  newTab?: boolean;

  /** Link variant @default 'default' */
  variant?: 'default' | 'primary' | 'secondary';

  /** Size variant @default 'md' */
  size?: 'sm' | 'md';

  /** Additional CSS classes */
  className?: string;

  /** Underline animation @default true */
  underline?: boolean;
}

/**
 * Link Component
 *
 * Uses design tokens:
 * - Default: text-text-primary, underline animation
 * - Primary: text-accent-500
 * - Secondary: text-text-secondary
 *
 * Focus ring: focus:ring-accent-500
 * Smooth transition using ease-out 0.28s
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      children,
      external = false,
      newTab = external,
      variant = 'default',
      size = 'md',
      className = '',
      underline = true,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex
      items-center
      gap-1
      font-medium
      transition-all
      duration-normal
      ease-out
      focus:outline-none
      focus:ring-2
      focus:ring-accent-500
      focus:ring-offset-2
      focus:ring-offset-bg-base
      rounded-sm
    `;

    const variantStyles = {
      default: 'text-text-primary hover:text-accent-500',
      primary: 'text-accent-500 hover:text-accent-400',
      secondary: 'text-text-secondary hover:text-text-primary',
    };

    const sizeStyles = {
      sm: 'text-sm',
      md: 'text-base',
    };

    const underlineStyles = underline
      ? `
        relative
        after:content-['']
        after:absolute
        after:bottom-0
        after:left-0
        after:w-0
        after:h-0.5
        after:bg-accent-500
        after:transition-all
        after:duration-normal
        after:ease-out
        hover:after:w-full
      `
      : '';

    return (
      <a
        ref={ref}
        href={href}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${underlineStyles}
          ${className}
        `.trim()}
        {...props}
      >
        {children}

        {/* External link icon */}
        {external && (
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6 6m0 0l-6 6m6-6H9"
            />
          </svg>
        )}
      </a>
    );
  }
);

Link.displayName = 'Link';

export default Link;
