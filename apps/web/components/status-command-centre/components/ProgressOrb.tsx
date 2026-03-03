'use client';

/**
 * ProgressOrb - Circular progress indicator with glow effect
 * Elite Command Centre component with industrial luxury aesthetic
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, ORB_SIZES } from '../constants';
import type { ProgressOrbProps } from '../types';

const ProgressOrb = React.forwardRef<HTMLDivElement, ProgressOrbProps>(
  (
    {
      value,
      size = 'md',
      status,
      showLabel = true,
      glow = true,
      animation = STATUS_CONFIG[status]?.animation ?? 'none',
      className,
    },
    ref
  ) => {
    const config = STATUS_CONFIG[status];
    const sizeConfig = ORB_SIZES[size];
    const clampedValue = Math.min(100, Math.max(0, value));

    // SVG calculations
    const strokeWidth = sizeConfig.strokeWidth;
    const radius = (sizeConfig.size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

    // Determine animation class
    const getAnimationClass = () => {
      if (animation === 'spin') return 'animate-orb-rotate';
      if (animation === 'pulse') return 'animate-orb-pulse';
      return '';
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{
          width: sizeConfig.size,
          height: sizeConfig.size,
          // @ts-expect-error CSS custom properties
          '--status-primary': config.colour.primary.replace('hsl(', '').replace(')', ''),
          '--status-glow': config.colour.glow.replace('hsl(', '').replace(')', ''),
        }}
      >
        {/* Background glow effect */}
        {glow && (
          <div
            className={cn(
              'absolute inset-0 rounded-full opacity-30 blur-xl',
              animation !== 'none' && 'animate-status-glow'
            )}
            style={{ backgroundColor: config.colour.primary }}
          />
        )}

        {/* SVG Progress Ring */}
        <svg
          className={cn('-rotate-90 transform', getAnimationClass())}
          width={sizeConfig.size}
          height={sizeConfig.size}
        >
          {/* Background track */}
          <circle
            cx={sizeConfig.size / 2}
            cy={sizeConfig.size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />

          {/* Progress arc */}
          <circle
            cx={sizeConfig.size / 2}
            cy={sizeConfig.size / 2}
            r={radius}
            fill="none"
            stroke={config.colour.primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            style={{
              filter: glow ? `drop-shadow(0 0 6px ${config.colour.glow})` : undefined,
            }}
          />

          {/* Outer decorative ring */}
          <circle
            cx={sizeConfig.size / 2}
            cy={sizeConfig.size / 2}
            r={radius + strokeWidth / 2 + 2}
            fill="none"
            stroke={config.colour.primary}
            strokeWidth={1}
            strokeDasharray="4 8"
            className={cn('opacity-40', animation === 'spin' && 'animate-orb-rotate')}
          />
        </svg>

        {/* Inner orb with gradient */}
        <div
          className={cn('absolute rounded-full', animation === 'pulse' && 'animate-orb-pulse')}
          style={{
            width: radius * 1.2,
            height: radius * 1.2,
            background: `radial-gradient(circle at 30% 30%, ${config.colour.primary}, transparent 70%)`,
            opacity: 0.3,
          }}
        />

        {/* Center content */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn('font-mono font-bold tabular-nums', sizeConfig.fontSize)}
              style={{ color: config.colour.primary }}
            >
              {Math.round(clampedValue)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

ProgressOrb.displayName = 'ProgressOrb';

export { ProgressOrb };
