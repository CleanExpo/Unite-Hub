'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { FadeIn, SlideUp, Stagger } from '@/components/ui/motion';

/* ----------------------------------------
   Hero Section Variants
   ---------------------------------------- */
const heroVariants = cva('relative w-full overflow-hidden', {
  variants: {
    variant: {
      default: 'bg-background',
      gradient:
        'bg-gradient-to-br from-brand-primary-50 via-background to-brand-accent-50 dark:from-brand-primary-950/30 dark:via-background dark:to-brand-accent-950/30',
      dark: 'bg-gradient-to-b from-gray-900 to-gray-950 text-white',
      radial:
        'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]',
      mesh: 'bg-gradient-to-br from-brand-primary-100 via-brand-secondary-50 to-brand-accent-100 dark:from-brand-primary-950/50 dark:via-brand-secondary-950/30 dark:to-brand-accent-950/50',
      spotlight:
        'bg-background before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_120%,hsl(var(--brand-primary)/0.15),transparent_50%)]',
      minimal: 'bg-background',
    },
    size: {
      sm: 'py-16 md:py-20',
      default: 'py-20 md:py-28 lg:py-32',
      lg: 'py-28 md:py-36 lg:py-44',
      full: 'min-h-screen flex items-center',
    },
    alignment: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    alignment: 'center',
  },
});

/* ----------------------------------------
   Hero Section Types
   ---------------------------------------- */
interface HeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  icon?: React.ReactNode;
}

export interface HeroSectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'>, VariantProps<typeof heroVariants> {
  badge?: string | React.ReactNode;
  title: string | React.ReactNode;
  titleHighlight?: string;
  subtitle?: string | React.ReactNode;
  actions?: HeroAction[];
  image?: React.ReactNode;
  imagePosition?: 'right' | 'bottom' | 'background';
  features?: string[];
  stats?: Array<{ value: string; label: string }>;
  announcement?: {
    text: string;
    href?: string;
    badge?: string;
  };
  trusted?: {
    label: string;
    logos: React.ReactNode[];
  };
  animated?: boolean;
}

/* ----------------------------------------
   Sub-Components
   ---------------------------------------- */
const HeroBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { animated?: boolean }
>(({ className, animated = true, children, ...props }, ref) => {
  const Wrapper = animated ? FadeIn : React.Fragment;
  const wrapperProps = animated ? { delay: 0 } : {};

  return (
    <Wrapper {...wrapperProps}>
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium',
          'border-brand-primary/20 bg-brand-primary/10 rounded-full border',
          'text-brand-primary dark:bg-brand-primary/20',
          className
        )}
        {...props}
      >
        {children}
      </span>
    </Wrapper>
  );
});
HeroBadge.displayName = 'HeroBadge';

const HeroTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    highlight?: string;
    animated?: boolean;
  }
>(({ className, highlight, animated = true, children, ...props }, ref) => {
  const Wrapper = animated ? SlideUp : React.Fragment;
  const wrapperProps = animated ? { delay: 100 } : {};

  // If highlight is provided and children is a string, wrap the highlighted part
  let content = children;
  if (highlight && typeof children === 'string') {
    const parts = children.split(highlight);
    if (parts.length > 1) {
      content = (
        <>
          {parts[0]}
          <span className="text-gradient">{highlight}</span>
          {parts.slice(1).join(highlight)}
        </>
      );
    }
  }

  return (
    <Wrapper {...wrapperProps}>
      <h1
        ref={ref}
        className={cn(
          'text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
          'leading-[1.1] font-bold tracking-tight',
          'text-balance',
          className
        )}
        {...props}
      >
        {content}
      </h1>
    </Wrapper>
  );
});
HeroTitle.displayName = 'HeroTitle';

const HeroSubtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { animated?: boolean }
>(({ className, animated = true, ...props }, ref) => {
  const Wrapper = animated ? SlideUp : React.Fragment;
  const wrapperProps = animated ? { delay: 200 } : {};

  return (
    <Wrapper {...wrapperProps}>
      <p
        ref={ref}
        className={cn(
          'text-lg md:text-xl lg:text-2xl',
          'text-muted-foreground mx-auto max-w-3xl',
          'leading-relaxed text-balance',
          className
        )}
        {...props}
      />
    </Wrapper>
  );
});
HeroSubtitle.displayName = 'HeroSubtitle';

const HeroActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    actions: HeroAction[];
    animated?: boolean;
  }
>(({ className, actions, animated = true, ...props }, ref) => {
  const Wrapper = animated ? SlideUp : React.Fragment;
  const wrapperProps = animated ? { delay: 300 } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center justify-center gap-4', className)}
        {...props}
      >
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || (index === 0 ? 'gradient' : 'outline')}
            size={action.size || 'lg'}
            onClick={action.onClick}
            leftIcon={action.icon}
            asChild={!!action.href}
          >
            {action.href ? <a href={action.href}>{action.label}</a> : action.label}
          </Button>
        ))}
      </div>
    </Wrapper>
  );
});
HeroActions.displayName = 'HeroActions';

const HeroStats = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    stats: Array<{ value: string; label: string }>;
    animated?: boolean;
  }
>(({ className, stats, animated = true, ...props }, ref) => {
  const Container = animated ? Stagger : 'div';
  const containerProps = animated ? { staggerDelay: 100 } : {};

  return (
    <Container
      ref={ref}
      className={cn('grid grid-cols-2 gap-8 pt-12 md:grid-cols-4', className)}
      {...containerProps}
      {...props}
    >
      {stats.map((stat, index) => (
        <FadeIn key={index} className="text-center">
          <div className="text-brand-primary text-3xl font-bold md:text-4xl">{stat.value}</div>
          <div className="text-muted-foreground mt-1 text-sm">{stat.label}</div>
        </FadeIn>
      ))}
    </Container>
  );
});
HeroStats.displayName = 'HeroStats';

