'use client';

/**
 * ProgressRing - SVG ring progress indicator
 * Elite Command Centre component - simpler variant of ProgressOrb
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '../constants';
import type { ProgressRingProps } from '../types';

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ value, strokeWidth = 4, size = 48, status, animated = true, children, className }, ref) => {
    const config = STATUS_CONFIG[status];
    const clampedValue = Math.min(100, Math.max(0, value));

    // SVG calculations
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          className="-rotate-90 transform"
          width={size}
          height={size}
          style={
            {
              '--ring-circumference': circumference,
              '--ring-offset': strokeDashoffset,
            } as React.CSSProperties
          }
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />

          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.colour.primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(animated && 'transition-[stroke-dashoffset] duration-500 ease-out')}
          />
        </svg>

        {/* Center content slot */}
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        )}
      </div>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';

export { ProgressRing };
