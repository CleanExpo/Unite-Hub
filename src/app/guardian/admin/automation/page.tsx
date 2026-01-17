'use client';

/**
 * Guardian Z13: Automation Console
 * Manage schedules, triggers, and view execution history
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Schedule {
  id: string;
  schedule_key: string;
  title: string;
  is_active: boolean;
  cadence: string;
  task_types: string[];
  last_run_at?: string;
  next_run_at?: string;
}

interface Trigger {
  id: string;
  trigger_key: string;
  title: string;
  is_active: boolean;
  metric_key: string;
  comparator: string;
  threshold: any;
  last_fired_at?: string;
}

interface Execution {
  id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  schedule_id?: string;
  trigger_id?: string;
  task_types: string[];
  summary: any;
}

export default function AutomationConsolePage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [activeTab, setActiveTab] = useState<'schedules' | 'triggers' | 'executions'>('schedules');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showTriggerForm, setShowTriggerForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [workspaceId, activeTab]);

  const loadData = async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      if (activeTab === 'schedules') {
        const res = await fetch(`/api/guardian/meta/automation/schedules?workspaceId=${workspaceId}`);
        const data = await res.json();
        setSchedules(data.schedules || []);
      } else if (activeTab === 'triggers') {
        const res = await fetch(`/api/guardian/meta/automation/triggers?workspaceId=${workspaceId}`);
        const data = await res.json();
        setTriggers(data.triggers || []);
      } else if (activeTab === 'executions') {
        const res = await fetch(`/api/guardian/meta/automation/executions?workspaceId=${workspaceId}&limit=50`);
        const data = await res.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScheduler = async () => {
    try {
      const res = await fetch(`/api/guardian/meta/automation/run-scheduler?workspaceId=${workspaceId}`, {
        method: 'POST',
      });
      const data = await res.json();
      alert(`Scheduler executed: ${data.executed} schedules ran`);
      loadData();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const handleRunTriggers = async () => {
    try {
      const res = await fetch(`/api/guardian/meta/automation/run-triggers?workspaceId=${workspaceId}`, {
        method: 'POST',
      });
      const data = await res.json();
      alert(`Triggers evaluated: ${data.fired} triggers fired`);
      loadData();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="border-b">
        <h1 className="text-2xl font-bold mb-4">Automation Console</h1>
        <p className="text-text-secondary mb-4">
          Manage meta automation schedules, triggers, and execution history. All automation is meta-only and does not affect core Guardian runtime.
        </p>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2 rounded ${activeTab === 'schedules' ? 'bg-accent-500 text-white' : 'bg-bg-card'}`}
          >
            Schedules
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`px-4 py-2 rounded ${activeTab === 'triggers' ? 'bg-accent-500 text-white' : 'bg-bg-card'}`}
          >
            Triggers
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`px-4 py-2 rounded ${activeTab === 'executions' ? 'bg-accent-500 text-white' : 'bg-bg-card'}`}
          >
            Executions
          </button>
        </div>
      </div>

      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600"
            >
              {showScheduleForm ? 'Cancel' : '+ Create Schedule'}
            </button>
            <button
              onClick={handleRunScheduler}
              className="px-4 py-2 bg-bg-card rounded hover:bg-bg-secondary"
            >
              Run Scheduler Now
            </button>
          </div>

          {showScheduleForm && (
            <div className="p-4 bg-bg-card rounded border">
              <p className="text-sm text-text-secondary mb-4">Create New Schedule</p>
              <p className="text-sm">Form: Schedule Key, Title, Cadence (hourly/daily/weekly/monthly), Task Types...</p>
              {/* Form implementation */}
            </div>
          )}

          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-4 bg-bg-card rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{schedule.title}</h3>
                    <p className="text-sm text-text-secondary">{schedule.schedule_key}</p>
                    <p className="text-sm mt-2">
                      Cadence: <span className="font-mono">{schedule.cadence}</span>
                    </p>
                    <p className="text-sm">Tasks: {schedule.task_types.join(', ')}</p>
                    {schedule.next_run_at && (
                      <p className="text-xs text-text-secondary mt-1">
                        Next run: {new Date(schedule.next_run_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${schedule.is_active ? 'bg-success-100 text-success-900' : 'bg-bg-hover text-text-primary'}`}>
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'triggers' && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowTriggerForm(!showTriggerForm)}
              className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600"
            >
              {showTriggerForm ? 'Cancel' : '+ Create Trigger'}
            </button>
            <button
              onClick={handleRunTriggers}
              className="px-4 py-2 bg-bg-card rounded hover:bg-bg-secondary"
            >
              Run Triggers Now
            </button>
          </div>

          {showTriggerForm && (
            <div className="p-4 bg-bg-card rounded border">
              <p className="text-sm text-text-secondary mb-4">Create New Trigger</p>
              <p className="text-sm">Form: Trigger Key, Title, Metric Key, Comparator, Threshold, Actions...</p>
              {/* Form implementation */}
            </div>
          )}

          <div className="space-y-2">
            {triggers.map((trigger) => (
              <div key={trigger.id} className="p-4 bg-bg-card rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{trigger.title}</h3>
                    <p className="text-sm text-text-secondary">{trigger.trigger_key}</p>
                    <p className="text-sm mt-2">
                      {trigger.metric_key} {trigger.comparator} {JSON.stringify(trigger.threshold)}
                    </p>
                    {trigger.last_fired_at && (
                      <p className="text-xs text-text-secondary mt-1">
                        Last fired: {new Date(trigger.last_fired_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${trigger.is_active ? 'bg-success-100 text-success-900' : 'bg-bg-hover text-text-primary'}`}>
                    {trigger.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'executions' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Started</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Tasks</th>
                  <th className="text-left p-2">Summary</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec) => (
                  <tr key={exec.id} className="border-b hover:bg-bg-card">
                    <td className="p-2 text-xs">{new Date(exec.started_at).toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 text-xs rounded ${exec.status === 'completed' ? 'bg-success-100' : exec.status === 'failed' ? 'bg-error-100' : 'bg-warning-100'}`}>
                        {exec.status}
                      </span>
                    </td>
                    <td className="p-2 text-xs">{exec.task_types.join(', ')}</td>
                    <td className="p-2 text-xs text-text-secondary">{JSON.stringify(exec.summary).substring(0, 50)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && <div className="text-center text-text-secondary">Loading...</div>}
    </div>
  );
}
