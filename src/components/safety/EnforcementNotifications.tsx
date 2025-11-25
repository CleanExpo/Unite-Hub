'use client';

/**
 * EnforcementNotifications - Real-time enforcement alerts
 *
 * Displays:
 * - Toast notifications for enforcement events
 * - Hard-halt events pinned to top
 * - Auto-dismiss after 10 seconds (except hard-halt)
 * - One-click navigation to safety dashboard
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, AlertOctagon, Bell, X } from 'lucide-react';

export interface EnforcementNotification {
  id: string;
  action: string;
  severity: number;
  message: string;
  timestamp: string;
  affectedSystems?: string[];
}

interface EnforcementNotificationsProps {
  notifications?: EnforcementNotification[];
  onDismiss?: (id: string) => void;
}

export const EnforcementNotifications: React.FC<EnforcementNotificationsProps> = ({
  notifications = [],
  onDismiss,
}) => {
  const [displayedNotifications, setDisplayedNotifications] = useState<EnforcementNotification[]>([]);

  // Update displayed notifications
  useEffect(() => {
    setDisplayedNotifications(notifications);

    // Auto-dismiss non-critical notifications after 10 seconds
    const timers = notifications
      .filter(n => n.severity < 5) // Don't auto-dismiss critical (S5) alerts
      .map(n => {
        return setTimeout(() => {
          if (onDismiss) {
            onDismiss(n.id);
          }
          setDisplayedNotifications(prev => prev.filter(notif => notif.id !== n.id));
        }, 10000);
      });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, onDismiss]);

  const getSeverityColor = (severity: number) => {
    if (severity >= 5)
      return 'bg-red-600 border-red-700 dark:bg-red-900 dark:border-red-800';
    if (severity >= 4)
      return 'bg-orange-600 border-orange-700 dark:bg-orange-900 dark:border-orange-800';
    if (severity >= 3)
      return 'bg-yellow-600 border-yellow-700 dark:bg-yellow-900 dark:border-yellow-800';
    return 'bg-blue-600 border-blue-700 dark:bg-blue-900 dark:border-blue-800';
  };

  const getSeverityIcon = (severity: number) => {
    if (severity >= 5) return <AlertOctagon className="w-5 h-5" />;
    if (severity >= 4) return <AlertCircle className="w-5 h-5" />;
    if (severity >= 3) return <AlertTriangle className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 5) return 'CRITICAL';
    if (severity >= 4) return 'HIGH';
    if (severity >= 3) return 'WARN';
    return 'INFO';
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'halt_autonomy':
        return 'Autonomy Halted';
      case 'pause_workflow':
        return 'Workflow Paused';
      case 'block_agent':
        return 'Agent Blocked';
      case 'throttle':
        return 'Operations Throttled';
      case 'require_approval':
        return 'Approval Required';
      case 'override':
        return 'Execution Overridden';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  // Separate critical (S5) from other notifications
  const criticalNotifications = displayedNotifications.filter(n => n.severity >= 5);
  const otherNotifications = displayedNotifications.filter(n => n.severity < 5);

  // Sort by timestamp (newest first)
  const sortedNotifications = [...otherNotifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      {/* Critical notifications - pinned to top */}
      {criticalNotifications.map(notification => (
        <div
          key={notification.id}
          className={`rounded-lg border-2 p-4 text-white shadow-lg animate-pulse ${getSeverityColor(notification.severity)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getSeverityIcon(notification.severity)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold">
                  {getActionLabel(notification.action)}
                </p>
                <span className="text-xs font-bold px-2 py-1 bg-white/20 rounded">
                  {getSeverityLabel(notification.severity)}
                </span>
              </div>
              <p className="text-sm mt-1">{notification.message}</p>
              {notification.affectedSystems && notification.affectedSystems.length > 0 && (
                <p className="text-xs mt-2 opacity-90">
                  Affected: {notification.affectedSystems.join(', ')}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <a
                  href="/founder/safety"
                  className="text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
                >
                  Go to Dashboard
                </a>
                <button
                  onClick={() => {
                    if (onDismiss) onDismiss(notification.id);
                    setDisplayedNotifications(prev =>
                      prev.filter(n => n.id !== notification.id)
                    );
                  }}
                  className="text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                if (onDismiss) onDismiss(notification.id);
                setDisplayedNotifications(prev =>
                  prev.filter(n => n.id !== notification.id)
                );
              }}
              className="flex-shrink-0 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Regular notifications */}
      {sortedNotifications.slice(0, 3).map(notification => (
        <div
          key={notification.id}
          className={`rounded-lg border p-3 text-white shadow-md transition-all hover:shadow-lg ${getSeverityColor(
            notification.severity
          )}`}
        >
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {getSeverityIcon(notification.severity)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">
                  {getActionLabel(notification.action)}
                </p>
                <span className="text-xs font-bold px-1.5 py-0.5 bg-white/20 rounded">
                  {getSeverityLabel(notification.severity)}
                </span>
              </div>
              <p className="text-xs mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => {
                if (onDismiss) onDismiss(notification.id);
                setDisplayedNotifications(prev =>
                  prev.filter(n => n.id !== notification.id)
                );
              }}
              className="flex-shrink-0 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Notification count overflow indicator */}
      {sortedNotifications.length > 3 && (
        <div className="text-center text-xs text-gray-600 dark:text-gray-400">
          +{sortedNotifications.length - 3} more notification{sortedNotifications.length - 3 !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
