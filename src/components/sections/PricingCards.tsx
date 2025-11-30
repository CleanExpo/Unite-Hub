/**
 * PricingCards Component
 *
 * 3-tier pricing cards section with featured tier highlight.
 * Includes pricing, features list, and CTA buttons per tier.
 *
 * @example
 * <PricingCards
 *   tag="Simple Pricing"
 *   title="Plans for Every Business Size"
 *   description="Choose the perfect plan to grow your business"
 *   tiers={[
 *     {
 *       name: "Starter",
 *       price: "49",
 *       description: "Perfect for getting started",
 *       features: ["Up to 100 contacts", "Email campaigns", "Basic automation"],
 *       cta: { label: "Start Free Trial", href: "/signup" },
 *       featured: false
 *     },
 *     {
 *       name: "Professional",
 *       price: "149",
 *       description: "For growing businesses",
 *       features: ["Unlimited contacts", "Advanced automation", "AI scoring"],
 *       cta: { label: "Start Free Trial", href: "/signup" },
 *       featured: true
 *     },
 *     // ... more tiers
 *   ]}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface PricingFeature {
  name: string;
  included?: boolean;
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: PricingFeature[];
  cta: {
    label: string;
    href: string;
  };
  featured?: boolean;
}

export interface PricingCardsProps extends HTMLAttributes<HTMLDivElement> {
  /** Small uppercase tag above title */
  tag?: string;

  /** Section title */
  title: string;

  /** Section description */
  description?: string;

  /** Array of pricing tiers */
  tiers: PricingTier[];

  /** Text alignment @default 'center' */
  align?: 'left' | 'center';

  /** Additional CSS classes */
  className?: string;
}

/**
 * PricingCards Component
 *
 * Uses design tokens:
 * - Header: tag (accent-500), title (display font), description
 * - Featured tier: ring-accent-500, scale emphasis
 * - Cards: bg-bg-card, border-border-subtle, shadow effects
 * - Price: text-accent-500, font-bold, text-4xl-5xl
 * - Features: text-text-secondary, checkmarks in accent color
 */
export const PricingCards = forwardRef<HTMLDivElement, PricingCardsProps>(
  (
    {
      tag,
      title,
      description,
      tiers,
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

        {/* Pricing Cards Grid */}
        <div
          className={`
            grid grid-cols-1 md:grid-cols-3 gap-8
            max-w-6xl
            ${marginAuto}
          `}
        >
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`
                relative
                bg-bg-card
                border rounded-lg
                transition-all duration-normal ease-out
                flex flex-col
                p-8 md:p-10
                ${tier.featured
                  ? 'border-accent-500 ring-2 ring-accent-500 ring-offset-0 md:scale-105 shadow-lg'
                  : 'border-border-subtle hover:border-border-medium'
                }
              `}
            >
              {/* Featured Badge */}
              {tier.featured && (
                <div
                  className={`
                    absolute -top-4 left-1/2 transform -translate-x-1/2
                    bg-accent-500 text-white
                    px-4 py-1.5
                    rounded-full
                    text-xs font-bold
                    uppercase tracking-widest
                  `}
                >
                  Most Popular
                </div>
              )}

              {/* Tier Name */}
              <h3
                className={`
                  text-2xl md:text-3xl
                  font-bold
                  text-text-primary
                  mb-2
                  text-left
                `}
              >
                {tier.name}
              </h3>

              {/* Description */}
              {tier.description && (
                <p
                  className={`
                    text-text-secondary
                    font-body
                    text-sm
                    mb-6
                    text-left
                  `}
                >
                  {tier.description}
                </p>
              )}

              {/* Price */}
              <div className="mb-8 border-t border-border-subtle pt-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl md:text-6xl font-bold text-accent-500">
                    ${tier.price}
                  </span>
                  <span className="text-text-secondary text-base font-body">
                    {tier.period || '/month'}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="mb-8 flex-grow">
                <div className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className={`
                        flex items-start gap-3
                        text-left
                      `}
                    >
                      {/* Checkmark */}
                      <span
                        className={`
                          flex-shrink-0
                          w-5 h-5
                          rounded-full
                          flex items-center justify-center
                          mt-0.5
                          ${feature.included !== false
                            ? 'bg-accent-500 text-white'
                            : 'border border-border-subtle text-text-muted'
                          }
                        `}
                      >
                        {feature.included !== false ? (
                          <span className="text-sm font-bold">✓</span>
                        ) : (
                          <span className="text-sm">✗</span>
                        )}
                      </span>

                      {/* Feature Text */}
                      <span
                        className={`
                          font-body
                          text-sm md:text-base
                          ${feature.included !== false
                            ? 'text-text-primary'
                            : 'text-text-muted'
                          }
                        `}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <a
                href={tier.cta.href}
                className={`
                  w-full
                  px-6 py-3
                  font-semibold
                  rounded-md
                  transition-all duration-normal ease-out
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  text-center
                  ${tier.featured
                    ? 'bg-accent-500 text-white hover:bg-accent-400 focus:ring-accent-500 focus:ring-offset-bg-base'
                    : 'bg-bg-hover text-text-primary border border-border-subtle hover:bg-bg-card hover:border-border-medium focus:ring-accent-500 focus:ring-offset-bg-base'
                  }
                `}
              >
                {tier.cta.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PricingCards.displayName = 'PricingCards';

export default PricingCards;
