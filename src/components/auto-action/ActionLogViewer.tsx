'use client';

/**
 * ActionLogViewer Component
 *
 * Displays a scrollable log of actions taken during an auto-action session.
 */

import { useRef, useEffect } from 'react';
import {
  MousePointer2,
  Type,
  ArrowDownCircle,
  Navigation,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  eventType: string;
  message: string;
  action?: {
    type: string;
    confidence: number;
  };
  criticalPoint?: {
    id: string;
    category: string;
    risk: string;
  };
  error?: {
    name: string;
    message: string;
  };
}

interface ActionLogViewerProps {
  entries: LogEntry[];
  maxHeight?: number;
  autoScroll?: boolean;
  className?: string;
}

const eventTypeIcons: Record<string, typeof MousePointer2> = {
  action_executed: CheckCircle,
  action_failed: XCircle,
  action_planned: MousePointer2,
  critical_point_detected: ShieldAlert,
  approval_requested: AlertTriangle,
  approval_received: CheckCircle,
  approval_timeout: Clock,
  session_start: Navigation,
  session_end: CheckCircle,
  task_progress: Loader2,
  task_complete: CheckCircle,
  error: XCircle,
};

const actionTypeIcons: Record<string, typeof MousePointer2> = {
  click: MousePointer2,
  type: Type,
  scroll: ArrowDownCircle,
  navigate: Navigation,
  wait: Clock,
};

const levelColors: Record<string, string> = {
  debug: 'text-muted-foreground',
  info: 'text-blue-500',
  warn: 'text-yellow-500',
  error: 'text-red-500',
};

export function ActionLogViewer({
  entries,
  maxHeight = 400,
  autoScroll = true,
  className,
}: ActionLogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getIcon = (entry: LogEntry) => {
    if (entry.action?.type) {
      return actionTypeIcons[entry.action.type] || MousePointer2;
    }
    return eventTypeIcons[entry.eventType] || CheckCircle;
  };

  return (
    <div
      ref={scrollRef}
      style={{ maxHeight }}
      className={cn(
        'overflow-y-auto bg-card border border-border rounded-lg',
        className
      )}
    >
      {entries.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          No actions logged yet
        </div>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => {
            const Icon = getIcon(entry);
            const levelColor = levelColors[entry.level];

            return (
              <div
                key={entry.id}
                className={cn(
                  'p-3 hover:bg-muted/50 transition-colors',
                  entry.level === 'error' && 'bg-red-500/5'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      'p-1.5 rounded-full shrink-0 mt-0.5',
                      entry.level === 'error'
                        ? 'bg-red-500/10'
                        : entry.level === 'warn'
                          ? 'bg-yellow-500/10'
                          : 'bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5',
                        levelColor
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatTime(entry.timestamp)}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          entry.level === 'error'
                            ? 'bg-red-500/10 text-red-500'
                            : entry.level === 'warn'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {entry.eventType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-sm text-foreground">{entry.message}</p>

                    {/* Action details */}
                    {entry.action && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Action: {entry.action.type}</span>
                        <span>
                          Confidence: {Math.round(entry.action.confidence * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Critical point details */}
                    {entry.criticalPoint && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded',
                            entry.criticalPoint.risk === 'critical'
                              ? 'bg-red-500/10 text-red-500'
                              : entry.criticalPoint.risk === 'high'
                                ? 'bg-orange-500/10 text-orange-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                          )}
                        >
                          {entry.criticalPoint.risk} risk
                        </span>
                        <span className="text-muted-foreground">
                          {entry.criticalPoint.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    {/* Error details */}
                    {entry.error && (
                      <div className="mt-1.5 p-2 bg-red-500/5 rounded text-xs">
                        <p className="text-red-500 font-medium">
                          {entry.error.name}: {entry.error.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ActionLogViewer;
