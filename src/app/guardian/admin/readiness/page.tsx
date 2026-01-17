'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, TrendingUp, BookOpen, Lightbulb, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';

interface CapabilityScore {
  key: string;
  label: string;
  category: string;
  description: string;
  score: number;
  status: 'not_configured' | 'partial' | 'ready' | 'advanced';
  details: Record<string, unknown>;
}

interface ReadinessOverview {
  computedAt: string | null;
  overall: {
    score: number;
    status: 'baseline' | 'operational' | 'mature' | 'network_intelligent';
  };
  capabilities: CapabilityScore[];
}

interface UpliftTask {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  effortEstimate: string;
  dueDate: string | null;
  owner: string | null;
  hints: Record<string, unknown>;
}

interface UpliftPlan {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  targetOverallScore: number;
  targetOverallStatus: string;
  readinessSnapshotAt: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  tasks?: UpliftTask[];
}

const STATUS_COLORS = {
  not_configured: 'bg-error-100 text-error-800',
  partial: 'bg-warning-100 text-warning-800',
  ready: 'bg-success-100 text-success-800',
  advanced: 'bg-info-100 text-info-800',
};

const OVERALL_STATUS_COLORS = {
  baseline: 'bg-bg-hover text-text-secondary',
  operational: 'bg-warning-100 text-warning-800',
  mature: 'bg-success-100 text-success-800',
  network_intelligent: 'bg-info-100 text-info-800',
};

const OVERALL_STATUS_DESC = {
  baseline: 'Core Guardian rules engine only. Ready for basic rule-based alerts.',
  operational: 'Core + Risk engine enabled. Running incident correlation and risk scoring.',
  mature: 'Operational + QA chaos testing. Validating rules with simulation.',
  network_intelligent: 'Mature + X-series network intelligence. Leveraging cohort benchmarks and early warnings.',
};

const CATEGORY_DESCRIPTIONS = {
  core: 'Core rule engine, alerts, incidents, and risk scoring',
  ai_intelligence: 'AI-powered assistance (H-series, when available)',
  qa_chaos: 'QA simulation and chaos testing (I-series)',
  network_intelligence: 'Network telemetry and peer intelligence (X-series)',
  governance: 'Audit, compliance, and readiness tracking',
};

