/**
 * BenefitsGrid Component
 *
 * 2x2 grid display of benefit cards for landing pages.
 * Combines SectionHeader with responsive Card grid.
 *
 * @example
 * <BenefitsGrid
 *   tag="Why Choose Synthex"
 *   title="Built for Modern Businesses"
 *   description="Everything you need to grow revenue and manage customers."
 *   benefits={[
 *     {
 *       title: "AI-Powered Automation",
 *       description: "Automate repetitive tasks and focus on growth.",
 *       icon: "Zap"
 *     },
 *     // ... more benefits
 *   ]}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface BenefitItem {
  title: string;
  description: string;
  icon?: ReactNode;
  accentBar?: boolean;
}

export interface BenefitsGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Small uppercase tag above title */
  tag?: string;

  /** Section title */
  title: string;

  /** Section description */
  description?: string;

  /** Array of benefit items */
  benefits: BenefitItem[];

  /** Number of columns @default 2 */
  columns?: 2 | 3 | 4;

  /** Text alignment @default 'center' */
  align?: 'left' | 'center';

  /** Additional CSS classes */
  className?: string;
}

/**
 * BenefitsGrid Component
 *
 * Uses design tokens:
 * - Header: SectionHeader pattern (tag, title, description)
 * - Cards: bg-bg-card, border-border-subtle, hover effects
 * - Text: font-body, text-text-primary, text-text-secondary
 * - Icons: Customizable via ReactNode
 */
export const BenefitsGrid = forwardRef<HTMLDivElement, BenefitsGridProps>(
  (
    {
      tag,
      title,
      description,
      benefits,
      columns = 2,
      align = 'center',
      className = '',
      ...props
    },
    ref
  ) => {
    const columnStyles = {
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    const alignStyles = align === 'center' ? 'text-center' : 'text-left';
    const marginAuto = align === 'center' ? 'mx-auto' : '';

    return (
      <div
        ref={ref}
        className={`
          w-full
          py-16 md:py-24 lg:py-32
          ${className}
        `.trim()}
        {...props}
      >
        {/* Header Section */}
        <div className={`mb-12 md:mb-16 ${marginAuto} ${alignStyles} max-w-2xl`}>
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
                mb-4
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
              text-4xl md:text-5xl lg:text-6xl
              leading-tight
              mb-4
            `}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              className={`
                text-text-secondary
                font-body
                leading-relaxed
                text-lg
              `}
            >
              {description}
            </p>
          )}
        </div>

        {/* Benefits Grid */}
        <div
          className={`
            grid
            ${columnStyles[columns]}
            gap-6 md:gap-8 lg:gap-10
          `}
        >
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`
                relative
                bg-bg-card
                border border-border-subtle
                rounded-lg
                p-6 md:p-8
                transition-all duration-normal ease-out
                hover:border-border-medium
                hover:shadow-lg
                hover:-translate-y-1
              `}
            >
              {/* Accent Bar */}
              {benefit.accentBar !== false && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent-500 rounded-t-lg" />
              )}

              {/* Icon */}
              {benefit.icon && (
                <div
                  className={`
                    mb-4
                    text-accent-500
                    flex items-center
                  `}
                >
                  {benefit.icon}
                </div>
              )}

              {/* Title */}
              <h3
                className={`
                  text-xl md:text-2xl
                  font-bold
                  text-text-primary
                  mb-2
                  ${align === 'left' ? 'text-left' : 'text-left'}
                `}
              >
                {benefit.title}
              </h3>

              {/* Description */}
              <p
                className={`
                  text-text-secondary
                  font-body
                  leading-relaxed
                  text-sm md:text-base
                  ${align === 'left' ? 'text-left' : 'text-left'}
                `}
              >
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

BenefitsGrid.displayName = 'BenefitsGrid';

export default BenefitsGrid;
