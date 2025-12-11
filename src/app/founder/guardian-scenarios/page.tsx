'use client';

import { useEffect, useState } from 'react';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  category: string;
  config: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

interface ScenarioRun {
  id: string;
  scenario_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  summary: string | null;
  metrics: Record<string, any>;
  created_at: string;
}

interface ScenarioRunEvent {
  id: string;
  run_id: string;
  step_index: number;
  phase: string;
  level: string;
  message: string;
  payload: Record<string, any>;
  created_at: string;
}

export default function GuardianScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [runs, setRuns] = useState<ScenarioRun[]>([]);
  const [events, setEvents] = useState<ScenarioRunEvent[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (opts?: { scenarioId?: string | null; runId?: string | null }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (opts?.scenarioId) {
params.set('scenarioId', opts.scenarioId);
}
      if (opts?.runId) {
params.set('runId', opts.runId);
}
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/founder/guardian/scenarios${qs}`);
      if (!res.ok) {
throw new Error('Failed to fetch scenario data');
}
      const data = await res.json();
      setScenarios(data.scenarios || []);
      setRuns(data.runs || []);
      setEvents(data.events || []);
      setActiveScenarioId(data.activeScenarioId || null);
      setActiveRunId(data.activeRunId || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warn':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'outage':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'schema_drift':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'agent_failure':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'traffic_spike':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'security':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'compliance':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const activeRun = runs.find((r) => r.id === activeRunId);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Guardian Scenario Simulator</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Guardian Scenario Simulator</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Guardian Scenario Simulator</h1>
        <p className="text-gray-600">
          Browse predefined risk scenarios and inspect simulated runs for outages, schema drift, agent failures, and more
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
          No Guardian scenarios have been defined yet. Once scenarios are created and runs are executed, they will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_3fr] gap-6">
          {/* Scenarios Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Scenarios</h2>
            <div className="bg-white border border-gray-200 rounded max-h-[480px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scenarios.map((scenario) => {
                    const selected = scenario.id === activeScenarioId;
                    return (
                      <tr
                        key={scenario.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selected ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => load({ scenarioId: selected ? null : scenario.id })}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {scenario.name}
                          </div>
                          {scenario.description && (
                            <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                              {scenario.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border capitalize ${getCategoryColor(
                              scenario.category
                            )}`}
                          >
                            {scenario.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                              scenario.is_active
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {scenario.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {activeScenario && (
              <div className="bg-white border border-gray-200 rounded p-4 space-y-2">
                <div className="text-sm font-semibold text-gray-900">Scenario Config</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Created: {new Date(activeScenario.created_at).toLocaleString()}</div>
                  {activeScenario.created_by && <div>By: {activeScenario.created_by}</div>}
                </div>
                <pre className="text-xs text-gray-600 max-h-40 overflow-auto bg-gray-50 p-2 rounded">
                  {JSON.stringify(activeScenario.config, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Runs Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Scenario Runs</h2>
            {!activeScenarioId || runs.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
                {!activeScenarioId
                  ? 'Select a scenario to view its runs'
                  : 'No runs executed for this scenario yet'}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded max-h-[480px] overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Started</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {runs.map((run) => {
                      const selected = run.id === activeRunId;
                      return (
                        <tr
                          key={run.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() =>
                            load({ scenarioId: activeScenarioId, runId: selected ? null : run.id })
                          }
                        >
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {run.started_at
                              ? new Date(run.started_at).toLocaleString()
                              : new Date(run.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium border capitalize ${getStatusColor(
                                run.status
                              )}`}
                            >
                              {run.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">
                            {run.summary || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeRun && (
              <div className="bg-white border border-gray-200 rounded p-4 space-y-2">
                <div className="text-sm font-semibold text-gray-900">Run Metrics</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Status: {activeRun.status}</div>
                  {activeRun.started_at && (
                    <div>Started: {new Date(activeRun.started_at).toLocaleString()}</div>
                  )}
                  {activeRun.completed_at && (
                    <div>Completed: {new Date(activeRun.completed_at).toLocaleString()}</div>
                  )}
                </div>
                {activeRun.metrics && Object.keys(activeRun.metrics).length > 0 && (
                  <pre className="text-xs text-gray-600 max-h-40 overflow-auto bg-gray-50 p-2 rounded">
                    {JSON.stringify(activeRun.metrics, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Events Timeline Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Run Timeline</h2>
            {!activeRunId || events.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
                {!activeRunId
                  ? 'Select a scenario run to view its timeline'
                  : 'No events captured for this run'}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded max-h-[520px] overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Step</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phase</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Level</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Message & Payload
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap align-top">
                          <div>#{event.step_index}</div>
                          <div className="mt-1">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 align-top">
                          {event.phase}
                        </td>
                        <td className="px-4 py-3 text-sm align-top">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getLevelColor(
                              event.level
                            )}`}
                          >
                            {event.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 align-top">
                          <div className="font-medium mb-1">{event.message}</div>
                          {Object.keys(event.payload).length > 0 && (
                            <pre className="text-xs text-gray-500 max-h-32 overflow-auto bg-gray-50 p-2 rounded">
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
