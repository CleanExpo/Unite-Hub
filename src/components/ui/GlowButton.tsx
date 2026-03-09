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
  glowColor: _glowColor,
  className,
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={cn(
        'relative px-6 py-3 rounded-sm font-medium transition-all',
        'border border-white/[0.08]',
        'hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]',
        'hover:-translate-y-0.5',
        variant === 'primary' && 'bg-[#00F5FF] text-[#050505]',
        variant === 'secondary' && 'bg-transparent text-[#00F5FF]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
