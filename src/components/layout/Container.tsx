/**
 * Container Component
 *
 * Max-width wrapper with semantic padding and responsive behavior.
 * Standard layout wrapper for page content.
 *
 * @example
 * <Container>
 *   <h1>Page title</h1>
 *   <p>Content goes here...</p>
 * </Container>
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Container content */
  children?: ReactNode;

  /** Maximum width constraint @default 'lg' */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /** Horizontal padding @default 'md' */
  padding?: 'sm' | 'md' | 'lg';

  /** Additional CSS classes */
  className?: string;

  /** As semantic element @default 'div' */
  as?: 'div' | 'section' | 'article' | 'main';
}

/**
 * Container Component
 *
 * Uses design tokens:
 * - Max width: container (1140px)
 * - Padding: From design system spacing scale
 * - Responsive: Auto margins for centering
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      children,
      size = 'lg',
      padding = 'md',
      className = '',
      as: Element = 'div' as React.ElementType,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'max-w-xs',
      md: 'max-w-md',
      lg: 'max-w-container',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };

    const paddingStyles = {
      sm: 'px-4 md:px-6',
      md: 'px-6 md:px-8',
      lg: 'px-8 md:px-10',
    };

    return (
      <Element
        ref={ref}
        className={`
          w-full
          mx-auto
          ${sizeStyles[size]}
          ${paddingStyles[padding]}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Container.displayName = 'Container';

export default Container;
