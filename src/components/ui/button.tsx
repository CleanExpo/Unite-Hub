/**
 * Button Component - Phase 2 UI Library
 * Production-ready button with variants, sizes, and accessibility
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-sm font-medium focus:outline-none focus:border-[#00F5FF]/60 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] hover:bg-[#00F5FF]/20 hover:border-[#00F5FF]/60',
        secondary: 'bg-white/[0.04] border border-white/[0.1] text-white/70 hover:bg-white/[0.06] hover:text-white/90',
        danger: 'bg-[#FF4444]/10 border border-[#FF4444]/40 text-[#FF4444] hover:bg-[#FF4444]/20',
        success: 'bg-[#00FF88]/10 border border-[#00FF88]/40 text-[#00FF88] hover:bg-[#00FF88]/20',
        outline: 'bg-transparent border border-white/[0.1] text-white/70 hover:border-white/[0.2] hover:text-white/90',
        ghost: 'bg-transparent text-white/50 hover:bg-white/[0.03] hover:text-white/70',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  children,
  variant,
  size,
  fullWidth,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}

// Named export for compatibility
export { Button };
