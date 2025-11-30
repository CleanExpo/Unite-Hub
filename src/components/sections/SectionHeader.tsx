/**
 * Section Header Component
 *
 * Common pattern for landing page sections.
 * Displays tag, title, and optional description.
 *
 * @example
 * <SectionHeader
 *   tag="Your Advantage"
 *   title="Everything you need to grow locally."
 *   description="Powerful marketing tools designed to help local businesses..."
 *   align="center"
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Small uppercase tag above title */
  tag?: string;

  /** Main section title */
  title: string;

  /** Optional description text */
  description?: string;

  /** Text alignment @default 'left' */
  align?: 'left' | 'center' | 'right';

  /** Children content instead of description */
  children?: ReactNode;

  /** Additional CSS classes */
  className?: string;

  /** Text size @default 'md' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Section Header Component
 *
 * Uses design tokens:
 * - Tag: text-accent-500, font-bold, uppercase, letter-spacing-widest
 * - Title: font-display, font-bold, letter-spacing-tight
 * - Description: text-text-secondary, font-body
 */
export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    {
      tag,
      title,
      description,
      align = 'left',
      children,
      className = '',
      size = 'md',
      ...props
    },
    ref
  ) => {
    const alignStyles = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    const titleSizes = {
      sm: 'text-4xl md:text-5xl',
      md: 'text-5xl md:text-6xl',
      lg: 'text-6xl md:text-7xl',
    };

    const descriptionSizes = {
      sm: 'text-base md:text-lg',
      md: 'text-lg md:text-xl',
      lg: 'text-xl md:text-2xl',
    };

    const marginAuto = align === 'center' ? 'mx-auto' : '';

    return (
      <div
        ref={ref}
        className={`
          flex
          flex-col
          gap-4
          ${alignStyles[align]}
          ${className}
        `.trim()}
        {...props}
      >
        {/* Tag */}
        {tag && (
          <span
            className={`
              inline-block
              text-xs
              font-extrabold
              text-accent-500
              uppercase
              tracking-widest
              ${marginAuto}
            `}
          >
            {tag}
          </span>
        )}

        {/* Title */}
        <h2
          className={`
            font-display
            font-bold
            text-text-primary
            letter-spacing-tight
            ${titleSizes[size]}
            ${marginAuto}
          `}
        >
          {title}
        </h2>

        {/* Description or children */}
        {description ? (
          <p
            className={`
              text-text-secondary
              font-body
              leading-relaxed
              ${descriptionSizes[size]}
              max-w-2xl
              ${marginAuto}
            `}
          >
            {description}
          </p>
        ) : null}

        {/* Children slot */}
        {children}
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

export default SectionHeader;
