/**
 * Bento Grid Component
 * Modern 12-column grid system with responsive tiles
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  columns?: 'auto' | 12;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BentoGrid({
  children,
  columns = 12,
  gap = 'md',
  className
}: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid w-full',
        columns === 12 && 'grid-cols-12',
        gap === 'sm' && 'gap-3',
        gap === 'md' && 'gap-6',
        gap === 'lg' && 'gap-8',
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoTileProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4 | 6 | 12;
  className?: string;
  glowOnHover?: boolean;
}

export function BentoTile({
  children,
  span = 4,
  className,
  glowOnHover = true
}: BentoTileProps) {
  return (
    <div
      className={cn(
        'bento-tile p-6',
        span === 1 && 'col-span-1',
        span === 2 && 'col-span-2',
        span === 3 && 'col-span-3',
        span === 4 && 'col-span-4',
        span === 6 && 'col-span-6',
        span === 12 && 'col-span-12',
        glowOnHover && 'hover:shadow-glow',
        className
      )}
    >
      {children}
    </div>
  );
}
