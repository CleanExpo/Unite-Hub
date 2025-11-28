'use client';

/**
 * OnboardingAssistantPanel Component
 *
 * Main panel for the auto-action onboarding assistant.
 * Displays current status, progress, action log, and approval requests.
 */

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RefreshCw, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type SessionStatus } from './StatusBadge';
import { CriticalPointBanner, type CriticalPointData } from './CriticalPointBanner';
import { ActionLogViewer, type LogEntry } from './ActionLogViewer';

interface OnboardingAssistantPanelProps {
  flowType: 'client' | 'staff' | 'crm';
  workspaceId: string;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  className?: string;
}

interface SessionProgress {
  taskId: string;
  status: SessionStatus;
  currentStep: number;
  totalSteps: number;
  progress: number;
  pendingApproval: CriticalPointData | null;
  errors: string[];
  startedAt: string;
  updatedAt: string;
}

export function OnboardingAssistantPanel({
  flowType,
  workspaceId,
  onSessionStart,
  onSessionEnd,
  className,
}: OnboardingAssistantPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch session status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auto-action/session', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setProgress(data.progress);
      }
    } catch (err) {
      console.error('Failed to fetch session status:', err);
    }
  }, []);

  // Poll for status updates when running
  useEffect(() => {
    if (progress?.status === 'running' || progress?.status === 'waiting_approval') {
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [progress?.status, fetchStatus]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Fetch logs for current session
  const fetchLogs = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(
        `/api/auto-action/logs?sessionId=${sessionId}&includeEntries=true`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.session?.entries) {
          setLogEntries(data.session.entries);
        }
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, [sessionId]);

  // Fetch logs when session changes or periodically
  useEffect(() => {
    if (sessionId) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [sessionId, fetchLogs]);

  // Start session
  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const flowIdMap = {
        client: 'client_onboarding_standard',
        staff: 'staff_onboarding_standard',
        crm: 'crm_contact_autofill',
      };

      const response = await fetch('/api/auto-action/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId: flowIdMap[flowType],
          workspaceId,
          data: {}, // Would be filled from a form in real usage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start session');
      }

      onSessionStart?.();
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop session
  const handleStop = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auto-action/session', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        onSessionEnd?.();
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to stop session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approval
  const handleApprove = async (criticalPointId: string, note?: string) => {
    try {
      const response = await fetch('/api/auto-action/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criticalPointId,
          approved: true,
          note,
        }),
      });

      if (response.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  // Handle rejection
  const handleReject = async (criticalPointId: string, note?: string) => {
    try {
      const response = await fetch('/api/auto-action/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criticalPointId,
          approved: false,
          note,
        }),
      });

      if (response.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const flowTitles = {
    client: 'Client Onboarding Assistant',
    staff: 'Staff Onboarding Assistant',
    crm: 'CRM Auto-Fill Assistant',
  };

  const flowDescriptions = {
    client: 'Automatically fill in client onboarding forms with the provided data.',
    staff: 'Automatically complete staff onboarding workflows.',
    crm: 'Automatically populate CRM records with contact information.',
  };

  return (
    <div className={cn('bg-card border border-border rounded-lg', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{flowTitles[flowType]}</h2>
          <StatusBadge status={progress?.status || 'idle'} />
        </div>
        <p className="text-sm text-muted-foreground">{flowDescriptions[flowType]}</p>
      </div>

      {/* Progress Bar */}
      {progress && progress.status !== 'idle' && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {progress.currentStep} / {progress.totalSteps} steps ({progress.progress}%)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                progress.status === 'completed'
                  ? 'bg-green-500'
                  : progress.status === 'failed'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
              )}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Critical Point Banner */}
      {progress?.pendingApproval && (
        <div className="p-4 border-b border-border">
          <CriticalPointBanner
            criticalPoint={progress.pendingApproval}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      )}

      {/* Action Log */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-2">Action Log</h3>
        <ActionLogViewer entries={logEntries} maxHeight={250} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b border-border">
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 flex items-center gap-3">
        {!progress || progress.status === 'idle' || progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled' ? (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Play className="w-4 h-4" />
            Start Assistant
          </button>
        ) : (
          <>
            {progress.status === 'paused' ? (
              <button
                onClick={() => {/* Resume logic */}}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md',
                  'bg-blue-500 text-white',
                  'hover:bg-blue-600 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            ) : (
              <button
                onClick={() => {/* Pause logic */}}
                disabled={isLoading || progress.status === 'waiting_approval'}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md',
                  'bg-yellow-500 text-white',
                  'hover:bg-yellow-600 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            <button
              onClick={handleStop}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md',
                'bg-red-500 text-white',
                'hover:bg-red-600 transition-colors',
                'disabled:opacity-50'
              )}
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          </>
        )}

        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md',
            'bg-muted text-muted-foreground',
            'hover:bg-muted/80 transition-colors',
            'disabled:opacity-50'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>

        <div className="flex-1" />

        <button
          className={cn(
            'p-2 rounded-md',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-muted transition-colors'
          )}
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          className={cn(
            'p-2 rounded-md',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-muted transition-colors'
          )}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default OnboardingAssistantPanel;
