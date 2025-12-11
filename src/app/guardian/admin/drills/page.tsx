'use client';

/**
 * Guardian War-Games & Training Console
 * Create, manage, and run incident drills
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Drill {
  id: string;
  name: string;
  description?: string;
  difficulty: string;
  source_type: string;
  is_active: boolean;
  created_at: string;
}

interface DrillRun {
  id: string;
  drill_id: string;
  started_at: string;
  finished_at?: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled';
  operator_id?: string;
  team_name?: string;
  total_events: number;
  responded_events: number;
  score?: Record<string, unknown>;
}

export default function DrillsPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [activeTab, setActiveTab] = useState('library');
  const [drills, setDrills] = useState<Drill[]>([]);
  const [_runs, _setRuns] = useState<DrillRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [_selectedRun, _setSelectedRun] = useState<DrillRun | null>(null);
  const [_showCreateDialog, _setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
return;
}
    loadDrills();
  }, [workspaceId]);

  async function loadDrills() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/guardian/admin/drills?workspaceId=${workspaceId}&isActive=true`);
      if (!res.ok) {
throw new Error('Failed to load drills');
}
      const data = await res.json();
      setDrills(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drills');
    } finally {
      setLoading(false);
    }
  }

  async function _loadRuns() {
    if (!selectedDrill) {
return;
}
    setLoading(true);
    try {
      // In a real implementation, we'd have a list runs endpoint
      // For now, just load from the admin interface
      setRuns([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  }

  async function startDrill(drillId: string) {
    try {
      const res = await fetch(`/api/guardian/admin/drills/${drillId}/start?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'guided' }),
      });
      if (!res.ok) {
throw new Error('Failed to start drill');
}
      const data = await res.json();
      alert(`Drill started! Run ID: ${data.run.runId}`);
      setSelectedDrill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start drill');
    }
  }

  function getDifficultyColor(difficulty: string) {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-800',
      normal: 'bg-blue-100 text-blue-800',
      hard: 'bg-yellow-100 text-yellow-800',
      chaos: 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100';
  }

  return (
    <div className="p-6 bg-bg-primary min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Guardian War-Games Console</h1>
          <p className="text-text-secondary">Create and run incident response training drills</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Training Only:</strong> All drills operate on simulated data from I01–I04.
              No real incidents, alerts, or notifications are created.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border-subtle">
          {['library', 'active', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-accent-500 text-accent-500'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'library' ? 'Drill Library' : tab === 'active' ? 'Active Runs' : 'History'}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && <div className="text-center py-12 text-text-secondary">Loading...</div>}

        {/* Drill Library Tab */}
        {activeTab === 'library' && !loading && (
          <div>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600"
              >
                Create from Simulation
              </button>
            </div>

            {drills.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No drills available</div>
            ) : (
              <div className="space-y-4">
                {drills.map((drill) => (
                  <div
                    key={drill.id}
                    className="p-4 bg-bg-card border border-border-subtle rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedDrill(drill)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{drill.name}</h3>
                        {drill.description && (
                          <p className="text-sm text-text-secondary mt-1">{drill.description}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-sm">
                          <span className={`px-2 py-1 rounded ${getDifficultyColor(drill.difficulty)}`}>
                            {drill.difficulty.toUpperCase()}
                          </span>
                          <span className="text-text-secondary">Source: {drill.source_type}</span>
                          <span className="text-text-secondary">
                            Created: {new Date(drill.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDrill(drill.id);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Start Drill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Runs Tab */}
        {activeTab === 'active' && !loading && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Running Drills</h2>
            <div className="text-center py-8 text-text-secondary">
              No active drills. Start one from the Drill Library.
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && !loading && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Drill History</h2>
            <div className="text-center py-8 text-text-secondary">No completed drills yet.</div>
          </div>
        )}

        {/* Drill Detail Modal */}
        {selectedDrill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-bg-secondary border-b border-border px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-text-primary">{selectedDrill.name}</h2>
                <button
                  onClick={() => setSelectedDrill(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-text-secondary mb-2">{selectedDrill.description}</p>
                </div>

                <div className="flex gap-3">
                  <span className={`px-3 py-1 rounded ${getDifficultyColor(selectedDrill.difficulty)}`}>
                    {selectedDrill.difficulty.toUpperCase()}
                  </span>
                  <span className="bg-gray-100 px-3 py-1 rounded text-sm">
                    {selectedDrill.source_type}
                  </span>
                </div>

                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      startDrill(selectedDrill.id);
                    }}
                    className="w-full px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600"
                  >
                    Start Guided Drill
                  </button>
                  <button
                    onClick={() => {
                      startDrill(selectedDrill.id);
                    }}
                    className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Start Freeform Drill
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
