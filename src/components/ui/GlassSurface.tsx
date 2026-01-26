/**
 * Glass Surface Component
 * Glassmorphic surfaces with backdrop blur effect
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassSurfaceProps {
  children: React.ReactNode;
  variant?: 'card' | 'panel' | 'modal';
  className?: string;
}

export function GlassSurface({
  children,
  variant = 'card',
  className
}: GlassSurfaceProps) {
  return (
    <div
      className={cn(
        'glassmorphic',
        variant === 'card' && 'p-6',
        variant === 'panel' && 'p-8',
        variant === 'modal' && 'p-10',
        className
      )}
    >
      {children}
    </div>
  );
}
