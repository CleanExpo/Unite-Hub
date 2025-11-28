'use client';

/**
 * Connection Status Badge
 *
 * Displays the connection status of a connected app.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

export type ConnectionStatus = 'active' | 'expired' | 'revoked' | 'error';

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<
  ConnectionStatus,
  {
    label: string;
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
  }
> = {
  active: {
    label: 'Connected',
    icon: CheckCircle2,
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
  },
  expired: {
    label: 'Expired',
    icon: Clock,
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  revoked: {
    label: 'Revoked',
    icon: XCircle,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
  },
};

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
  },
};

export function ConnectionStatusBadge({
  status,
  showLabel = true,
  size = 'md',
  className,
}: ConnectionStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.bgClass,
        config.colorClass,
        sizeStyles.padding,
        sizeStyles.text,
        className
      )}
    >
      <Icon className={sizeStyles.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export default ConnectionStatusBadge;
