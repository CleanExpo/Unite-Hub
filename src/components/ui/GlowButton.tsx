/**
 * Glow Button Component
 * Button with hover glow effect for modern UI
 */

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  glowColor?: string;
}

export function GlowButton({
  children,
  variant = 'primary',
  glowColor,
  className,
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={cn(
        'relative px-6 py-3 rounded-lg font-medium transition-all',
        'border border-[rgba(255,255,255,0.08)]',
        'hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
        'hover:-translate-y-0.5',
        variant === 'primary' && 'bg-[var(--accent,#3b82f6)] text-white',
        variant === 'secondary' && 'bg-transparent text-[var(--accent,#3b82f6)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
