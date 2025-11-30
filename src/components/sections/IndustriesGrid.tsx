/**
 * IndustriesGrid Component
 *
 * 3x2 grid display of industry/vertical cards.
 * Shows which industries are supported with icons and descriptions.
 *
 * @example
 * <IndustriesGrid
 *   tag="Who We Serve"
 *   title="Trusted by Various Industries"
 *   description="Solutions tailored for your specific business needs"
 *   industries={[
 *     {
 *       title: "Real Estate",
 *       description: "Property agents and brokers",
 *       icon: "Building"
 *     },
 *     // ... more industries
 *   ]}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface IndustryItem {
  title: string;
  description: string;
  icon?: ReactNode;
  accentBar?: boolean;
}

export interface IndustriesGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Small uppercase tag above title */
  tag?: string;

  /** Section title */
  title: string;

  /** Section description */
  description?: string;

  /** Array of industry items */
  industries: IndustryItem[];

  /** Number of columns @default 3 */
  columns?: 2 | 3 | 4;

  /** Text alignment @default 'center' */
  align?: 'left' | 'center';

  /** Additional CSS classes */
  className?: string;
}

/**
 * IndustriesGrid Component
 *
 * Uses design tokens:
 * - Header: tag (accent-500), title (display font), description
 * - Cards: bg-bg-card, border-border-subtle, hover effects
 * - Text: font-body, text-text-primary, text-text-secondary
 * - Icons: Customizable via ReactNode
 */
export const IndustriesGrid = forwardRef<HTMLDivElement, IndustriesGridProps>(
  (
    {
      tag,
      title,
      description,
      industries,
      columns = 3,
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

        {/* Industries Grid */}
        <div
          className={`
            grid
            ${columnStyles[columns]}
            gap-6 md:gap-8 lg:gap-10
          `}
        >
          {industries.map((industry, index) => (
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
                group
              `}
            >
              {/* Accent Bar */}
              {industry.accentBar !== false && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent-500 rounded-t-lg" />
              )}

              {/* Icon Container */}
              {industry.icon && (
                <div
                  className={`
                    mb-4
                    text-accent-500
                    text-4xl
                    transition-transform duration-normal ease-out
                    group-hover:scale-110
                  `}
                >
                  {industry.icon}
                </div>
              )}

              {/* Title */}
              <h3
                className={`
                  text-xl md:text-2xl
                  font-bold
                  text-text-primary
                  mb-2
                  text-left
                `}
              >
                {industry.title}
              </h3>

              {/* Description */}
              <p
                className={`
                  text-text-secondary
                  font-body
                  leading-relaxed
                  text-sm md:text-base
                  text-left
                `}
              >
                {industry.description}
              </p>

              {/* Hover Indicator */}
              <div
                className={`
                  absolute
                  bottom-4 right-4
                  w-8 h-8
                  bg-accent-500
                  rounded-full
                  flex items-center justify-center
                  text-white
                  opacity-0 scale-0
                  transition-all duration-normal ease-out
                  group-hover:opacity-100 group-hover:scale-100
                  font-bold
                `}
              >
                →
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

IndustriesGrid.displayName = 'IndustriesGrid';

export default IndustriesGrid;
