/**
 * CTASection Component
 *
 * Final call-to-action footer section for landing pages.
 * Full-width background with headline, description, and prominent CTA.
 *
 * @example
 * <CTASection
 *   tag="Ready to Transform?"
 *   title="Start Growing Your Business Today"
 *   description="Join hundreds of businesses that are automating their customer relationships and growing revenue faster."
 *   primaryCTA={{ label: "Start Your Free Trial", href: "/signup" }}
 *   secondaryCTA={{ label: "Schedule Demo", href: "/demo" }}
 *   backgroundGradient
 * />
 */

import { forwardRef, HTMLAttributes } from 'react';

export interface CTALink {
  label: string;
  href: string;
  newTab?: boolean;
}

export interface CTASectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Small uppercase tag above title */
  tag?: string;

  /** Main CTA headline */
  title: string;

  /** Description text */
  description?: string;

  /** Primary CTA button */
  primaryCTA: CTALink;

  /** Secondary CTA button */
  secondaryCTA?: CTALink;

  /** Show gradient background @default true */
  backgroundGradient?: boolean;

  /** Text alignment @default 'center' */
  align?: 'left' | 'center';

  /** Additional CSS classes */
  className?: string;
}

/**
 * CTASection Component
 *
 * Uses design tokens:
 * - Background: bg-bg-raised with optional accent gradient overlay
 * - Tag: text-accent-500, font-bold, uppercase
 * - Title: font-display, font-bold, text-5xl-7xl, text-text-primary
 * - Description: text-text-secondary, font-body, leading-relaxed
 * - CTAs: Prominent buttons with proper contrast
 */
export const CTASection = forwardRef<HTMLDivElement, CTASectionProps>(
  (
    {
      tag,
      title,
      description,
      primaryCTA,
      secondaryCTA,
      backgroundGradient = true,
      align = 'center',
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
          relative
          overflow-hidden
          ${className}
        `.trim()}
        {...props}
      >
        {/* Background */}
        <div
          className={`
            absolute inset-0
            bg-bg-raised
            ${backgroundGradient
              ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-accent-500 before:to-accent-600 before:opacity-10'
              : ''
            }
          `}
        />

        {/* Decorative Elements */}
        {backgroundGradient && (
          <>
            {/* Top Right Circle */}
            <div
              className={`
                absolute -top-40 -right-40
                w-80 h-80
                bg-accent-500
                rounded-full
                opacity-5
                blur-3xl
              `}
            />

            {/* Bottom Left Circle */}
            <div
              className={`
                absolute -bottom-40 -left-40
                w-80 h-80
                bg-accent-500
                rounded-full
                opacity-5
                blur-3xl
              `}
            />
          </>
        )}

        {/* Content */}
        <div
          className={`
            relative
            z-10
            py-20 md:py-32 lg:py-40
            px-6 md:px-8
          `}
        >
          <div
            className={`
              max-w-3xl
              ${marginAuto}
              ${alignStyles}
            `}
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
                mb-4 md:mb-6
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
                  text-lg md:text-xl
                  mb-8 md:mb-12
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
                flex-wrap
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
                  px-8 py-4
                  font-semibold
                  text-white
                  bg-accent-500
                  hover:bg-accent-400
                  active:bg-accent-600
                  rounded-md
                  transition-all duration-normal ease-out
                  focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-raised
                  shadow-lg
                  min-h-14
                  text-center
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
                    px-8 py-4
                    font-semibold
                    text-text-primary
                    bg-transparent
                    border-2 border-text-primary
                    hover:bg-bg-base
                    hover:border-text-primary
                    rounded-md
                    transition-all duration-normal ease-out
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-raised
                    min-h-14
                    text-center
                  `}
                >
                  {secondaryCTA.label}
                </a>
              )}
            </div>

            {/* Trust Statement */}
            <p
              className={`
                mt-10 md:mt-14
                text-text-muted
                font-body
                text-sm
              `}
            >
              14-day free trial. No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

CTASection.displayName = 'CTASection';

export default CTASection;
