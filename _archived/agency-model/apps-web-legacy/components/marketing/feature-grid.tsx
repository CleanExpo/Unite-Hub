'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { FadeIn, SlideUp } from '@/components/ui/motion';

/* ----------------------------------------
   Feature Grid Variants
   ---------------------------------------- */
const featureGridVariants = cva('w-full', {
  variants: {
    variant: {
      default: '',
      cards: '',
      bento: '',
      minimal: '',
      bordered: '',
    },
    columns: {
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    },
    gap: {
      sm: 'gap-4',
      default: 'gap-6 md:gap-8',
      lg: 'gap-8 md:gap-10 lg:gap-12',
    },
  },
  defaultVariants: {
    variant: 'default',
    columns: 3,
    gap: 'default',
  },
});

const featureCardVariants = cva('group relative overflow-hidden transition-all duration-normal', {
  variants: {
    variant: {
      default:
        'bg-card hover:bg-muted/50 rounded-xl border p-6 hover:shadow-lg hover:-translate-y-1',
      cards:
        'bg-gradient-to-br from-card to-muted/30 rounded-2xl border shadow-sm p-8 hover:shadow-xl hover:-translate-y-2',
      bento: 'bg-card rounded-3xl border p-6 md:p-8 hover:border-brand-primary/30 hover:shadow-lg',
      minimal: 'p-6 hover:bg-muted/30 rounded-lg',
      bordered:
        'border-l-4 border-l-brand-primary/50 hover:border-l-brand-primary bg-muted/20 rounded-r-lg p-6 hover:bg-muted/40',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/* ----------------------------------------
   Feature Grid Types
   ---------------------------------------- */
export interface Feature {
  icon?: React.ReactNode;
  title: string;
  description: string;
  link?: {
    text: string;
    href: string;
  };
  badge?: string;
  image?: React.ReactNode;
  highlight?: boolean;
  span?: 1 | 2;
}

export interface FeatureGridProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'title'>,
    VariantProps<typeof featureGridVariants> {
  title?: string | React.ReactNode;
  titleHighlight?: string;
  subtitle?: string | React.ReactNode;
  badge?: string;
  features: Feature[];
  animated?: boolean;
  alignment?: 'left' | 'center';
}

/* ----------------------------------------
   Sub-Components
   ---------------------------------------- */
const FeatureIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: string }
>(({ className, variant = 'default', children, ...props }, ref) => {
  const iconStyles: Record<string, string> = {
    default:
      'w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors',
    cards:
      'w-14 h-14 rounded-2xl bg-gradient-brand text-white flex items-center justify-center mb-6 shadow-lg shadow-brand-primary/25',
    bento:
      'w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4',
    minimal: 'w-10 h-10 text-brand-primary mb-4',
    bordered: 'w-10 h-10 text-brand-primary mb-4',
  };

  return (
    <div ref={ref} className={cn(iconStyles[variant] || iconStyles.default, className)} {...props}>
      {children}
    </div>
  );
});
FeatureIcon.displayName = 'FeatureIcon';

const FeatureCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    feature: Feature;
    variant?: 'default' | 'cards' | 'bento' | 'minimal' | 'bordered';
    index?: number;
    animated?: boolean;
  }
>(({ className, feature, variant = 'default', index = 0, animated = true, ...props }, ref) => {
  const Wrapper = animated ? FadeIn : React.Fragment;
  const wrapperProps = animated ? { delay: index * 100 } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        ref={ref}
        className={cn(
          featureCardVariants({ variant }),
          feature.highlight &&
            'ring-brand-primary/20 bg-brand-primary-50/50 dark:bg-brand-primary-950/20 ring-2',
          feature.span === 2 && 'md:col-span-2',
          className
        )}
        {...props}
      >
        {/* Badge */}
        {feature.badge && (
          <span className="bg-brand-primary absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-xs font-medium text-white">
            {feature.badge}
          </span>
        )}

        {/* Image (for bento-style cards) */}
        {feature.image && variant === 'bento' && (
          <div className="-mx-6 -mt-6 mb-6 overflow-hidden rounded-t-3xl md:-mx-8 md:-mt-8">
            {feature.image}
          </div>
        )}

        {/* Icon */}
        {feature.icon && <FeatureIcon variant={variant}>{feature.icon}</FeatureIcon>}

        {/* Title */}
        <h3
          className={cn(
            'mb-2 leading-none font-semibold tracking-tight',
            variant === 'cards' ? 'text-xl' : 'text-lg'
          )}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>

        {/* Link */}
        {feature.link && (
          <a
            href={feature.link.href}
            className={cn(
              'mt-4 inline-flex items-center gap-1 text-sm font-medium',
              'text-brand-primary hover:text-brand-primary/80 transition-colors'
            )}
          >
            {feature.link.text}
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}

        {/* Hover Effect Decoration */}
        {(variant === 'cards' || variant === 'bento') && (
          <div className="from-brand-primary/5 to-brand-accent/5 duration-slow absolute inset-0 -z-10 bg-gradient-to-br via-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </Wrapper>
  );
});
FeatureCard.displayName = 'FeatureCard';

/* ----------------------------------------
   Section Header Sub-Component
   ---------------------------------------- */
const FeatureGridHeader = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
    badge?: string;
    title: string | React.ReactNode;
    titleHighlight?: string;
    subtitle?: string | React.ReactNode;
    alignment?: 'left' | 'center';
    animated?: boolean;
  }
>(
  (
    {
      className,
      badge,
      title,
      titleHighlight,
      subtitle,
      alignment = 'center',
      animated = true,
      ...props
    },
    ref
  ) => {
    // Handle title highlight
    let titleContent = title;
    if (titleHighlight && typeof title === 'string') {
      const parts = title.split(titleHighlight);
      if (parts.length > 1) {
        titleContent = (
          <>
            {parts[0]}
            <span className="text-gradient">{titleHighlight}</span>
            {parts.slice(1).join(titleHighlight)}
          </>
        );
      }
    }

    const Wrapper = animated ? SlideUp : React.Fragment;

    return (
      <Wrapper>
        <div
          ref={ref}
          className={cn(
            'mb-12 lg:mb-16',
            alignment === 'center' && 'mx-auto max-w-3xl text-center',
            className
          )}
          {...props}
        >
          {badge && (
            <span
              className={cn(
                'mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-medium',
                'bg-brand-primary/10 text-brand-primary'
              )}
            >
              {badge}
            </span>
          )}
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {titleContent}
          </h2>
          {subtitle && <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>}
        </div>
      </Wrapper>
    );
  }
);
FeatureGridHeader.displayName = 'FeatureGridHeader';

/* ----------------------------------------
   Main Feature Grid Component
   ---------------------------------------- */
const FeatureGrid = React.forwardRef<HTMLElement, FeatureGridProps>(
  (
    {
      className,
      variant,
      columns,
      gap,
      title,
      titleHighlight,
      subtitle,
      badge,
      features,
      animated = true,
      alignment = 'center',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <section ref={ref} className={cn('py-16 md:py-24 lg:py-32', className)} {...props}>
        <div className="container px-4 md:px-6">
          {/* Header */}
          {title && (
            <FeatureGridHeader
              badge={badge}
              title={title}
              titleHighlight={titleHighlight}
              subtitle={subtitle}
              alignment={alignment}
              animated={animated}
            />
          )}

          {/* Grid */}
          <div className={cn('grid', featureGridVariants({ columns, gap }))}>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                variant={variant || 'default'}
                index={index}
                animated={animated}
              />
            ))}
          </div>

          {/* Custom Children */}
          {children}
        </div>
      </section>
    );
  }
);
FeatureGrid.displayName = 'FeatureGrid';

