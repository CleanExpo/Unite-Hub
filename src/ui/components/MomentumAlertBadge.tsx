'use client';

/**
 * Momentum Alert Badge Component
 * Phase 48: Displays alert status for staff/owner dashboards
 */

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface MomentumAlertBadgeProps {
  total: number;
  critical: number;
  warning: number;
  info: number;
  onClick?: () => void;
}

export function MomentumAlertBadge({
  total,
  critical,
  warning,
  info,
  onClick,
}: MomentumAlertBadgeProps) {
  if (total === 0) {
    return (
      <Badge variant="outline" className="text-green-500 border-green-500">
        All clear
      </Badge>
    );
  }

  const hasCritical = critical > 0;
  const hasWarning = warning > 0;

  const mainColor = hasCritical
    ? 'destructive'
    : hasWarning
    ? 'default'
    : 'secondary';

  const mainIcon = hasCritical ? (
    <AlertCircle className="h-3 w-3 mr-1" />
  ) : hasWarning ? (
    <AlertTriangle className="h-3 w-3 mr-1" />
  ) : (
    <Info className="h-3 w-3 mr-1" />
  );

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
    >
      <Badge variant={mainColor as any} className="flex items-center">
        {mainIcon}
        {total} Alert{total !== 1 ? 's' : ''}
      </Badge>

      {critical > 0 && (
        <span className="text-xs text-red-500 font-medium">
          {critical} critical
        </span>
      )}
    </button>
  );
}

/**
 * Alert List Item for displaying in a list
 */
export interface AlertListItemProps {
  id: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  clientName?: string;
  createdAt: string;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export function AlertListItem({
  id,
  alertType,
  severity,
  title,
  message,
  clientName,
  createdAt,
  onAcknowledge,
  onResolve,
}: AlertListItemProps) {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${getSeverityStyles()}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <div className="mt-0.5">{getSeverityIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{title}</p>
              <Badge variant="outline" className="text-xs">
                {alertType.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{message}</p>
            <div className="flex items-center gap-2 mt-2">
              {clientName && (
                <span className="text-xs font-medium">{clientName}</span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {onAcknowledge && (
            <button
              onClick={() => onAcknowledge(id)}
              className="text-xs text-blue-500 hover:underline"
            >
              Acknowledge
            </button>
          )}
          {onResolve && (
            <button
              onClick={() => onResolve(id)}
              className="text-xs text-green-500 hover:underline"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MomentumAlertBadge;
