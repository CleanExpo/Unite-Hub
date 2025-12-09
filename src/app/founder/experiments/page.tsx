'use client';

/**
 * Experiments & Feature Flags Dashboard
 * Phase: D69 - Experimentation & Feature Flag Engine
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Flag, FlaskConical, BarChart, Users, TrendingUp, Play, Pause } from 'lucide-react';

interface FeatureFlag {
  id: string;
  flag_key: string;
  name: string;
  flag_type: string;
  default_value: unknown;
  is_active: boolean;
  created_at: string;
}

interface Experiment {
  id: string;
  experiment_key: string;
  name: string;
  description?: string;
  status: string;
  variants: Array<{ key: string; weight: number }>;
  traffic_allocation: number;
  started_at?: string;
  created_at: string;
}

interface ExperimentSummary {
  experiment: Experiment;
  variants: Array<{
    variant_key: string;
    assignment_count: number;
    metrics: Record<string, { avg: number; total: number; count: number }>;
  }>;
}

export default function ExperimentsPage() {
  const [activeTab, setActiveTab] = useState<'flags' | 'experiments'>('experiments');
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (activeTab === 'flags') {
      fetchFlags();
    } else {
      fetchExperiments();
    }
  }, [activeTab, statusFilter]);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/experiments/flags?limit=100');
      const data = await response.json();
      if (response.ok) {
        setFlags(data.flags || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await fetch(`/api/unite/experiments?limit=100${statusParam}`);
      const data = await response.json();
      if (response.ok) {
        setExperiments(data.experiments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExperimentSummary = async (experimentKey: string) => {
    try {
      const response = await fetch(`/api/unite/experiments?experiment_key=${experimentKey}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedExperiment(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFlag = async (flagKey: string, currentActive: boolean) => {
    try {
      await fetch('/api/unite/experiments/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          flag_key: flagKey,
          is_active: !currentActive,
        }),
      });
      fetchFlags();
    } catch (err) {
      console.error(err);
    }
  };

  const updateExperimentStatus = async (experimentKey: string, newStatus: string) => {
    try {
      await fetch('/api/unite/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          experiment_key: experimentKey,
          status: newStatus,
          ...(newStatus === 'running' ? { started_at: new Date().toISOString() } : {}),
          ...(newStatus === 'completed' ? { ended_at: new Date().toISOString() } : {}),
        }),
      });
      fetchExperiments();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    return colors[status] || colors.draft;
  };

  // Summary stats
  const totalFlags = flags.length;
  const activeFlags = flags.filter((f) => f.is_active).length;
  const totalExperiments = experiments.length;
  const runningExperiments = experiments.filter((e) => e.status === 'running').length;

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <FlaskConical className="w-10 h-10 text-accent-500" />
            Experiments & Feature Flags
          </h1>
          <p className="text-text-secondary">A/B testing and progressive feature rollout</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Feature Flags</span>
              <Flag className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalFlags}</div>
            <div className="text-xs text-text-tertiary mt-1">{activeFlags} active</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Experiments</span>
              <FlaskConical className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalExperiments}</div>
            <div className="text-xs text-text-tertiary mt-1">{runningExperiments} running</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Assignments</span>
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {selectedExperiment?.variants.reduce((sum, v) => sum + v.assignment_count, 0) || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">total enrolled</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Metrics</span>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {selectedExperiment?.variants.reduce(
                (sum, v) => sum + Object.keys(v.metrics).length,
                0
              ) || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">tracked</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'experiments', label: 'Experiments', icon: FlaskConical },
            { key: 'flags', label: 'Feature Flags', icon: Flag },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === key
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Experiments Tab */}
        {activeTab === 'experiments' && (
          <div>
            {/* Status Filter */}
            <div className="mb-4 flex gap-2">
              {['all', 'draft', 'running', 'paused', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    statusFilter === status
                      ? 'bg-accent-500 text-white'
                      : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading experiments...</div>
            ) : experiments.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <FlaskConical className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No experiments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {experiments.map((experiment) => (
                  <div
                    key={experiment.id}
                    className={`p-4 bg-bg-card rounded-lg border ${getStatusColor(
                      experiment.status
                    )} cursor-pointer hover:border-accent-500/50`}
                    onClick={() => fetchExperimentSummary(experiment.experiment_key)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">{experiment.name}</span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {experiment.experiment_key}
                          </span>
                        </div>
                        {experiment.description && (
                          <p className="text-sm text-text-secondary mb-2">
                            {experiment.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-text-tertiary">
                          <span>
                            Variants: {experiment.variants.map((v) => v.key).join(', ')}
                          </span>
                          <span>Traffic: {experiment.traffic_allocation}%</span>
                          <span>Created: {new Date(experiment.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {experiment.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateExperimentStatus(experiment.experiment_key, 'running');
                            }}
                            className="bg-accent-500 hover:bg-accent-600"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {experiment.status === 'running' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateExperimentStatus(experiment.experiment_key, 'paused');
                            }}
                            variant="outline"
                          >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Show summary if selected */}
                    {selectedExperiment?.experiment.id === experiment.id && (
                      <div className="mt-4 pt-4 border-t border-border-primary">
                        <h4 className="text-sm font-medium text-text-primary mb-3">
                          Variant Performance
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {selectedExperiment.variants.map((variant) => (
                            <div
                              key={variant.variant_key}
                              className="p-3 bg-bg-tertiary rounded border border-border-primary"
                            >
                              <div className="font-medium text-text-primary mb-2">
                                {variant.variant_key}
                              </div>
                              <div className="text-sm text-text-secondary">
                                <div>Assignments: {variant.assignment_count}</div>
                                {Object.entries(variant.metrics).map(([key, data]) => (
                                  <div key={key}>
                                    {key}: {data.avg.toFixed(2)} avg
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'flags' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading flags...</div>
            ) : flags.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Flag className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No feature flags found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    className={`p-4 bg-bg-card rounded-lg border ${
                      flag.is_active
                        ? 'border-green-500/20'
                        : 'border-border-primary opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">{flag.name}</span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {flag.flag_key}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {flag.flag_type}
                          </span>
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Default: {JSON.stringify(flag.default_value)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => toggleFlag(flag.flag_key, flag.is_active)}
                        className={
                          flag.is_active
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-500 hover:bg-gray-600'
                        }
                      >
                        {flag.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