/* ----------------------------------------
   Bento Grid Preset
   ---------------------------------------- */
interface BentoGridProps extends Omit<FeatureGridProps, 'variant' | 'columns'> {
  features: (Feature & { span?: 1 | 2; row?: 1 | 2 })[];
}

const BentoGrid = React.forwardRef<HTMLElement, BentoGridProps>(
  (
    {
      features,
      gap = 'default',
      title,
      badge,
      titleHighlight,
      subtitle,
      alignment,
      animated,
      ...props
    },
    ref
  ) => {
    return (
      <section ref={ref} className={cn('py-16 md:py-24 lg:py-32')} {...props}>
        <div className="container px-4 md:px-6">
          {title && (
            <FeatureGridHeader
              badge={badge}
              title={title}
              titleHighlight={titleHighlight}
              subtitle={subtitle}
              alignment={alignment}
              animated={animated}
            />
          )}

          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
              gap === 'sm' ? 'gap-4' : gap === 'lg' ? 'gap-8' : 'gap-6'
            )}
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                variant="bento"
                index={index}
                animated={animated}
                className={cn(
                  feature.span === 2 && 'md:col-span-2',
                  feature.row === 2 && 'md:row-span-2'
                )}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }
);
BentoGrid.displayName = 'BentoGrid';

export {
  FeatureGrid,
  FeatureCard,
  FeatureIcon,
  FeatureGridHeader,
  BentoGrid,
  featureGridVariants,
  featureCardVariants,
};
