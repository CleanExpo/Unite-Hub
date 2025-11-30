/**
 * Icon Component
 *
 * SVG icon wrapper with consistent styling and sizing.
 * Ensures consistent stroke width and sizing across all icons.
 *
 * @example
 * // Basic icon
 * <Icon>
 *   <svg viewBox="0 0 24 24">...</svg>
 * </Icon>
 */

import { forwardRef, ReactNode, SVGAttributes } from 'react';

export interface IconProps extends SVGAttributes<SVGElement> {
  /** Icon SVG content */
  children?: ReactNode;

  /** Icon size @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /** Icon color (inherits from text color by default) */
  color?: string;

  /** Stroke width for outline icons @default 1.5 */
  strokeWidth?: number;

  /** Additional CSS classes */
  className?: string;

  /** Whether icon is decorative (non-semantic) @default true */
  decorative?: boolean;

  /** ARIA label for non-decorative icons */
  ariaLabel?: string;
}

/**
 * Icon Component
 *
 * Wrapper for SVG icons with consistent styling.
 * All icons use:
 * - Stroke width: 1.5 (design system standard)
 * - Fill: none (outline style)
 * - Sizing: xs-xl variants
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      children,
      size = 'md',
      color = 'currentColor',
      strokeWidth = 1.5,
      className = '',
      decorative = true,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-10 h-10',
    };

    return (
      <svg
        ref={ref}
        className={`
          ${sizeStyles[size]}
          flex-shrink-0
          ${className}
        `.trim()}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={decorative}
        aria-label={!decorative ? ariaLabel : undefined}
        {...props}
      >
        {children}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

export default Icon;
