'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { FadeIn, SlideUp } from '@/components/ui/motion';

/* ----------------------------------------
   Testimonials Variants
   ---------------------------------------- */
const testimonialsVariants = cva('w-full py-16 md:py-24 lg:py-32', {
  variants: {
    variant: {
      default: '',
      cards: '',
      minimal: '',
      featured: '',
      marquee: 'overflow-hidden',
    },
    columns: {
      1: 'max-w-2xl mx-auto',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    },
  },
  defaultVariants: {
    variant: 'default',
    columns: 3,
  },
});

const testimonialCardVariants = cva('relative h-full transition-all duration-normal', {
  variants: {
    variant: {
      default: 'bg-card rounded-xl border p-6 hover:shadow-lg hover:-translate-y-1',
      cards:
        'bg-gradient-to-br from-card to-muted/30 rounded-2xl border shadow-sm p-8 hover:shadow-xl',
      minimal: 'p-6',
      featured: 'bg-card rounded-2xl border-2 border-brand-primary/20 p-8 shadow-lg',
      marquee: 'bg-card rounded-xl border p-6 shadow-sm w-[350px] shrink-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/* ----------------------------------------
   Testimonial Types
   ---------------------------------------- */
export interface Testimonial {
  quote: string;
  author: {
    name: string;
    title?: string;
    company?: string;
    avatar?: React.ReactNode;
  };
  rating?: number;
  highlight?: boolean;
  logo?: React.ReactNode;
}

export interface TestimonialsProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'title'>,
    VariantProps<typeof testimonialsVariants> {
  title?: string | React.ReactNode;
  titleHighlight?: string;
  subtitle?: string | React.ReactNode;
  badge?: string;
  testimonials: Testimonial[];
  animated?: boolean;
  alignment?: 'left' | 'center';
}

/* ----------------------------------------
   Sub-Components
   ---------------------------------------- */
const StarRating = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { rating: number }
>(({ className, rating, ...props }, ref) => (
  <div ref={ref} className={cn('mb-4 flex items-center gap-0.5', className)} {...props}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={cn('h-5 w-5', i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
));
StarRating.displayName = 'StarRating';

const QuoteIcon = React.forwardRef<SVGSVGElement, React.SVGAttributes<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn('text-brand-primary/20 h-8 w-8', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  )
);
QuoteIcon.displayName = 'QuoteIcon';

const TestimonialCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    testimonial: Testimonial;
    variant?: 'default' | 'cards' | 'minimal' | 'featured' | 'marquee';
    index?: number;
    animated?: boolean;
  }
>(({ className, testimonial, variant = 'default', index = 0, animated = true, ...props }, ref) => {
  const Wrapper = animated && variant !== 'marquee' ? FadeIn : React.Fragment;
  const wrapperProps = animated && variant !== 'marquee' ? { delay: index * 100 } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        ref={ref}
        className={cn(
          testimonialCardVariants({ variant }),
          testimonial.highlight && variant !== 'featured' && 'ring-brand-primary/20 ring-2',
          className
        )}
        {...props}
      >
        {/* Quote Icon */}
        {variant !== 'minimal' && <QuoteIcon className="mb-4" />}

        {/* Rating */}
        {testimonial.rating && <StarRating rating={testimonial.rating} />}

        {/* Quote */}
        <blockquote className="text-foreground mb-6 leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="mt-auto flex items-center gap-4">
          {testimonial.author.avatar && <div className="shrink-0">{testimonial.author.avatar}</div>}
          <div className="min-w-0 flex-1">
            <div className="text-foreground truncate font-semibold">{testimonial.author.name}</div>
            {(testimonial.author.title || testimonial.author.company) && (
              <div className="text-muted-foreground truncate text-sm">
                {testimonial.author.title}
                {testimonial.author.title && testimonial.author.company && ' at '}
                {testimonial.author.company}
              </div>
            )}
          </div>
          {testimonial.logo && <div className="shrink-0 opacity-60">{testimonial.logo}</div>}
        </div>
      </div>
    </Wrapper>
  );
});
TestimonialCard.displayName = 'TestimonialCard';

/* ----------------------------------------
   Section Header Sub-Component
   ---------------------------------------- */
const TestimonialsHeader = React.forwardRef<
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
TestimonialsHeader.displayName = 'TestimonialsHeader';

/* ----------------------------------------
   Marquee Animation Component
   ---------------------------------------- */
const MarqueeRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    testimonials: Testimonial[];
    direction?: 'left' | 'right';
    speed?: 'slow' | 'normal' | 'fast';
  }
>(({ className, testimonials, direction = 'left', speed = 'normal', ...props }, ref) => {
  const speedClass = {
    slow: 'animate-marquee-slow',
    normal: 'animate-marquee',
    fast: 'animate-marquee-fast',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex gap-6 py-4',
        direction === 'right' && '[animation-direction:reverse]',
        speedClass[speed],
        className
      )}
      {...props}
    >
      {/* Double the testimonials for seamless loop */}
      {[...testimonials, ...testimonials].map((testimonial, index) => (
        <TestimonialCard key={index} testimonial={testimonial} variant="marquee" animated={false} />
      ))}
    </div>
  );
});
MarqueeRow.displayName = 'MarqueeRow';

