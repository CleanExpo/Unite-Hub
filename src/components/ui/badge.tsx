/**
 * Badge Component
 *
 * Small semantic indicator component for status, tags, and labels.
 * Supports 4 semantic variants.
 *
 * @example
 * // Success badge
 * <Badge variant="success">Active</Badge>
 *
 * @example
 * // Warning badge
 * <Badge variant="warning">Pending</Badge>
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge content */
  children?: ReactNode;

  /** Semantic color variant @default 'neutral' */
  variant?: 'success' | 'warning' | 'accent' | 'neutral' | 'default' | 'secondary' | 'outline' | 'destructive' | 'danger' | 'info' | 'error';

  /** Size variant @default 'md' */
  size?: 'sm' | 'md';

  /** Additional CSS classes */
  className?: string;

  /** Make badge dismissible with X button @default false */
  dismissible?: boolean;

  /** Callback when badge is dismissed */
  onDismiss?: () => void;
}

/**
 * Badge Component
 *
 * Uses design tokens:
 * - Success: bg-success-50, text-success-500
 * - Warning: bg-warning-50, text-warning-500
 * - Accent: bg-accent-100, text-accent-500
 * - Neutral: bg-bg-hover, text-text-secondary
 *
 * All badges use:
 * - Border radius: rounded-full (100px)
 * - Font size: text-sm
 * - Font weight: font-semibold
 * - Padding: 6px 12px
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'neutral',
      size = 'md',
      className = '',
      dismissible = false,
      onDismiss,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex
      items-center
      gap-2
      rounded-full
      font-semibold
      transition-all
      duration-fast
      ease-out
    `;

    const variantStyles: Record<string, string> = {
      success: 'bg-success-50 text-success-500',
      warning: 'bg-warning-50 text-warning-500',
      accent: 'bg-accent-100 text-accent-500',
      neutral: 'bg-bg-hover text-text-secondary',
      default: 'bg-bg-hover text-text-secondary',
      secondary: 'bg-bg-hover text-text-secondary dark:text-text-secondary',
      outline: 'bg-transparent border border-border-subtle text-text-secondary',
      destructive: 'bg-error-100 dark:bg-error-900/30 text-error-500 dark:text-error-400',
      danger: 'bg-error-100 dark:bg-error-900/30 text-error-500 dark:text-error-400',
      info: 'bg-info-100 dark:bg-info-900/30 text-info-500 dark:text-info-400',
      error: 'bg-error-100 dark:bg-error-900/30 text-error-500 dark:text-error-400',
    };

    const sizeStyles = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
    };

    return (
      <span
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `.trim()}
        {...props}
      >
        {children}

        {dismissible && (
          <button
            onClick={onDismiss}
            className="
              ml-1
              inline-flex
              items-center
              justify-center
              rounded-full
              w-4
              h-4
              hover:opacity-70
              transition-opacity
              duration-fast
            "
            aria-label="Dismiss badge"
          >
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
