'use client';

/**
 * StatusPulse - Live heartbeat indicator with concentric rings
 * Elite Command Centre component
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, PULSE_SIZES } from '../constants';
import type { StatusPulseProps } from '../types';

const StatusPulse = React.forwardRef<HTMLDivElement, StatusPulseProps>(
  ({ status, intensity, size = 'sm', className }, ref) => {
    const config = STATUS_CONFIG[status];
    const sizeConfig = PULSE_SIZES[size];
    const effectiveIntensity = intensity ?? config.intensity;

    // Determine animation class based on intensity
    const getAnimationClass = () => {
      switch (effectiveIntensity) {
        case 'urgent':
          return 'animate-pulse-ring-urgent';
        case 'active':
          return 'animate-pulse-ring-active';
        default:
          return 'animate-pulse-ring';
      }
    };

    // Generate ring elements
    const rings = Array.from({ length: sizeConfig.ringCount }, (_, i) => (
      <div
        key={i}
        className={cn('absolute rounded-full', getAnimationClass())}
        style={{
          width: sizeConfig.size,
          height: sizeConfig.size,
          backgroundColor: config.colour.primary,
          animationDelay: `${i * 0.3}s`,
        }}
      />
    ));

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{
          width: sizeConfig.size * 2.5,
          height: sizeConfig.size * 2.5,
        }}
      >
        {/* Pulsing rings */}
        {rings}

        {/* Static centre dot */}
        <div
          className="absolute z-10 rounded-full"
          style={{
            width: sizeConfig.size,
            height: sizeConfig.size,
            backgroundColor: config.colour.primary,
            boxShadow: `0 0 8px ${config.colour.glow}`,
          }}
        />
      </div>
    );
  }
);

StatusPulse.displayName = 'StatusPulse';

export { StatusPulse };
