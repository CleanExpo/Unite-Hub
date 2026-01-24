'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '@/hooks/useWorkspace';

// ============================================================================
// Types
// ============================================================================

interface TimeEntry {
  id: string;
  workspace_id: string;
  project_id: string | null;
  task_id: string | null;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  description: string | null;
  billable: boolean;
  hourly_rate: number | null;
  tags: string[];
  project?: { id: string; name: string } | null;
}

interface ActiveTimer {
  id: string;
  started_at: string;
  description: string | null;
  project_id: string | null;
}

interface TimeSummary {
  totalHours: number;
  billableHours: number;
  entryCount: number;
}

interface Project {
  id: string;
  name: string;
}

// ============================================================================
// Hooks
// ============================================================================

function useTimeTracking() {
  const { workspaceId } = useWorkspace();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [summary, setSummary] = useState<TimeSummary>({ totalHours: 0, billableHours: 0, entryCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!workspaceId) {
return;
}

    try {
      setLoading(true);
      const res = await fetch(`/api/time-entries?workspaceId=${workspaceId}`);
      if (!res.ok) {
throw new Error('Failed to fetch time entries');
}

      const json = await res.json();
      setEntries(json.data.entries || []);
      setActiveTimer(json.data.activeTimer || null);
      setSummary(json.data.summary || { totalHours: 0, billableHours: 0, entryCount: 0 });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const startTimer = useCallback(async (projectId?: string, description?: string) => {
    if (!workspaceId) {
return false;
}

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_timer',
          workspaceId,
          projectId,
          description,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to start timer');
      }

      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start timer');
      return false;
    }
  }, [workspaceId, fetchData]);

  const stopTimer = useCallback(async (billable = true) => {
    if (!workspaceId) {
return false;
}

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop_timer',
          workspaceId,
          billable,
        }),
      });

      if (!res.ok) {
throw new Error('Failed to stop timer');
}

      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop timer');
      return false;
    }
  }, [workspaceId, fetchData]);

  const createManualEntry = useCallback(async (data: {
    projectId?: string;
    description?: string;
    startedAt: string;
    endedAt?: string;
    durationMinutes?: number;
    billable?: boolean;
  }) => {
    if (!workspaceId) {
return false;
}

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_entry',
          workspaceId,
          ...data,
        }),
      });

      if (!res.ok) {
throw new Error('Failed to create time entry');
}

      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
      return false;
    }
  }, [workspaceId, fetchData]);

  const deleteEntry = useCallback(async (entryId: string) => {
    if (!workspaceId) {
return false;
}

    try {
      const res = await fetch('/api/time-entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, workspaceId }),
      });

      if (!res.ok) {
throw new Error('Failed to delete entry');
}

      await fetchData();
      return true;
    } catch {
      return false;
    }
  }, [workspaceId, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    entries,
    activeTimer,
    summary,
    loading,
    error,
    startTimer,
    stopTimer,
    createManualEntry,
    deleteEntry,
    refetch: fetchData,
  };
}

function useElapsedTime(startTime: string | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const start = new Date(startTime).getTime();

    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// UI Components
// ============================================================================

function TimerDisplay({ elapsed, isRunning }: { elapsed: number; isRunning: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${isRunning ? 'animate-pulse' : ''}`}>
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-red-500' : 'bg-gray-300'}`} />
        {isRunning && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
        )}
      </div>
      <span className="font-mono text-3xl font-semibold text-gray-900">
        {formatDuration(elapsed)}
      </span>
    </div>
  );
}

function StatCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  );
}

function TimeEntryRow({
  entry,
  onDelete,
}: {
  entry: TimeEntry;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 group"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 text-xs text-gray-400">
          {formatDate(entry.started_at)}
        </div>

        <div>
          <p className="font-medium text-gray-900">
            {entry.description || 'No description'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {entry.project && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {entry.project.name}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatTime(entry.started_at)}
              {entry.ended_at && ` - ${formatTime(entry.ended_at)}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {entry.billable && (
          <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
            Billable
          </span>
        )}

        <span className="font-mono text-sm font-medium text-gray-900 w-16 text-right">
          {entry.duration_minutes ? formatMinutes(entry.duration_minutes) : '--'}
        </span>

        <AnimatePresence>
          {showDelete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ManualEntryForm({
  projects,
  onSubmit,
  onCancel,
}: {
  projects: Project[];
  onSubmit: (data: {
    projectId?: string;
    description?: string;
    startedAt: string;
    durationMinutes: number;
    billable: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [billable, setBillable] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectId: projectId || undefined,
      description: description || undefined,
      startedAt: new Date().toISOString(),
      durationMinutes: hours * 60 + minutes,
      billable,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="bg-gray-50 rounded-xl p-4 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="">No project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Duration:</label>
          <input
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
          />
          <span className="text-sm text-gray-500">h</span>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
          />
          <span className="text-sm text-gray-500">m</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">Billable</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          Add Entry
        </button>
      </div>
    </motion.form>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TimeTracker() {
  const {
    entries,
    activeTimer,
    summary,
    loading,
    error,
    startTimer,
    stopTimer,
    createManualEntry,
    deleteEntry,
  } = useTimeTracking();

  const elapsed = useElapsedTime(activeTimer?.started_at || null);
  const [description, setDescription] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [projects] = useState<Project[]>([]); // TODO: Fetch from API

  const handleStartTimer = async () => {
    await startTimer(undefined, description);
    setDescription('');
  };

  const handleStopTimer = async () => {
    await stopTimer(true);
  };

  const handleManualEntry = async (data: {
    projectId?: string;
    description?: string;
    startedAt: string;
    durationMinutes: number;
    billable: boolean;
  }) => {
    const success = await createManualEntry(data);
    if (success) {
      setShowManualEntry(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-xl mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6">
      {/* Header with Timer */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <TimerDisplay elapsed={elapsed} isRunning={!!activeTimer} />

            {!activeTimer && (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="w-64 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                onKeyDown={(e) => e.key === 'Enter' && handleStartTimer()}
              />
            )}

            {activeTimer?.description && (
              <p className="text-gray-600">{activeTimer.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTimer ? (
              <button
                onClick={handleStopTimer}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="5" y="5" width="10" height="10" rx="1" />
                </svg>
                Stop
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Start
              </button>
            )}

            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="p-3 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl transition-colors"
              title="Add manual entry"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Manual Entry Form */}
        <AnimatePresence>
          {showManualEntry && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <ManualEntryForm
                projects={projects}
                onSubmit={handleManualEntry}
                onCancel={() => setShowManualEntry(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Today"
          value={`${summary.totalHours.toFixed(1)}h`}
          subValue={`${summary.entryCount} entries`}
        />
        <StatCard
          label="Billable"
          value={`${summary.billableHours.toFixed(1)}h`}
          subValue={`${summary.totalHours > 0 ? Math.round((summary.billableHours / summary.totalHours) * 100) : 0}% of total`}
        />
        <StatCard
          label="Non-billable"
          value={`${(summary.totalHours - summary.billableHours).toFixed(1)}h`}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Time Entries List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Recent Time Entries</h3>
        </div>

        <div className="px-6 py-2">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No time entries yet</p>
              <p className="text-sm mt-1">Start the timer or add a manual entry</p>
            </div>
          ) : (
            entries.map(entry => (
              <TimeEntryRow
                key={entry.id}
                entry={entry}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeTracker;
