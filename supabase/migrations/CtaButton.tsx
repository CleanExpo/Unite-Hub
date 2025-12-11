import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// cn utility function, common in shadcn/ui projects
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-orange-600 text-white hover:bg-orange-600/90',
        outline:
          'border border-orange-600 text-orange-500 hover:bg-orange-600/10',
      },
      size: {
        default: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'lg',
    },
  }
);

export interface CtaButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>,
    VariantProps<typeof buttonVariants> {
  className?: string;
  showArrow?: boolean;
}

const CtaButton = React.forwardRef<
  React.ElementRef<typeof Link>,
  CtaButtonProps
>(({ className, variant, size, showArrow = false, children, ...props }, ref) => {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {children}
      {showArrow && <ArrowRight className="ml-2 h-5 w-5" />}
    </Link>
  );
});
CtaButton.displayName = 'CtaButton';

export { CtaButton };