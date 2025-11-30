/**
 * Card Component
 *
 * Base card component for displaying content with consistent styling.
 * Includes hover state, accent bar, and responsive support.
 *
 * @example
 * // Basic card
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 *
 * @example
 * // Card with accent bar
 * <Card accentBar>
 *   Card with top accent bar
 * </Card>
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card children content */
  children?: ReactNode;

  /** Whether to show accent bar at the top @default false */
  accentBar?: boolean;

  /** Whether to apply hover animation @default true */
  interactive?: boolean;

  /** Padding amount @default 'md' */
  padding?: 'sm' | 'md' | 'lg';

  /** Additional CSS classes */
  className?: string;

  /** Background color variant @default 'default' */
  variant?: 'default' | 'raised';
}

/**
 * Card Component
 *
 * Base card styling uses design tokens:
 * - Background: bg-card (#141517)
 * - Border: border-subtle (rgba(255, 255, 255, 0.08))
 * - Radius: rounded-lg (14px)
 * - Shadow: shadow-card
 *
 * Hover state (when interactive=true):
 * - Border: border-medium (rgba(255, 255, 255, 0.14))
 * - Transform: translateY(-4px)
 * - Smooth transition using ease-out 0.28s
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      accentBar = false,
      interactive = true,
      padding = 'md',
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      bg-bg-card
      border
      border-border-subtle
      rounded-lg
      shadow-card
      transition-all
      duration-normal
      ease-out
    `;

    const interactiveStyles = interactive
      ? `
        hover:border-border-medium
        hover:shadow-lg
        hover:-translate-y-1
        cursor-pointer
      `
      : '';

    const paddingStyles = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const variantStyles = {
      default: '',
      raised: 'bg-bg-raised',
    };

    return (
      <div
        ref={ref}
        className={`
          relative
          ${baseStyles}
          ${interactiveStyles}
          ${paddingStyles[padding]}
          ${variantStyles[variant]}
          ${className}
        `.trim()}
        {...props}
      >
        {/* Accent bar at top */}
        {accentBar && (
          <div
            className="
              absolute
              top-0
              left-0
              right-0
              h-1
              bg-accent-500
              rounded-t-lg
            "
          />
        )}

        {/* Content */}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader Component
 * Container for card header content (title, description, actions)
 */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle Component
 * Title text for the card
 */
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription Component
 * Subtitle/description text for the card
 */
export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-text-secondary ${className}`}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

/**
 * CardContent Component
 * Main content area of the card
 */
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

/**
 * CardFooter Component
 * Footer area for card actions
 */
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center p-6 pt-0 ${className}`}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
