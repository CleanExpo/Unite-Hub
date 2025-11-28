'use client';

/**
 * Decision Scenarios Page (Shadow Founder)
 *
 * Allows founders to simulate strategic decisions and see projected outcomes:
 * - Create new decision scenarios
 * - View AI-generated simulated outcomes (best/expected/worst case)
 * - Record actual outcomes for learning
 * - Track decision history
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  Plus,
  Loader2,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  DollarSign,
  Users,
  Package,
  Megaphone,
  Scale,
} from 'lucide-react';

type ScenarioType =
  | 'pricing_change'
  | 'new_product'
  | 'hiring'
  | 'marketing_campaign'
  | 'partnership'
  | 'market_expansion'
  | 'cost_reduction'
  | 'other';

type ScenarioStatus = 'draft' | 'simulated' | 'decided' | 'executed' | 'reviewed';

interface SimulatedOutcome {
  scenario: 'best' | 'expected' | 'worst';
  description: string;
  probability: number;
  revenueImpact: number;
  timeToRealize: string;
  keyRisks: string[];
  keyBenefits: string[];
}

interface DecisionScenario {
  id: string;
  scenarioType: ScenarioType;
  title: string;
  description: string;
  assumptions: Record<string, unknown>;
  simulatedOutcomes: SimulatedOutcome[];
  aiRecommendation: string;
  confidenceScore: number;
  status: ScenarioStatus;
  createdAt: string;
  decidedAt: string | null;
  actualOutcome: Record<string, unknown> | null;
}

const SCENARIO_TYPE_CONFIG: Record<
  ScenarioType,
  { label: string; icon: React.ElementType; color: string }
> = {
  pricing_change: { label: 'Pricing Change', icon: DollarSign, color: 'text-green-500' },
  new_product: { label: 'New Product/Service', icon: Package, color: 'text-blue-500' },
  hiring: { label: 'Hiring Decision', icon: Users, color: 'text-purple-500' },
  marketing_campaign: { label: 'Marketing Campaign', icon: Megaphone, color: 'text-orange-500' },
  partnership: { label: 'Partnership', icon: Scale, color: 'text-cyan-500' },
  market_expansion: { label: 'Market Expansion', icon: TrendingUp, color: 'text-emerald-500' },
  cost_reduction: { label: 'Cost Reduction', icon: TrendingDown, color: 'text-red-500' },
  other: { label: 'Other', icon: Target, color: 'text-gray-500' },
};

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  simulated: { label: 'Simulated', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  decided: { label: 'Decided', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  executed: { label: 'Executed', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  reviewed: { label: 'Reviewed', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
};

export default function DecisionScenariosPage() {
  const { session, currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<DecisionScenario[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newScenario, setNewScenario] = useState({
    scenarioType: 'pricing_change' as ScenarioType,
    title: '',
    description: '',
    assumptions: '',
  });

  const workspaceId = currentOrganization?.org_id;

  const fetchScenarios = async () => {
    if (!session?.access_token || !workspaceId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/founder/memory/decision-scenarios?workspaceId=${workspaceId}&limit=50`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setScenarios(data.scenarios || []);
      }
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async () => {
    if (!session?.access_token || !workspaceId) return;

    setCreating(true);
    try {
      let assumptions = {};
      try {
        assumptions = newScenario.assumptions ? JSON.parse(newScenario.assumptions) : {};
      } catch {
        // If JSON parse fails, use description-based assumptions
        assumptions = { notes: newScenario.assumptions };
      }

      const response = await fetch('/api/founder/memory/decision-scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          scenarioType: newScenario.scenarioType,
          title: newScenario.title,
          description: newScenario.description,
          assumptions,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setScenarios([data.scenario, ...scenarios]);
        setShowCreateModal(false);
        setNewScenario({
          scenarioType: 'pricing_change',
          title: '',
          description: '',
          assumptions: '',
        });
        setExpandedId(data.scenario.id);
      }
    } catch (error) {
      console.error('Failed to create scenario:', error);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [session, workspaceId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    const isNegative = value < 0;
    return `${isNegative ? '-' : '+'}$${Math.abs(value).toLocaleString()}`;
  };

  const getOutcomeIcon = (scenario: 'best' | 'expected' | 'worst') => {
    switch (scenario) {
      case 'best':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'worst':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/founder/cognitive-twin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cognitive Twin
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Decision Simulator</h1>
              <p className="text-muted-foreground">
                Test strategic decisions before committing - powered by your Shadow Founder
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Scenario
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold">Create Decision Scenario</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Scenario Type</label>
                <select
                  value={newScenario.scenarioType}
                  onChange={(e) =>
                    setNewScenario({ ...newScenario, scenarioType: e.target.value as ScenarioType })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2"
                >
                  {Object.entries(SCENARIO_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={newScenario.title}
                  onChange={(e) => setNewScenario({ ...newScenario, title: e.target.value })}
                  placeholder="e.g., Increase prices by 15%"
                  className="w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={newScenario.description}
                  onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                  placeholder="Describe the decision you're considering..."
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Key Assumptions (optional)
                </label>
                <textarea
                  value={newScenario.assumptions}
                  onChange={(e) => setNewScenario({ ...newScenario, assumptions: e.target.value })}
                  placeholder="What assumptions are you making? e.g., Market demand stays stable..."
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={createScenario}
                disabled={creating || !newScenario.title}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Simulate Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios List */}
      {scenarios.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Brain className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h2 className="mt-4 text-xl font-semibold">No Scenarios Yet</h2>
          <p className="mt-2 text-muted-foreground">
            Create your first decision scenario to see AI-powered outcome simulations.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create First Scenario
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scenario) => {
            const typeConfig = SCENARIO_TYPE_CONFIG[scenario.scenarioType];
            const statusConfig = STATUS_CONFIG[scenario.status];
            const isExpanded = expandedId === scenario.id;
            const TypeIcon = typeConfig.icon;

            return (
              <div key={scenario.id} className="rounded-xl border bg-card">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                    <div>
                      <p className="font-medium">{scenario.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {typeConfig.label} • Created {formatDate(scenario.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {scenario.confidenceScore > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {Math.round(scenario.confidenceScore * 100)}% confidence
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t p-4">
                    <p className="mb-4 text-muted-foreground">{scenario.description}</p>

                    {/* AI Recommendation */}
                    {scenario.aiRecommendation && (
                      <div className="mb-6 rounded-lg bg-primary/5 p-4">
                        <div className="mb-2 flex items-center gap-2 font-medium">
                          <Brain className="h-4 w-4 text-primary" />
                          AI Recommendation
                        </div>
                        <p className="text-sm">{scenario.aiRecommendation}</p>
                      </div>
                    )}

                    {/* Simulated Outcomes */}
                    {scenario.simulatedOutcomes?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="mb-3 font-medium">Simulated Outcomes</h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                          {scenario.simulatedOutcomes.map((outcome) => (
                            <div
                              key={outcome.scenario}
                              className={`rounded-lg border p-4 ${
                                outcome.scenario === 'best'
                                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                  : outcome.scenario === 'worst'
                                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                                    : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                              }`}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getOutcomeIcon(outcome.scenario)}
                                  <span className="font-medium capitalize">{outcome.scenario} Case</span>
                                </div>
                                <span className="text-sm">{outcome.probability}%</span>
                              </div>
                              <p className="mb-2 text-sm">{outcome.description}</p>
                              <div className="space-y-1 text-xs">
                                <p>
                                  <span className="text-muted-foreground">Revenue Impact:</span>{' '}
                                  <span
                                    className={
                                      outcome.revenueImpact >= 0 ? 'text-green-600' : 'text-red-600'
                                    }
                                  >
                                    {formatCurrency(outcome.revenueImpact)}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Timeline:</span>{' '}
                                  {outcome.timeToRealize}
                                </p>
                              </div>
                              {outcome.keyBenefits?.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">Benefits:</p>
                                  <ul className="ml-4 list-disc text-xs">
                                    {outcome.keyBenefits.slice(0, 2).map((b, i) => (
                                      <li key={i}>{b}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {outcome.keyRisks?.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">Risks:</p>
                                  <ul className="ml-4 list-disc text-xs">
                                    {outcome.keyRisks.slice(0, 2).map((r, i) => (
                                      <li key={i}>{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actual Outcome (if reviewed) */}
                    {scenario.actualOutcome && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                        <div className="mb-2 flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
                          <CheckCircle2 className="h-4 w-4" />
                          Actual Outcome Recorded
                        </div>
                        <pre className="text-sm text-green-700 dark:text-green-300">
                          {JSON.stringify(scenario.actualOutcome, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
