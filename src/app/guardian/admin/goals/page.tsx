'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight, TrendingUp } from 'lucide-react';
import type { ProgramGoal } from '@/lib/guardian/meta/programGoalService';

interface GoalWithCounts extends ProgramGoal {
  okrCount: number;
  kpiCount: number;
}

interface OkrWithKpis {
  id: string;
  objective: string;
  objectiveKey: string;
  status: string;
  weight: number;
  kpis: Array<{
    id: string;
    label: string;
    currentValue: number;
    targetValue: number;
    status: 'behind' | 'on_track' | 'ahead';
    unit: string;
  }>;
}

interface GoalDetail extends ProgramGoal {
  okrCount: number;
  kpiCount: number;
  okrs: OkrWithKpis[];
}

export default function GoalsPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [goals, setGoals] = useState<GoalWithCounts[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    goal_key: '',
    title: '',
    description: '',
    timeframe_start: '',
    timeframe_end: '',
    owner: '',
    category: 'governance',
  });

  // Load goals on mount
  useEffect(() => {
    if (!workspaceId) return;

    const loadGoals = async () => {
      try {
        const res = await fetch(`/api/guardian/meta/goals?workspaceId=${workspaceId}`);
        const data = await res.json();
        setGoals(data.goals || []);
      } catch (error) {
        console.error('Failed to load goals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [workspaceId]);

  // Load selected goal details
  useEffect(() => {
    if (!workspaceId || !searchParams.get('goalId')) return;

    const loadGoalDetail = async () => {
      try {
        const res = await fetch(`/api/guardian/meta/goals/${searchParams.get('goalId')}?workspaceId=${workspaceId}`);
        const data = await res.json();
        setSelectedGoal(data.goal);
      } catch (error) {
        console.error('Failed to load goal detail:', error);
      }
    };

    loadGoalDetail();
  }, [workspaceId, searchParams]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/guardian/meta/goals?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) throw new Error('Failed to create goal');

      const data = await res.json();
      setGoals([...goals, data.goal]);
      setShowCreateModal(false);
      setCreateForm({
        goal_key: '',
        title: '',
        description: '',
        timeframe_start: '',
        timeframe_end: '',
        owner: '',
        category: 'governance',
      });
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead':
        return 'bg-green-100 text-green-800';
      case 'on_track':
        return 'bg-blue-100 text-blue-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      governance: 'bg-purple-100 text-purple-800',
      security_posture: 'bg-red-100 text-red-800',
      operations: 'bg-blue-100 text-blue-800',
      compliance: 'bg-yellow-100 text-yellow-800',
      adoption: 'bg-green-100 text-green-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-text-secondary">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Program Goals & OKRs</h1>
          <p className="text-text-secondary">Strategic objectives and key results</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Goal
        </Button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Card className="bg-bg-card border border-border">
          <CardHeader>
            <CardTitle>Create Program Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <input
                type="text"
                placeholder="Goal Key (e.g., readiness_ramp)"
                value={createForm.goal_key}
                onChange={(e) => setCreateForm({ ...createForm, goal_key: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-bg-secondary text-text-primary"
                required
              />
              <input
                type="text"
                placeholder="Title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-bg-secondary text-text-primary"
                required
              />
              <textarea
                placeholder="Description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-bg-secondary text-text-primary"
                rows={3}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={createForm.timeframe_start}
                  onChange={(e) => setCreateForm({ ...createForm, timeframe_start: e.target.value })}
                  className="px-3 py-2 border border-border rounded-md bg-bg-secondary text-text-primary"
                  required
                />
                <input
                  type="date"
                  value={createForm.timeframe_end}
                  onChange={(e) => setCreateForm({ ...createForm, timeframe_end: e.target.value })}
                  className="px-3 py-2 border border-border rounded-md bg-bg-secondary text-text-primary"
                  required
                />
              </div>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-bg-secondary text-text-primary"
              >
                <option value="governance">Governance</option>
                <option value="security_posture">Security Posture</option>
                <option value="operations">Operations</option>
                <option value="compliance">Compliance</option>
                <option value="adoption">Adoption</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Create
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className="cursor-pointer hover:shadow-lg transition-shadow bg-bg-card border border-border"
            onClick={() => {
              setSelectedGoal(goal as unknown as GoalDetail);
            }}
          >
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-text-primary">{goal.title}</CardTitle>
                <Badge className={getCategoryColor(goal.category)}>{goal.category}</Badge>
              </div>
              <Badge variant="outline" className="w-fit">
                {goal.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-text-secondary">{goal.description}</p>
              <div className="text-xs text-text-secondary space-y-1">
                <p>
                  {goal.timeframeStart?.toLocaleDateString()} - {goal.timeframeEnd?.toLocaleDateString()}
                </p>
                <p className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {goal.okrCount} OKRs · {goal.kpiCount} KPIs
                </p>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-end">
                View Details
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goal Detail Panel */}
      {selectedGoal && (
        <Card className="bg-bg-card border border-border">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-text-primary">{selectedGoal.title}</CardTitle>
                <p className="text-sm text-text-secondary mt-1">{selectedGoal.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedGoal(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OKRs and KPIs */}
            {selectedGoal.okrs && selectedGoal.okrs.length > 0 ? (
              <div className="space-y-4">
                {selectedGoal.okrs.map((okr) => (
                  <div key={okr.id} className="border-l-4 border-accent-500 pl-4 py-2">
                    <h3 className="font-semibold text-text-primary mb-2">{okr.objective}</h3>

                    {/* KPIs under this OKR */}
                    {okr.kpis && okr.kpis.length > 0 ? (
                      <div className="space-y-2 ml-2">
                        {okr.kpis.map((kpi) => (
                          <div
                            key={kpi.id}
                            className="bg-bg-secondary p-3 rounded border border-border space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-text-primary">{kpi.label}</span>
                              <Badge className={getStatusColor(kpi.status)}>{kpi.status}</Badge>
                            </div>
                            <p className="text-xs text-text-secondary">
                              {kpi.currentValue.toFixed(1)} / {kpi.targetValue} {kpi.unit}
                            </p>
                            <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent-500 rounded-full"
                                style={{
                                  width: `${Math.min((kpi.currentValue / kpi.targetValue) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-secondary italic">No KPIs defined</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary italic">No OKRs defined for this goal</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/guardian/meta/kpis/evaluate?workspaceId=${workspaceId}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        periodEnd: new Date().toISOString(),
                      }),
                    });
                    if (res.ok) {
                      alert('KPIs evaluated successfully');
                    }
                  } catch (error) {
                    console.error('Failed to evaluate KPIs:', error);
                  }
                }}
              >
                Evaluate KPIs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csv = `Goal: ${selectedGoal.title}\n\n${selectedGoal.okrs
                    .map((okr) => `OKR: ${okr.objective}\n${okr.kpis.map((k) => `  KPI: ${k.label}`).join('\n')}`)
                    .join('\n\n')}`;

                  const blob = new Blob([csv], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedGoal.goalKey}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="text-center py-12 bg-bg-card border border-border">
          <CardContent>
            <p className="text-text-secondary mb-4">No program goals defined yet</p>
            <Button onClick={() => setShowCreateModal(true)}>Create Your First Goal</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
