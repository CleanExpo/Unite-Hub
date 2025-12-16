'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { ButtonHTMLAttributes } from 'react';

interface IndustrialButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * IndustrialButton - Heavy metal-inspired button component
 *
 * Features:
 * - Rust gradient background (primary variant)
 * - Metal outset shadow for 3D effect
 * - Uppercase text with tracking for industrial feel
 * - Hover and active states with visual feedback
 * - Loading state support
 *
 * Variants:
 * - primary: Rust gradient (default, for primary actions)
 * - secondary: Metal surface (for secondary actions)
 * - danger: Red rust tones (for destructive actions)
 *
 * @example
 * ```tsx
 * <IndustrialButton variant="primary" size="lg">
 *   Activate System
 * </IndustrialButton>
 * ```
 */
export function IndustrialButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: IndustrialButtonProps) {
  const baseStyles =
    'uppercase font-bold tracking-wider rounded-xl shadow-metal-outset transition-all duration-200';

  const variantStyles = {
    primary: 'bg-rust-gradient-vertical text-white hover:shadow-rust-glow active:shadow-metal-inset',
    secondary: 'bg-industrial-metal text-industrial-text border border-white/10 hover:bg-industrial-metal-light active:shadow-metal-inset',
    danger: 'bg-gradient-to-b from-industrial-rust-dark to-industrial-rust text-white hover:shadow-rust-glow active:shadow-metal-inset',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      data-theme="industrial"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⟳</span>
          {children}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
