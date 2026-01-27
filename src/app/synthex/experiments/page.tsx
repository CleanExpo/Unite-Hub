'use client';

/**
 * Synthex Experiments Page
 *
 * A/B testing management dashboard:
 * - Create and manage experiments
 * - View experiment status and results
 * - Statistical significance indicators
 * - Start/stop/archive experiments
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Archive,
  BarChart3,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Beaker,
  TrendingUp,
} from 'lucide-react';

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  sandbox_config: Record<string, unknown>;
  results: Record<string, unknown>;
  is_active: boolean;
  status: string;
  confidence: number | null;
  uncertainty_notes: string | null;
  created_at: string;
  completed_at: string | null;
}

interface ABTestCampaign {
  id: string;
  name: string;
  campaign_type: string;
  ab_test_config: Record<string, unknown> | null;
  ab_test_winner_id: string | null;
  ab_test_completed_at: string | null;
  status: string;
  created_at: string;
}

export default function ExperimentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [abTests, setAbTests] = useState<ABTestCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'ab_test' | 'multivariate' | 'content_test'>('ab_test');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const res = await fetch(`/api/synthex/experiments?tenantId=${tenantId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setExperiments(data.experiments || []);
        setAbTests(data.abTests || []);
      }
    } catch (err) {
      console.error('Experiments fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }
    fetchData();
  }, [tenantId, fetchData, router]);

  const handleCreate = async () => {
    if (!newName.trim() || !tenantId) return;
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/synthex/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenantId,
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          experimentType: newType,
        }),
      });

      if (res.ok) {
        setNewName('');
        setNewDescription('');
        setShowCreateForm(false);
        fetchData();
      }
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!tenantId) return;
    setUpdating(id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/synthex/experiments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tenantId, status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error('Status change error:', err);
    } finally {
      setUpdating(null);
    }
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    setup: { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: <Clock className="h-3 w-3" />, label: 'Setup' },
    running: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: <Play className="h-3 w-3" />, label: 'Running' },
    completed: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Completed' },
    archived: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: <Archive className="h-3 w-3" />, label: 'Archived' },
  };

  const typeLabels: Record<string, string> = {
    ab_test: 'A/B Test',
    multivariate: 'Multivariate',
    content_test: 'Content Test',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const runningCount = experiments.filter(e => e.status === 'running').length;
  const completedCount = experiments.filter(e => e.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-violet-400" />
            Experiments
          </h1>
          <p className="text-gray-400 mt-1">
            A/B tests, multivariate experiments, and content optimization
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Experiment
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Experiment Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Homepage Hero A/B Test"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as typeof newType)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="ab_test">A/B Test</option>
                  <option value="multivariate">Multivariate Test</option>
                  <option value="content_test">Content Test</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What are you testing?"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="bg-violet-600 hover:bg-violet-700">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Beaker className="h-4 w-4 mr-1" />}
                Create Experiment
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <FlaskConical className="h-6 w-6 text-violet-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{experiments.length}</p>
            <p className="text-xs text-gray-500">Total Experiments</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <Play className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{runningCount}</p>
            <p className="text-xs text-gray-500">Running</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{abTests.length}</p>
            <p className="text-xs text-gray-500">Campaign A/B Tests</p>
          </CardContent>
        </Card>
      </div>

      {/* Experiments List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <Beaker className="h-5 w-5 text-violet-400" />
          Sandbox Experiments
        </h2>

        {experiments.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-8 pb-8 text-center">
              <FlaskConical className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No experiments yet</p>
              <p className="text-sm text-gray-500">
                Create an experiment to start testing variants and optimizing performance
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiments.map(exp => {
              const status = statusConfig[exp.status] || statusConfig.setup;
              const expType = (exp.sandbox_config?.experiment_type as string) || 'ab_test';

              return (
                <Card key={exp.id} className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-gray-100 text-base truncate">
                          {exp.name}
                        </CardTitle>
                        {exp.description && (
                          <CardDescription className="text-gray-500 text-xs mt-1 truncate">
                            {exp.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline" className={`ml-2 text-xs ${status.color}`}>
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs">
                        {typeLabels[expType] || expType}
                      </Badge>
                      <span>Created {new Date(exp.created_at).toLocaleDateString()}</span>
                    </div>

                    {exp.confidence != null && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-3 w-3 text-blue-400" />
                        <span className="text-xs text-gray-400">
                          Confidence: {exp.confidence}%
                        </span>
                      </div>
                    )}

                    {exp.uncertainty_notes && (
                      <div className="flex items-start gap-2 text-xs text-yellow-400/80 bg-yellow-500/5 rounded p-2">
                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{exp.uncertainty_notes}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-800">
                      {exp.status === 'setup' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-400 hover:text-emerald-300"
                          onClick={() => handleStatusChange(exp.id, 'running')}
                          disabled={updating === exp.id}
                        >
                          {updating === exp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                          Start
                        </Button>
                      )}
                      {exp.status === 'running' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300"
                            onClick={() => handleStatusChange(exp.id, 'completed')}
                            disabled={updating === exp.id}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-yellow-400 hover:text-yellow-300"
                            onClick={() => handleStatusChange(exp.id, 'setup')}
                            disabled={updating === exp.id}
                          >
                            <Pause className="h-3 w-3 mr-1" /> Pause
                          </Button>
                        </>
                      )}
                      {(exp.status === 'completed' || exp.status === 'setup') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-gray-300"
                          onClick={() => handleStatusChange(exp.id, 'archived')}
                          disabled={updating === exp.id}
                        >
                          <Archive className="h-3 w-3 mr-1" /> Archive
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign A/B Tests */}
      {abTests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Campaign A/B Tests
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {abTests.map(test => (
              <Card key={test.id} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-100 text-base">{test.name}</CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Created {new Date(test.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      test.ab_test_winner_id
                        ? 'text-emerald-300 border-emerald-500/30'
                        : 'text-gray-400 border-gray-700'
                    }>
                      {test.ab_test_winner_id ? 'Winner Declared' : test.status}
                    </Badge>
                    {test.ab_test_completed_at && (
                      <span className="text-xs text-gray-500">
                        Completed {new Date(test.ab_test_completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