export default function GuardianReadinessPage() {
  const [readiness, setReadiness] = useState<ReadinessOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upliftPlans, setUpliftPlans] = useState<UpliftPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { workspaceId, loading: workspaceLoading, error: workspaceError } = useWorkspace();

  useEffect(() => {
    if (!workspaceId) return;

    const loadReadiness = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/guardian/meta/readiness/overview?workspaceId=${workspaceId}`
        );

        if (!res.ok) {
          throw new Error(`Failed to load readiness: ${res.status}`);
        }

        const data = await res.json();
        setReadiness(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadReadiness();
  }, [workspaceId]);

  const loadUpliftPlans = async () => {
    if (!workspaceId) return;

    try {
      setPlansLoading(true);
      const res = await fetch(
        `/api/guardian/meta/uplift/plans?workspaceId=${workspaceId}&limit=20`
      );

      if (!res.ok) {
        throw new Error(`Failed to load uplift plans: ${res.status}`);
      }

      const data = await res.json();
      setUpliftPlans(data.data?.plans || []);
    } catch (err) {
      console.error('Failed to load uplift plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!workspaceId) return;

    try {
      setGenerating(true);
      const res = await fetch(
        `/api/guardian/meta/uplift/plans?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ includeRecommendations: true }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to generate plan: ${res.status}`);
      }

      await loadUpliftPlans();
    } catch (err) {
      console.error('Failed to generate plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleTaskStatusChange = async (planId: string, taskId: string, newStatus: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(
        `/api/guardian/meta/uplift/tasks/${taskId}?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to update task: ${res.status}`);
      }

      // Reload plans to reflect changes
      await loadUpliftPlans();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-text-tertiary">Loading workspace...</div>
      </div>
    );
  }

  if (workspaceError || !workspaceId) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-error-200 bg-error-50">
          <CardContent className="pt-6">
            <p className="text-sm text-error-900">{workspaceError || 'No workspace selected'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-text-tertiary">Loading Guardian readiness...</div>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-error-200 bg-error-50">
          <CardContent className="pt-6">
            <p className="text-sm text-error-900">{error || 'Failed to load readiness data'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group capabilities by category
  const capsByCategory = readiness.capabilities.reduce(
    (acc, cap) => {
      if (!acc[cap.category]) {
        acc[cap.category] = [];
      }
      acc[cap.category].push(cap);
      return acc;
    },
    {} as Record<string, CapabilityScore[]>
  );

  // Calculate category averages
  const categoryAverages = Object.entries(capsByCategory).reduce(
    (acc, [cat, caps]) => {
      const avg = Math.round(caps.reduce((sum, c) => sum + c.score, 0) / caps.length);
      acc[cat] = avg;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Guardian Readiness Dashboard</h1>
          <p className="text-text-muted mt-1">
            Capability status and tenant maturity assessment
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Advisory Banner */}
      <Card className="border-info-200 bg-info-50">
        <CardContent className="pt-6">
          <p className="text-sm text-info-900 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Advisory-Only:</strong> Readiness scores help identify gaps and opportunities for
              Guardian adoption. They do not affect alerting, incidents, or enforcement logic. Configuration
              and activation remain completely under your control.
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Overall Score Card */}
      <Card className="border-accent-500 border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Guardian Readiness</span>
            <Badge className={OVERALL_STATUS_COLORS[readiness.overall.status]}>
              {readiness.overall.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="text-6xl font-bold text-accent-600">{readiness.overall.score}</div>
              <p className="text-text-muted mt-2">Overall Capability Score (0-100)</p>
            </div>

            {/* Status Description */}
            <div className="flex-1 space-y-3">
              <p className="text-sm font-medium text-text-primary">
                {OVERALL_STATUS_DESC[readiness.overall.status]}
              </p>
              <div className="flex gap-2 text-xs">
                <CheckCircle className="w-4 h-4 text-success-600 shrink-0 mt-0.5" />
                <span className="text-text-muted">Computed at {readiness.computedAt ? new Date(readiness.computedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-text-primary mb-3">Category Scores</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(categoryAverages).map(([cat, score]) => (
                <div key={cat} className="p-3 bg-bg-hover rounded border">
                  <div className="text-2xl font-bold text-accent-600">{score}</div>
                  <p className="text-xs text-text-muted mt-1 capitalize">
                    {cat.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities by Category */}
      {Object.entries(capsByCategory).map(([category, capabilities]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">
              {category.replace(/_/g, ' ')}
            </CardTitle>
            <p className="text-sm text-text-muted mt-1">
              {CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {capabilities.map((cap) => (
                <div key={cap.key} className="p-4 border rounded hover:bg-bg-hover transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cap.label}</p>
                      <p className="text-xs text-text-muted mt-1">{cap.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-accent-600">{cap.score}</div>
                        <Badge className={STATUS_COLORS[cap.status]} variant="outline">
                          {cap.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  {Object.keys(cap.details).length > 0 && (
                    <div className="mt-3 pt-3 border-t text-xs">
                      <div className="grid grid-cols-2 gap-2 text-text-muted">
                        {Object.entries(cap.details).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                            {typeof value === 'boolean' ? (value ? '✓ Yes' : '✗ No') : String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Guided Uplift Section */}
      <Card className="border-accent-500 border-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-accent-600" />
              Guided Uplift & Adoption Playbooks
            </CardTitle>
            <Button
              onClick={() => {
                if (upliftPlans.length === 0 && !plansLoading) {
                  loadUpliftPlans();
                } else {
                  setExpandedPlanId(expandedPlanId ? null : 'list');
                }
              }}
              variant="outline"
              size="sm"
            >
              {expandedPlanId === 'list' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-text-muted mt-1">
            AI-generated adoption plans tailored to your readiness level. Generate actionable tasks to advance Guardian maturity.
          </p>
        </CardHeader>

        {(expandedPlanId === 'list' || upliftPlans.length > 0) && (
          <CardContent className="space-y-4">
            {/* Advisory Banner */}
            <div className="p-3 bg-info-50 border border-info-200 rounded text-xs text-info-900">
              <strong>Advisory-Only:</strong> Uplift plans are suggestions for improving Guardian adoption. Implementation is entirely optional and under your control.
            </div>

            {/* Generate Plan Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="bg-accent-600 hover:bg-accent-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {generating ? 'Generating...' : 'Generate New Plan'}
              </Button>
              <Button onClick={loadUpliftPlans} disabled={plansLoading} variant="outline">
                {plansLoading ? 'Loading...' : 'Refresh Plans'}
              </Button>
            </div>

            {/* Plans List */}
            {upliftPlans.length === 0 && !plansLoading ? (
              <div className="p-6 text-center text-text-muted text-sm">
                <p>No uplift plans yet. Generate one to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upliftPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border rounded-lg overflow-hidden bg-bg-hover hover:bg-white transition-colors"
                  >
                    {/* Plan Header */}
                    <div
                      className="p-4 flex justify-between items-start cursor-pointer hover:bg-bg-hover"
                      onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{plan.name}</h4>
                          <Badge className={`text-xs ${
                            plan.status === 'draft' ? 'bg-bg-hover text-text-secondary' :
                            plan.status === 'active' ? 'bg-success-200 text-success-800' :
                            plan.status === 'completed' ? 'bg-info-200 text-info-800' :
                            'bg-bg-elevated text-text-primary'
                          }`}>
                            {plan.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted">{plan.description}</p>
                        <div className="mt-2 text-xs text-text-tertiary">
                          Target: {plan.targetOverallScore} ({plan.targetOverallStatus.replace(/_/g, ' ')}) • {plan.tasks?.length || 0} tasks
                        </div>
                      </div>
                      <div>
                        {expandedPlanId === plan.id ? (
                          <ChevronUp className="w-5 h-5 text-text-muted" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-text-muted" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Task List */}
                    {expandedPlanId === plan.id && plan.tasks && (
                      <div className="border-t bg-white">
                        <div className="p-4 space-y-3">
                          {plan.tasks.length === 0 ? (
                            <p className="text-xs text-text-muted">No tasks in this plan.</p>
                          ) : (
                            plan.tasks.map((task) => (
                              <div key={task.id} className="p-3 bg-bg-hover rounded border text-xs space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium">{task.title}</p>
                                    <p className="text-text-muted text-xs mt-1">{task.description}</p>
                                  </div>
                                  <Badge className={`text-xs ml-2 ${
                                    task.status === 'todo' ? 'bg-bg-hover text-text-secondary' :
                                    task.status === 'in_progress' ? 'bg-info-200 text-info-800' :
                                    task.status === 'blocked' ? 'bg-error-200 text-error-800' :
                                    'bg-success-200 text-success-800'
                                  }`}>
                                    {task.status.replace(/_/g, ' ')}
                                  </Badge>
                                </div>

                                <div className="flex gap-2 text-xs">
                                  <span className="px-2 py-1 bg-white border rounded">
                                    {task.category}
                                  </span>
                                  <span className="px-2 py-1 bg-white border rounded">
                                    Priority: {task.priority}
                                  </span>
                                  {task.effortEstimate && (
                                    <span className="px-2 py-1 bg-white border rounded">
                                      Effort: {task.effortEstimate}
                                    </span>
                                  )}
                                </div>

                                {/* Status Dropdown */}
                                <div className="flex gap-2">
                                  <label className="flex items-center gap-2 text-xs">
                                    <span className="font-medium">Status:</span>
                                    <select
                                      value={task.status}
                                      onChange={(e) =>
                                        handleTaskStatusChange(plan.id, task.id, e.target.value)
                                      }
                                      className="px-2 py-1 border rounded text-xs bg-white"
                                      aria-label="Change task status"
                                    >
                                    <option value="todo">Todo</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="done">Done</option>
                                    </select>
                                  </label>
                                </div>

                                {/* Hints */}
                                {task.hints && Object.keys(task.hints).length > 0 && (
                                  <div className="p-2 bg-info-50 border border-info-200 rounded text-xs text-info-900">
                                    <strong>Hints:</strong> {JSON.stringify(task.hints).slice(0, 200)}...
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Navigation & Next Steps */}
      <Card className="border-success-200 bg-success-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-success-900">
            Use your readiness score to prioritize Guardian adoption. Areas with lower scores represent opportunities to expand Guardian capabilities:
          </p>
          <ul className="space-y-2 text-success-900 ml-4">
            <li>• <strong>Rules & Alerts:</strong> Build and activate rule templates</li>
            <li>• <strong>Risk Scoring:</strong> Enable the risk engine for incident prioritization</li>
            <li>• <strong>QA & Simulation:</strong> Add regression testing to validate rule changes</li>
            <li>• <strong>Network Intelligence:</strong> Enable X-series for peer comparison and early warnings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
