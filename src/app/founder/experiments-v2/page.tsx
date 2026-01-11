'use client';

/**
 * Experiments V2 Dashboard
 * Phase: D62 - Enhanced Experimentation Framework
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Play, Pause, BarChart3, Target, FlaskConical } from 'lucide-react';

interface Experiment {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: string;
  target_area: string;
  hypothesis?: string;
  primary_metric: string;
  secondary_metrics?: string[];
  start_at?: string;
  end_at?: string;
}

interface Variant {
  id: string;
  experiment_id: string;
  key: string;
  name: string;
  description?: string;
  allocation_percent: number;
}

export default function ExperimentsV2Page() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stats, setStats] = useState<any>(null);

  // AI Design Modal
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [aiTargetArea, setAiTargetArea] = useState('');
  const [aiDesigning, setAiDesigning] = useState(false);

  useEffect(() => {
    fetchExperiments();
  }, []);

  useEffect(() => {
    if (selectedExperiment) {
      fetchVariants(selectedExperiment);
      fetchStats(selectedExperiment);
    }
  }, [selectedExperiment]);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/experiments-v2?limit=50');
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

  const fetchVariants = async (experimentId: string) => {
    try {
      const response = await fetch(`/api/unite/experiments-v2?action=list_variants&experiment_id=${experimentId}`);
      const data = await response.json();
      if (response.ok) {
        setVariants(data.variants || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async (experimentId: string) => {
    try {
      const response = await fetch(`/api/unite/experiments-v2/events?experiment_id=${experimentId}`);
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIDesign = async () => {
    if (!aiGoal || !aiTargetArea) {
      alert('Please provide goal and target area');
      return;
    }

    try {
      setAiDesigning(true);
      const response = await fetch('/api/unite/experiments-v2/ai/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoal, target_area: aiTargetArea }),
      });
      const data = await response.json();
      if (response.ok) {
        // Create experiment with AI design
        const createResponse = await fetch('/api/unite/experiments-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: data.design.name.toLowerCase().replace(/\s+/g, '-'),
            name: data.design.name,
            hypothesis: data.design.hypothesis,
            target_area: aiTargetArea,
            primary_metric: 'conversion_rate',
            status: 'draft',
            ai_design: data.design,
          }),
        });
        const createData = await createResponse.json();
        if (createResponse.ok) {
          // Create variants
          for (const variant of data.design.variants) {
            await fetch('/api/unite/experiments-v2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create_variant',
                experiment_id: createData.experiment.id,
                key: variant.key,
                name: variant.name,
                description: variant.description,
                allocation_percent: 50 / data.design.variants.length,
              }),
            });
          }
          setShowAIModal(false);
          setAiGoal('');
          setAiTargetArea('');
          fetchExperiments();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiDesigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      running: 'bg-green-500',
      paused: 'bg-yellow-500',
      completed: 'bg-blue-500',
      archived: 'bg-gray-600',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Experiments V2</h1>
            <p className="text-text-secondary">A/B testing and experimentation framework</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAIModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              AI Design
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="bg-accent-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Experiment
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading experiments...</div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
            <Target className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
            <p className="text-text-secondary mb-4">No experiments created yet</p>
            <Button onClick={() => setShowAIModal(true)} className="bg-purple-600 text-white">
              <FlaskConical className="w-4 h-4 mr-2" />
              Design with AI
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Experiments List */}
            <div className="lg:col-span-2 space-y-4">
              {experiments.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExperiment(exp.id)}
                  className={`p-6 bg-bg-card rounded-lg border ${
                    selectedExperiment === exp.id ? 'border-accent-500' : 'border-border-primary'
                  } hover:border-accent-500 transition-all cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(exp.status)}`} />
                      <h3 className="text-lg font-semibold text-text-primary">{exp.name}</h3>
                    </div>
                    <span className="px-3 py-1 text-xs bg-bg-tertiary text-text-secondary rounded-full">
                      {exp.status}
                    </span>
                  </div>

                  {exp.hypothesis && (
                    <p className="text-sm text-text-secondary mb-3">
                      <strong>Hypothesis:</strong> {exp.hypothesis}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-text-tertiary">
                    <span>Target: {exp.target_area}</span>
                    <span>Metric: {exp.primary_metric}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Experiment Details */}
            <div className="space-y-6">
              {selectedExperiment ? (
                <>
                  {/* Variants */}
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Variants</h3>
                    {variants.length === 0 ? (
                      <p className="text-sm text-text-tertiary">No variants configured</p>
                    ) : (
                      <div className="space-y-3">
                        {variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="p-3 bg-bg-tertiary rounded border border-border-secondary"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-text-primary">{variant.name}</span>
                              <span className="text-sm text-accent-500">
                                {variant.allocation_percent}%
                              </span>
                            </div>
                            {variant.description && (
                              <p className="text-xs text-text-tertiary">{variant.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  {stats && (
                    <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Performance
                      </h3>
                      <div className="space-y-3">
                        {stats.variants.map((v: any) => (
                          <div key={v.variant_id} className="p-3 bg-bg-tertiary rounded">
                            <div className="text-sm font-medium text-text-primary mb-1">
                              {v.variant_name}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                              <div>
                                <span className="text-text-tertiary">Events:</span> {v.total_events}
                              </div>
                              <div>
                                <span className="text-text-tertiary">Subjects:</span> {v.unique_subjects}
                              </div>
                              <div className="col-span-2">
                                <span className="text-text-tertiary">Avg Value:</span>{' '}
                                {v.avg_value.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary text-center">
                  <p className="text-text-tertiary">Select an experiment to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Design Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-lg border border-border-primary p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-text-primary mb-4">AI Experiment Design</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Goal</label>
                <input
                  type="text"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="e.g., Increase conversion rate"
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border-secondary rounded text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Target Area
                </label>
                <input
                  type="text"
                  value={aiTargetArea}
                  onChange={(e) => setAiTargetArea(e.target.value)}
                  placeholder="e.g., Landing page, Email subject line"
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border-secondary rounded text-text-primary"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowAIModal(false)}
                className="flex-1 bg-bg-tertiary text-text-primary"
                disabled={aiDesigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAIDesign}
                className="flex-1 bg-purple-600 text-white"
                disabled={aiDesigning}
              >
                {aiDesigning ? 'Designing...' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
