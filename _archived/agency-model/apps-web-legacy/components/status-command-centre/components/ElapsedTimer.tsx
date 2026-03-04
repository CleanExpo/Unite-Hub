'use client';

/**
 * ElapsedTimer - Live elapsed time display
 * Elite Command Centre component
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Timer } from 'lucide-react';
import { useElapsedTime } from '../hooks/use-elapsed-time';
import type { ElapsedTimerProps } from '../types';

const SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const;

const ICON_SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
} as const;

const ElapsedTimer = React.forwardRef<HTMLDivElement, ElapsedTimerProps>(
  ({ startTime, endTime, showIcon = true, size = 'md', className }, ref) => {
    const { formatted, isRunning } = useElapsedTime(startTime, endTime ?? null);

    if (!startTime) {
      return (
        <div
          ref={ref}
          className={cn(
            'text-muted-foreground inline-flex items-center gap-1 font-mono',
            SIZE_CLASSES[size],
            className
          )}
        >
          {showIcon && <Clock size={ICON_SIZES[size]} />}
          <span>--:--</span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-mono tabular-nums',
          SIZE_CLASSES[size],
          isRunning ? 'text-foreground' : 'text-muted-foreground',
          className
        )}
      >
        {showIcon && (
          <span className={cn(isRunning && 'animate-connection-pulse')}>
            {isRunning ? (
              <Timer size={ICON_SIZES[size]} className="text-brand-primary" />
            ) : (
              <Clock size={ICON_SIZES[size]} />
            )}
          </span>
        )}
        <span>{formatted}</span>
      </div>
    );
  }
);

ElapsedTimer.displayName = 'ElapsedTimer';

export { ElapsedTimer };
