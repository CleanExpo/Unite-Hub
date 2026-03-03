import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* ----------------------------------------
   Spinner Component
   ---------------------------------------- */
const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
    variant: {
      default: "text-primary",
      muted: "text-muted-foreground",
      white: "text-white",
      brand: "text-brand-primary",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, variant, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn(spinnerVariants({ size, variant, className }))}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
);
Spinner.displayName = "Spinner";

/* ----------------------------------------
   Dots Loader Component
   ---------------------------------------- */
const dotsVariants = cva("flex items-center gap-1", {
  variants: {
    size: {
      sm: "[&>span]:h-1.5 [&>span]:w-1.5",
      md: "[&>span]:h-2 [&>span]:w-2",
      lg: "[&>span]:h-3 [&>span]:w-3",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface DotsLoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dotsVariants> {}

const DotsLoader = React.forwardRef<HTMLDivElement, DotsLoaderProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn(dotsVariants({ size, className }))}
      {...props}
    >
      <span className="rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <span className="rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <span className="rounded-full bg-current animate-bounce" />
    </div>
  )
);
DotsLoader.displayName = "DotsLoader";

/* ----------------------------------------
   Skeleton Component
   ---------------------------------------- */
const skeletonVariants = cva("shimmer rounded-md", {
  variants: {
    variant: {
      default: "bg-muted",
      card: "bg-muted rounded-xl",
      circle: "bg-muted rounded-full",
      text: "bg-muted rounded h-4",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant, className }))}
      aria-hidden="true"
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

/* ----------------------------------------
   Skeleton Text (multiple lines)
   ---------------------------------------- */
interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lastLineWidth?: "full" | "3/4" | "1/2" | "1/4";
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ className, lines = 3, lastLineWidth = "3/4", ...props }, ref) => {
    const widthClasses = {
      full: "w-full",
      "3/4": "w-3/4",
      "1/2": "w-1/2",
      "1/4": "w-1/4",
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            className={cn(
              i === lines - 1 ? widthClasses[lastLineWidth] : "w-full"
            )}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = "SkeletonText";

/* ----------------------------------------
   Loading Overlay Component
   ---------------------------------------- */
interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean;
  blur?: boolean;
  spinnerSize?: "sm" | "md" | "lg" | "xl";
  text?: string;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (
    {
      className,
      loading = true,
      blur = true,
      spinnerSize = "lg",
      text,
      children,
      ...props
    },
    ref
  ) => {
    if (!loading) {
      return <>{children}</>;
    }

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 z-50",
            blur && "backdrop-blur-sm"
          )}
        >
          <Spinner size={spinnerSize} />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse-soft">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }
);
LoadingOverlay.displayName = "LoadingOverlay";

/* ----------------------------------------
   Full Page Loader Component
   ---------------------------------------- */
interface FullPageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

const FullPageLoader = React.forwardRef<HTMLDivElement, FullPageLoaderProps>(
  ({ className, text = "Loading...", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background z-50",
        className
      )}
      {...props}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-soft" />
        <Spinner size="xl" variant="brand" />
      </div>
      {text && (
        <p className="text-muted-foreground animate-fade-in">{text}</p>
      )}
    </div>
  )
);
FullPageLoader.displayName = "FullPageLoader";

/* ----------------------------------------
   Skeleton Card Component
   ---------------------------------------- */
const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card p-6 space-y-4 shadow-sm",
      className
    )}
    {...props}
  >
    <Skeleton className="h-40 w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-9 w-24 rounded-md" />
      <Skeleton className="h-9 w-20 rounded-md" />
    </div>
  </div>
));
SkeletonCard.displayName = "SkeletonCard";

export {
  Spinner,
  DotsLoader,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  LoadingOverlay,
  FullPageLoader,
  spinnerVariants,
  skeletonVariants,
};