const HeroFeatures = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    features: string[];
    animated?: boolean;
  }
>(({ className, features, animated = true, ...props }, ref) => {
  const Wrapper = animated ? SlideUp : React.Fragment;
  const wrapperProps = animated ? { delay: 400 } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        ref={ref}
        className={cn(
          'flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-8',
          'text-muted-foreground text-sm',
          className
        )}
        {...props}
      >
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <svg
              className="text-success h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </div>
        ))}
      </div>
    </Wrapper>
  );
});
HeroFeatures.displayName = 'HeroFeatures';

const HeroTrusted = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label: string;
    logos: React.ReactNode[];
    animated?: boolean;
  }
>(({ className, label, logos, animated = true, ...props }, ref) => {
  const Wrapper = animated ? FadeIn : React.Fragment;
  const wrapperProps = animated ? { delay: 500 } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div ref={ref} className={cn('pt-16 text-center', className)} {...props}>
        <p className="text-muted-foreground mb-6 text-sm">{label}</p>
        <div className="duration-slow flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          {logos}
        </div>
      </div>
    </Wrapper>
  );
});
HeroTrusted.displayName = 'HeroTrusted';

/* ----------------------------------------
   Main Hero Section Component
   ---------------------------------------- */
const HeroSection = React.forwardRef<HTMLElement, HeroSectionProps>(
  (
    {
      className,
      variant,
      size,
      alignment,
      badge,
      title,
      titleHighlight,
      subtitle,
      actions,
      image,
      imagePosition = 'right',
      features,
      stats,
      announcement,
      trusted,
      animated = true,
      children,
      ...props
    },
    ref
  ) => {
    const hasImage = !!image && imagePosition !== 'background';
    const isFullWidth = !hasImage || imagePosition === 'bottom';

    return (
      <section
        ref={ref}
        className={cn(heroVariants({ variant, size, alignment }), className)}
        {...props}
      >
        {/* Background Image */}
        {image && imagePosition === 'background' && (
          <div className="absolute inset-0 -z-10">
            {image}
            <div className="bg-background/80 absolute inset-0 backdrop-blur-sm" />
          </div>
        )}

        <div className="container px-4 md:px-6">
          <div
            className={cn(
              'grid gap-8 lg:gap-12',
              hasImage && imagePosition === 'right' && 'lg:grid-cols-2 lg:items-center'
            )}
          >
            {/* Content */}
            <div
              className={cn(
                'flex flex-col gap-6',
                alignment === 'center' && 'items-center',
                alignment === 'right' && 'items-end',
                isFullWidth && 'mx-auto max-w-4xl'
              )}
            >
              {/* Announcement */}
              {announcement && (
                <FadeIn delay={0}>
                  <a
                    href={announcement.href}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1 text-sm',
                      'bg-muted/50 hover:bg-muted rounded-full border transition-colors',
                      !announcement.href && 'pointer-events-none'
                    )}
                  >
                    {announcement.badge && (
                      <span className="bg-brand-primary rounded-full px-2 py-0.5 text-xs font-semibold text-white">
                        {announcement.badge}
                      </span>
                    )}
                    {announcement.text}
                    {announcement.href && (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </a>
                </FadeIn>
              )}

              {/* Badge */}
              {badge &&
                (typeof badge === 'string' ? (
                  <HeroBadge animated={animated}>{badge}</HeroBadge>
                ) : (
                  badge
                ))}

              {/* Title */}
              <HeroTitle highlight={titleHighlight} animated={animated}>
                {title}
              </HeroTitle>

              {/* Subtitle */}
              {subtitle && <HeroSubtitle animated={animated}>{subtitle}</HeroSubtitle>}

              {/* Actions */}
              {actions && actions.length > 0 && (
                <HeroActions actions={actions} animated={animated} />
              )}

              {/* Features */}
              {features && features.length > 0 && (
                <HeroFeatures features={features} animated={animated} />
              )}

              {/* Stats */}
              {stats && stats.length > 0 && <HeroStats stats={stats} animated={animated} />}

              {/* Custom Children */}
              {children}
            </div>

            {/* Side Image */}
            {image && imagePosition === 'right' && (
              <SlideUp delay={400} className="relative lg:order-last">
                <div className="relative aspect-square lg:aspect-auto">{image}</div>
              </SlideUp>
            )}
          </div>

          {/* Bottom Image */}
          {image && imagePosition === 'bottom' && (
            <SlideUp delay={400} className="mt-12 lg:mt-16">
              {image}
            </SlideUp>
          )}

          {/* Trusted By */}
          {trusted && (
            <HeroTrusted label={trusted.label} logos={trusted.logos} animated={animated} />
          )}
        </div>

        {/* Decorative Elements */}
        {variant === 'gradient' && (
          <>
            <div className="bg-brand-primary/20 absolute top-1/4 left-0 -z-10 h-72 w-72 rounded-full blur-3xl" />
            <div className="bg-brand-accent/20 absolute right-0 bottom-1/4 -z-10 h-96 w-96 rounded-full blur-3xl" />
          </>
        )}
      </section>
    );
  }
);
HeroSection.displayName = 'HeroSection';

export {
  HeroSection,
  HeroBadge,
  HeroTitle,
  HeroSubtitle,
  HeroActions,
  HeroStats,
  HeroFeatures,
  HeroTrusted,
  heroVariants,
};
