'use client';

/**
 * StatusBadge - Animated status badge with icon
 * Elite Command Centre component
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Clock,
  Activity,
  Eye,
  ScanLine,
  CheckCircle,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { STATUS_CONFIG, BADGE_SIZES } from '../constants';
import type { StatusBadgeProps, AgentRunStatus } from '../types';

// Icon mapping
const STATUS_ICONS: Record<AgentRunStatus, React.ElementType> = {
  pending: Clock,
  in_progress: Activity,
  awaiting_verification: Eye,
  verification_in_progress: ScanLine,
  verification_passed: CheckCircle,
  verification_failed: XCircle,
  completed: CheckCircle2,
  failed: XCircle,
  blocked: AlertTriangle,
  escalated_to_human: UserCheck,
};

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, animated = true, size = 'md', className }, ref) => {
    const config = STATUS_CONFIG[status];
    const sizeConfig = BADGE_SIZES[size];
    const Icon = STATUS_ICONS[status];

    // Determine if icon should spin (for in-progress states)
    const shouldSpin =
      animated && (status === 'in_progress' || status === 'verification_in_progress');

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
          sizeConfig.padding,
          sizeConfig.fontSize,
          animated && config.intensity !== 'idle' && 'animate-badge-pulse',
          className
        )}
        style={{
          backgroundColor: config.colour.background,
          color: config.colour.primary,
          // @ts-expect-error CSS custom properties
          '--status-glow': config.colour.glow.replace('hsl(', '').replace(')', ''),
        }}
      >
        {/* Icon with optional spin */}
        {shouldSpin ? (
          <Loader2
            size={sizeConfig.iconSize}
            className="animate-spin"
            style={{ color: config.colour.primary }}
          />
        ) : (
          <Icon size={sizeConfig.iconSize} style={{ color: config.colour.primary }} />
        )}

        {/* Label */}
        <span>{config.label}</span>
      </div>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
