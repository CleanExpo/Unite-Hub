/**
 * Button Component
 *
 * Universal button component supporting multiple variants, sizes, and states.
 * Uses 100% design tokens - no hardcoded values.
 *
 * @example
 * // Primary button
 * <Button variant="primary" size="md">Click Me</Button>
 *
 * @example
 * // Secondary button with loading state
 * <Button variant="secondary" isLoading>Loading...</Button>
 */

import { forwardRef, ReactNode, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button @default 'primary' */
  variant?: 'primary' | 'secondary';

  /** Button size @default 'md' */
  size?: 'sm' | 'md';

  /** Whether the button is in a loading state @default false */
  isLoading?: boolean;

  /** Button children content */
  children?: ReactNode;

  /** Additional CSS classes */
  className?: string;

  /** Whether the button is disabled @default false */
  disabled?: boolean;

  /** Full width button (takes up all available width) @default false */
  fullWidth?: boolean;

  /** Icon to display inside button (left side) */
  icon?: ReactNode;

  /** Icon to display on the right side of button */
  iconRight?: ReactNode;
}

/**
 * Button Component
 *
 * All styling uses design tokens from Tailwind config.
 * Focus ring color: #ff6b35 (accent-500)
 * Transitions: All state changes use ease-out 0.28s
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      icon,
      iconRight,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const baseStyles = `
      inline-flex
      items-center
      justify-center
      gap-2
      font-semibold
      rounded-md
      transition-all
      duration-normal
      ease-out
      focus:outline-none
      focus:ring-2
      focus:ring-accent-500
      focus:ring-offset-2
      focus:ring-offset-bg-base
      disabled:opacity-50
      disabled:cursor-not-allowed
      active:scale-95
    `;

    const variantStyles = {
      primary: `
        bg-accent-500
        text-white
        hover:bg-accent-400
        active:bg-accent-600
        shadow-button-primary
        hover:shadow-button-primary
      `,
      secondary: `
        bg-bg-card
        text-text-primary
        border
        border-border-subtle
        hover:bg-bg-hover
        hover:border-border-medium
        active:bg-bg-input
      `,
    };

    const sizeStyles = {
      sm: 'px-5 py-2.5 text-sm min-h-10',
      md: 'px-7 py-3 text-md min-h-11',
    };

    const fullWidthStyle = fullWidth ? 'w-full' : '';

    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidthStyle}
          ${className}
        `.trim()}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          icon && <span className="flex items-center justify-center">{icon}</span>
        )}

        {children && <span>{children}</span>}

        {iconRight && !isLoading && (
          <span className="flex items-center justify-center">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
