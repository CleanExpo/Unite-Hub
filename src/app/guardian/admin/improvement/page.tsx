'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Plus,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Zap,
} from 'lucide-react';

interface Cycle {
  id: string;
  cycleKey: string;
  title: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  focusDomains: string[];
  owner: string | null;
  createdAt: string;
}

interface Action {
  id: string;
  actionKey: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  dueDate: string | null;
  relatedPlaybookKeys: string[];
  expectedImpact: any;
}

interface Outcome {
  id: string;
  label: string;
  metrics: any;
  summary: any;
  capturedAt: string;
}

interface Recommendation {
  actionKey: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedPlaybookKeys: string[];
  expectedImpact: any;
  rationale: string;
}

export default function ImprovementLoopPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    cycleKey: '',
    title: '',
    description: '',
    periodStart: '',
    periodEnd: '',
    focusDomains: [] as string[],
  });
  const [actionFormData, setActionFormData] = useState({
    actionKey: '',
    title: '',
    description: '',
    priority: 'medium' as const,
    relatedPlaybookKeys: [] as string[],
  });

  const focusDomainOptions = [
    'readiness',
    'uplift',
    'editions',
    'executive',
    'adoption',
    'lifecycle',
    'integrations',
    'goals_okrs',
    'playbooks',
    'governance',
  ];

  const loadCycles = async () => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/guardian/meta/improvement/cycles?workspaceId=${workspaceId}`);
      const data = await res.json();
      setCycles(data.cycles || []);

      // Load recommendations
      const recRes = await fetch(`/api/guardian/meta/improvement/recommendations?workspaceId=${workspaceId}`);
      const recData = await recRes.json();
      setRecommendations(recData.recommendedActions || []);
    } catch (error) {
      console.error('Failed to load cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, [workspaceId]);

  const handleSelectCycle = async (cycle: Cycle) => {
    if (selectedCycleId === cycle.id) {
      setSelectedCycleId(null);
      setSelectedCycle(null);
      return;
    }

    try {
      const res = await fetch(`/api/guardian/meta/improvement/cycles/${cycle.id}?workspaceId=${workspaceId}`);
      const data = await res.json();
      setSelectedCycle(data);
      setSelectedCycleId(cycle.id);
    } catch (error) {
      console.error('Failed to load cycle details:', error);
    }
  };

  const handleCreateCycle = async () => {
    if (!formData.cycleKey || !formData.title || !formData.description || formData.focusDomains.length === 0) {
      alert('Fill all fields');
      return;
    }

    try {
      const res = await fetch(`/api/guardian/meta/improvement/cycles?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({
          cycleKey: '',
          title: '',
          description: '',
          periodStart: '',
          periodEnd: '',
          focusDomains: [],
        });
        await loadCycles();
      } else {
        alert('Failed to create cycle');
      }
    } catch (error) {
      console.error('Failed to create cycle:', error);
    }
  };

  const handleCreateAction = async () => {
    if (!actionFormData.actionKey || !actionFormData.title || !actionFormData.description) {
      alert('Fill all action fields');
      return;
    }

    try {
      const res = await fetch(`/api/guardian/meta/improvement/actions?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: selectedCycleId,
          ...actionFormData,
        }),
      });

      if (res.ok) {
        setShowActionForm(false);
        setActionFormData({
          actionKey: '',
          title: '',
          description: '',
          priority: 'medium',
          relatedPlaybookKeys: [],
        });

        // Reload cycle
        if (selectedCycleId && selectedCycle) {
          handleSelectCycle(selectedCycle.cycle);
        }
      } else {
        alert('Failed to create action');
      }
    } catch (error) {
      console.error('Failed to create action:', error);
    }
  };

  const handleCaptureOutcome = async (label: string) => {
    try {
      const res = await fetch(
        `/api/guardian/meta/improvement/cycles/${selectedCycleId}/capture-outcome?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label }),
        }
      );

      if (res.ok) {
        // Reload cycle
        if (selectedCycleId && selectedCycle) {
          handleSelectCycle(selectedCycle.cycle);
        }
      } else {
        alert('Failed to capture outcome');
      }
    } catch (error) {
      console.error('Failed to capture outcome:', error);
    }
  };

  const handleImportRecommendation = (rec: Recommendation) => {
    setActionFormData({
      actionKey: rec.actionKey,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      relatedPlaybookKeys: rec.relatedPlaybookKeys,
    });
    setShowActionForm(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCycles();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Zap className="w-4 h-4 text-green-600" />;
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-text-secondary">Loading improvement cycles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent-500" />
            <h1 className="text-3xl font-bold text-text-primary">Continuous Improvement Loop (CIL)</h1>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-text-secondary">
          Run improvement cycles and track actions to operationalize Z01-Z11 meta signals
        </p>
      </div>

      {/* Cycles List */}
      <Card className="bg-bg-card border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-text-primary">Improvement Cycles</CardTitle>
            <Button onClick={() => setShowCreateForm(true)} size="sm" variant="default">
              <Plus className="w-4 h-4 mr-1" /> Create Cycle
            </Button>
          </div>
          <p className="text-xs text-text-secondary mt-1">{cycles.length} cycle(s)</p>
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">
              No cycles yet. Create one to start tracking improvements.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-accent-500/50 cursor-pointer transition"
                  onClick={() => handleSelectCycle(cycle)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronDown
                          className={`w-4 h-4 transition ${selectedCycleId === cycle.id ? 'rotate-180' : ''}`}
                        />
                        <p className="font-semibold text-text-primary">{cycle.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {cycle.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{cycle.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-text-secondary">
                          {new Date(cycle.periodStart).toLocaleDateString()} -{' '}
                          {new Date(cycle.periodEnd).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-text-secondary">
                          Focus: {cycle.focusDomains.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded cycle detail */}
                  {selectedCycleId === cycle.id && selectedCycle && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {/* Actions */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-text-primary">Actions</p>
                          <Button onClick={() => setShowActionForm(true)} size="sm" variant="outline">
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                        {selectedCycle.actions && selectedCycle.actions.length > 0 ? (
                          <div className="space-y-2">
                            {selectedCycle.actions.map((action: Action) => (
                              <div key={action.id} className="p-2 bg-bg-primary/50 rounded text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  {getStatusIcon(action.status)}
                                  <span className="font-medium text-text-primary">{action.title}</span>
                                  <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                                    {action.priority}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {action.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-text-secondary italic">No actions yet</p>
                        )}
                      </div>

                      {/* Outcomes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-text-primary">Outcomes</p>
                          <div className="flex gap-1">
                            {['baseline', 'mid_cycle', 'end_cycle'].map((label) => (
                              <Button
                                key={label}
                                onClick={() => handleCaptureOutcome(label)}
                                size="sm"
                                variant="outline"
                              >
                                Capture {label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        {selectedCycle.latestOutcome ? (
                          <div className="p-2 bg-bg-primary/50 rounded text-sm">
                            <p className="font-medium text-text-primary">{selectedCycle.latestOutcome.label}</p>
                            <p className="text-xs text-text-secondary mt-1">
                              {new Date(selectedCycle.latestOutcome.capturedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-text-secondary italic">No outcomes captured yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Cycle Form */}
      {showCreateForm && (
        <Card className="bg-bg-card border border-accent-500 bg-accent-50/5">
          <CardHeader>
            <CardTitle className="text-text-primary">Create Improvement Cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Cycle Key</label>
              <input
                type="text"
                value={formData.cycleKey}
                onChange={(e) => setFormData({ ...formData, cycleKey: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary"
                placeholder="e.g., Q1_2026_maturity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary"
                placeholder="Cycle title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary text-sm"
                rows={3}
                placeholder="Cycle description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Focus Domains</label>
              <div className="grid grid-cols-2 gap-2">
                {focusDomainOptions.map((domain) => (
                  <label key={domain} className="flex items-center gap-2 p-2 rounded hover:bg-bg-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.focusDomains.includes(domain)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            focusDomains: [...formData.focusDomains, domain],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            focusDomains: formData.focusDomains.filter((d) => d !== domain),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-text-primary">{domain}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateCycle} variant="default">
                Create Cycle
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Action Form */}
      {showActionForm && selectedCycleId && (
        <Card className="bg-bg-card border border-accent-500 bg-accent-50/5">
          <CardHeader>
            <CardTitle className="text-text-primary">Create Improvement Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Action Key</label>
              <input
                type="text"
                value={actionFormData.actionKey}
                onChange={(e) => setActionFormData({ ...actionFormData, actionKey: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary"
                placeholder="e.g., raise_readiness_to_75"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
              <input
                type="text"
                value={actionFormData.title}
                onChange={(e) => setActionFormData({ ...actionFormData, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary"
                placeholder="Action title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
              <textarea
                value={actionFormData.description}
                onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary text-sm"
                rows={3}
                placeholder="Action description"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateAction} variant="default">
                Create Action
              </Button>
              <Button onClick={() => setShowActionForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">Recommended Actions</CardTitle>
            <p className="text-xs text-text-secondary mt-1">
              Pattern-based recommendations from Z-series analysis
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.actionKey} className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{rec.title}</p>
                      <p className="text-xs text-text-secondary mt-1">{rec.description}</p>
                    </div>
                    <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>{rec.priority}</Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {selectedCycleId && (
                      <Button
                        onClick={() => handleImportRecommendation(rec)}
                        size="sm"
                        variant="outline"
                      >
                        Import to Cycle
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
