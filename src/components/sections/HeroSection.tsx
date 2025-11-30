/**
 * HeroSection Component
 *
 * Landing page hero with large headline, description, and CTA buttons.
 * Includes optional stats display and responsive image support.
 *
 * @example
 * <HeroSection
 *   tag="Welcome to Synthex"
 *   title="AI-Powered CRM for Local Businesses"
 *   description="Automate your customer relationships and grow revenue with intelligent marketing."
 *   primaryCTA={{ label: "Start Free Trial", href: "/signup" }}
 *   secondaryCTA={{ label: "Watch Demo", href: "/demo" }}
 *   stats={[
 *     { label: "Businesses Transformed", value: "500+" },
 *     { label: "Automation Rules Created", value: "10K+" },
 *     { label: "Customer Satisfaction", value: "98%" }
 *   ]}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface CTAButton {
  label: string;
  href: string;
  newTab?: boolean;
}

export interface StatItem {
  label: string;
  value: string;
}

export interface HeroSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Small uppercase tag above title */
  tag?: string;

  /** Main hero headline */
  title: string;

  /** Description text under headline */
  description?: string;

  /** Primary CTA button */
  primaryCTA: CTAButton;

  /** Secondary CTA button */
  secondaryCTA?: CTAButton;

  /** Optional stats display below CTAs */
  stats?: StatItem[];

  /** Optional image/visual on right side (child content) */
  children?: ReactNode;

  /** Text alignment @default 'left' */
  align?: 'left' | 'center';

  /** Hero layout @default 'default' */
  heroLayout?: 'default' | 'split';

  /** Additional CSS classes */
  className?: string;
}

/**
 * HeroSection Component
 *
 * Uses design tokens:
 * - Tag: text-accent-500, font-bold, uppercase
 * - Title: font-display, font-bold, text-6xl-7xl
 * - Description: text-text-secondary, font-body, leading-relaxed
 * - CTAs: Using Button component (primary/secondary variants)
 * - Stats: text-text-primary with larger numbers
 */
export const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      tag,
      title,
      description,
      primaryCTA,
      secondaryCTA,
      stats,
      children,
      align = 'left',
      heroLayout = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const alignStyles = align === 'center' ? 'text-center' : 'text-left';
    const marginAuto = align === 'center' ? 'mx-auto' : '';

    return (
      <div
        ref={ref}
        className={`
          w-full
          py-20 md:py-32 lg:py-40
          ${className}
        `.trim()}
        {...props}
      >
        <div
          className={`
            ${heroLayout === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center' : 'max-w-4xl'}
            ${marginAuto}
          `.trim()}
        >
          {/* Content Section */}
          <div className={`flex flex-col gap-6 ${alignStyles}`}>
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
            <h1
              className={`
                font-display
                font-bold
                text-text-primary
                letter-spacing-tight
                text-5xl md:text-6xl lg:text-7xl
                leading-tight
                ${marginAuto}
              `}
            >
              {title}
            </h1>

            {/* Description */}
            {description && (
              <p
                className={`
                  text-text-secondary
                  font-body
                  leading-relaxed
                  text-lg md:text-xl
                  max-w-2xl
                  ${marginAuto}
                `}
              >
                {description}
              </p>
            )}

            {/* CTA Buttons */}
            <div
              className={`
                flex flex-col sm:flex-row gap-4
                ${align === 'center' ? 'sm:justify-center' : 'sm:justify-start'}
                pt-4
              `}
            >
              {/* Primary CTA */}
              <a
                href={primaryCTA.href}
                target={primaryCTA.newTab ? '_blank' : undefined}
                rel={primaryCTA.newTab ? 'noopener noreferrer' : undefined}
                className={`
                  inline-flex items-center justify-center
                  gap-2
                  px-7 py-3
                  font-semibold
                  text-white
                  bg-accent-500
                  hover:bg-accent-400
                  active:bg-accent-600
                  rounded-md
                  transition-all duration-normal ease-out
                  focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                  shadow-button-primary
                  min-h-12
                `}
              >
                {primaryCTA.label}
              </a>

              {/* Secondary CTA */}
              {secondaryCTA && (
                <a
                  href={secondaryCTA.href}
                  target={secondaryCTA.newTab ? '_blank' : undefined}
                  rel={secondaryCTA.newTab ? 'noopener noreferrer' : undefined}
                  className={`
                    inline-flex items-center justify-center
                    gap-2
                    px-7 py-3
                    font-semibold
                    text-text-primary
                    bg-bg-card
                    border border-border-subtle
                    hover:bg-bg-hover
                    hover:border-border-medium
                    rounded-md
                    transition-all duration-normal ease-out
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                    min-h-12
                  `}
                >
                  {secondaryCTA.label}
                </a>
              )}
            </div>

            {/* Stats */}
            {stats && stats.length > 0 && (
              <div
                className={`
                  pt-8 mt-8
                  border-t border-border-subtle
                  grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8
                  ${align === 'center' ? 'sm:justify-center' : ''}
                `}
              >
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`
                      flex flex-col gap-1
                      ${align === 'center' ? 'items-center' : 'items-start'}
                    `}
                  >
                    <span className="text-3xl md:text-4xl font-bold text-accent-500">
                      {stat.value}
                    </span>
                    <span className="text-sm md:text-base text-text-secondary font-body">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image/Visual Section (for split layout) */}
          {heroLayout === 'split' && children && (
            <div className="w-full h-full min-h-96 lg:min-h-full">
              {children}
            </div>
          )}
        </div>

        {/* Full-width image (for default layout) */}
        {heroLayout === 'default' && children && (
          <div className="w-full mt-12 md:mt-16 lg:mt-20">
            {children}
          </div>
        )}
      </div>
    );
  }
);

HeroSection.displayName = 'HeroSection';

export default HeroSection;
