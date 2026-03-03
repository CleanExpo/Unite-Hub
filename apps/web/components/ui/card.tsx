import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* ----------------------------------------
   Card Variants
   ---------------------------------------- */
const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground transition-all duration-normal',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-lg border-border/50 hover:shadow-xl',
        interactive:
          'shadow-md hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-[0.99]',
        featured:
          'shadow-lg border-brand-primary/20 bg-gradient-to-br from-brand-primary-50/50 to-transparent dark:from-brand-primary-950/20',
        gradient:
          "relative overflow-hidden border-0 before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:bg-gradient-brand before:-z-10 before:content-[''] shadow-md",
        glass: 'glass border-white/20 dark:border-white/10 shadow-lg backdrop-blur-md',
        outline: 'border-2 shadow-none hover:border-brand-primary/50',
        ghost: 'border-transparent shadow-none hover:bg-muted/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/* ----------------------------------------
   Card Component
   ---------------------------------------- */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
  )
);
Card.displayName = 'Card';

/* ----------------------------------------
   Card Header Component
   ---------------------------------------- */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

/* ----------------------------------------
   Card Title Component
   ---------------------------------------- */
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Comp = 'h3', ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn('text-xl leading-none font-semibold tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

/* ----------------------------------------
   Card Description Component
   ---------------------------------------- */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-muted-foreground text-sm leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/* ----------------------------------------
   Card Content Component
   ---------------------------------------- */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

/* ----------------------------------------
   Card Footer Component
   ---------------------------------------- */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

/* ----------------------------------------
   Card Image Component
   ---------------------------------------- */
interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'video' | 'square' | 'wide';
}

const CardImage = React.forwardRef<HTMLImageElement, CardImageProps>(
  ({ className, aspectRatio = 'video', alt = '', ...props }, ref) => (
    <div
      className={cn(
        'relative overflow-hidden rounded-t-xl',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === 'wide' && 'aspect-[21/9]'
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Generic UI component supporting external URLs */}
      <img
        ref={ref}
        alt={alt}
        className={cn(
          'duration-slow h-full w-full object-cover transition-transform hover:scale-105',
          className
        )}
        {...props}
      />
    </div>
  )
);
CardImage.displayName = 'CardImage';

/* ----------------------------------------
   Card Badge Component (for featured/status)
   ---------------------------------------- */
interface CardBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const CardBadge = React.forwardRef<HTMLSpanElement, CardBadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-primary text-primary-foreground',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      error: 'bg-error text-error-foreground',
      info: 'bg-info text-info-foreground',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-xs font-medium',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
CardBadge.displayName = 'CardBadge';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardImage,
  CardBadge,
  cardVariants,
};
