 
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
import { Slot } from '@radix-ui/react-slot';

/**
 * Button variant styles - can be used with other components like AlertDialog
 */
export const buttonVariants = ({
  variant = 'primary',
  size = 'md',
}: {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link' | 'default' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
} = {}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-md
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' ');

  const variantStyles: Record<string, string> = {
    primary: 'bg-accent-500 text-white hover:bg-accent-400 shadow-sm',
    secondary: 'bg-bg-card text-text-primary border border-border-subtle hover:bg-bg-hover',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-border-subtle bg-transparent hover:bg-bg-hover text-text-primary',
    ghost: 'hover:bg-bg-hover text-text-primary',
    link: 'text-accent-500 underline-offset-4 hover:underline',
    default: 'bg-accent-500 text-white hover:bg-accent-400 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  const sizeStyles: Record<string, string> = {
    sm: 'h-11 px-3 text-sm',      // 44px minimum for accessibility
    md: 'h-11 px-4 py-2',         // 44px minimum for accessibility
    lg: 'h-12 px-8 text-lg',      // 48px for larger variant
    icon: 'h-11 w-11',            // 44px minimum for accessibility
  };

  return `${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md}`;
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button @default 'primary' */
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link' | 'default' | 'success';

  /** Button size @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'icon';

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

  /** When true, renders children as the element (for use with Link components) */
  asChild?: boolean;
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
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const Comp = asChild ? Slot : 'button';

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

    const variantStyles: Record<string, string> = {
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
      destructive: `
        bg-red-600
        text-white
        hover:bg-red-700
        active:bg-red-800
      `,
      outline: `
        border
        border-border-subtle
        bg-transparent
        hover:bg-bg-hover
        text-text-primary
      `,
      ghost: `
        hover:bg-bg-hover
        text-text-primary
      `,
      link: `
        text-accent-500
        underline-offset-4
        hover:underline
      `,
      default: `
        bg-accent-500
        text-white
        hover:bg-accent-400
        active:bg-accent-600
        shadow-button-primary
        hover:shadow-button-primary
      `,
      success: `
        bg-green-600
        text-white
        hover:bg-green-700
        active:bg-green-800
      `,
    };

    const sizeStyles: Record<string, string> = {
      sm: 'px-5 py-2.5 text-sm min-h-10',
      md: 'px-7 py-3 text-md min-h-11',
      lg: 'px-8 py-4 text-lg min-h-12',
      icon: 'h-10 w-10 p-0',
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

    // When using asChild, pass children directly without wrapping
    if (asChild) {
      return (
        <Comp
          ref={ref}
          disabled={isDisabled}
          aria-busy={isLoading}
          className={`
            ${baseStyles}
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${fullWidthStyle}
            ${className}
          `.trim()}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    // Normal button rendering with icons and loading states
    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidthStyle}
          ${className}
        `.trim()}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {!isLoading && icon && <span className="flex items-center justify-center">{icon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && iconRight && <span className="flex items-center justify-center">{iconRight}</span>}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export default Button;