/* ----------------------------------------
   Main Testimonials Component
   ---------------------------------------- */
const Testimonials = React.forwardRef<HTMLElement, TestimonialsProps>(
  (
    {
      className,
      variant,
      columns,
      title,
      titleHighlight,
      subtitle,
      badge,
      testimonials,
      animated = true,
      alignment = 'center',
      children,
      ...props
    },
    ref
  ) => {
    // Marquee variant
    if (variant === 'marquee') {
      const half = Math.ceil(testimonials.length / 2);
      const firstHalf = testimonials.slice(0, half);
      const secondHalf = testimonials.slice(half);

      return (
        <section ref={ref} className={cn(testimonialsVariants({ variant }), className)} {...props}>
          <div className="container px-4 md:px-6">
            {title && (
              <TestimonialsHeader
                badge={badge}
                title={title}
                titleHighlight={titleHighlight}
                subtitle={subtitle}
                alignment={alignment}
                animated={animated}
              />
            )}
          </div>

          {/* Marquee Rows */}
          <div className="relative">
            {/* Gradient Masks */}
            <div className="from-background absolute top-0 bottom-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent md:w-48" />
            <div className="from-background absolute top-0 right-0 bottom-0 z-10 w-24 bg-gradient-to-l to-transparent md:w-48" />

            <MarqueeRow testimonials={firstHalf} direction="left" />
            {secondHalf.length > 0 && <MarqueeRow testimonials={secondHalf} direction="right" />}
          </div>

          {children}
        </section>
      );
    }

    // Featured variant (single large testimonial)
    if (variant === 'featured' && testimonials.length > 0) {
      const featured = testimonials[0];
      return (
        <section ref={ref} className={cn(testimonialsVariants({ variant }), className)} {...props}>
          <div className="container px-4 md:px-6">
            {title && (
              <TestimonialsHeader
                badge={badge}
                title={title}
                titleHighlight={titleHighlight}
                subtitle={subtitle}
                alignment={alignment}
                animated={animated}
              />
            )}

            <div className="mx-auto max-w-4xl">
              <TestimonialCard testimonial={featured} variant="featured" animated={animated} />
            </div>

            {/* Additional testimonials as smaller cards */}
            {testimonials.length > 1 && (
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.slice(1).map((testimonial, index) => (
                  <TestimonialCard
                    key={index}
                    testimonial={testimonial}
                    variant="default"
                    index={index + 1}
                    animated={animated}
                  />
                ))}
              </div>
            )}

            {children}
          </div>
        </section>
      );
    }

    // Standard grid variants
    return (
      <section ref={ref} className={cn(testimonialsVariants({ variant }), className)} {...props}>
        <div className="container px-4 md:px-6">
          {title && (
            <TestimonialsHeader
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
              'grid gap-6 md:gap-8',
              columns === 1 && 'mx-auto max-w-2xl',
              columns === 2 && 'grid-cols-1 md:grid-cols-2',
              columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                testimonial={testimonial}
                variant={variant || 'default'}
                index={index}
                animated={animated}
              />
            ))}
          </div>

          {children}
        </div>
      </section>
    );
  }
);
Testimonials.displayName = 'Testimonials';

export {
  Testimonials,
  TestimonialCard,
  TestimonialsHeader,
  StarRating,
  QuoteIcon,
  MarqueeRow,
  testimonialsVariants,
  testimonialCardVariants,
};
