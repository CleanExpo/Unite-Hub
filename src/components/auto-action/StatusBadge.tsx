'use client';

/**
 * StatusBadge Component
 *
 * Displays the current status of an auto-action session with appropriate styling.
 */

import { cn } from '@/lib/utils';

export type SessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface StatusBadgeProps {
  status: SessionStatus;
  className?: string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  SessionStatus,
  { label: string; className: string; dotClassName: string }
> = {
  idle: {
    label: 'Idle',
    className: 'bg-muted text-muted-foreground',
    dotClassName: 'bg-muted-foreground',
  },
  running: {
    label: 'Running',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    dotClassName: 'bg-blue-500 animate-pulse',
  },
  paused: {
    label: 'Paused',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    dotClassName: 'bg-yellow-500',
  },
  waiting_approval: {
    label: 'Awaiting Approval',
    className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    dotClassName: 'bg-orange-500 animate-pulse',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
    dotClassName: 'bg-green-500',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
    dotClassName: 'bg-red-500',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground border-border',
    dotClassName: 'bg-muted-foreground',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const dotSizeConfig = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function StatusBadge({
  status,
  className,
  showDot = true,
  size = 'md',
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        sizeConfig[size],
        config.className,
        className
      )}
    >
      {showDot && (
        <span
          className={cn('rounded-full', dotSizeConfig[size], config.dotClassName)}
        />
      )}
      {config.label}
    </span>
  );
}

export default StatusBadge;
