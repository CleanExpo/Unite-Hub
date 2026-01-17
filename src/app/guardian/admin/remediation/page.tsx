'use client';

/**
 * Guardian I04: Auto-Remediation Simulator Dashboard
 * - Create/manage remediation playbooks
 * - Run simulations and view results
 * - Compare baseline vs simulated metrics
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, TrendingDown, TrendingUp, Play } from 'lucide-react';

interface Playbook {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SimulationRun {
  runId: string;
  playbookId: string;
  status: 'completed' | 'failed';
  overall_effect?: 'positive' | 'neutral' | 'negative';
  summary?: string;
  finished_at: string;
}

export default function RemediationSimulatorPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('playbooks');

  useEffect(() => {
    if (workspaceId) {
      loadPlaybooks();
      loadRuns();
    }
  }, [workspaceId]);

  async function loadPlaybooks() {
    try {
      const res = await fetch(
        `/api/guardian/simulation/playbooks?workspaceId=${workspaceId}`
      );
      if (!res.ok) {
throw new Error('Failed to load playbooks');
}
      const data = await res.json();
      setPlaybooks(data.data?.playbooks || []);
    } catch (error) {
      console.error('Error loading playbooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRuns() {
    try {
      const res = await fetch(
        `/api/guardian/simulation/runs?workspaceId=${workspaceId}&limit=10`
      );
      if (!res.ok) {
throw new Error('Failed to load simulation runs');
}
      const data = await res.json();
      setRuns(data.data?.runs || []);
    } catch (error) {
      console.error('Error loading runs:', error);
    }
  }

  async function runSimulation(playbookId: string) {
    if (!workspaceId) {
return;
}

    setSimulating(true);
    try {
      const res = await fetch(
        `/api/guardian/simulation/runs?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playbookId, windowDays: 30 }),
        }
      );

      if (!res.ok) {
throw new Error('Simulation failed');
}
      const data = await res.json();

      // Refresh runs list
      await loadRuns();
      alert('Simulation completed successfully');
    } catch (error) {
      console.error('Error running simulation:', error);
      alert('Failed to run simulation');
    } finally {
      setSimulating(false);
    }
  }

  const getEffectColor = (effect?: string) => {
    switch (effect) {
      case 'positive':
        return 'text-success-600 bg-success-50';
      case 'negative':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-text-secondary bg-bg-hover';
    }
  };

  const getEffectIcon = (effect?: string) => {
    switch (effect) {
      case 'positive':
        return <TrendingDown className="w-4 h-4" />;
      case 'negative':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto-Remediation Simulator</h1>
          <p className="text-text-secondary mt-1">
            Test remediation actions on historical data without modifying production
          </p>
        </div>
        <Button onClick={() => setActiveTab('playbooks')} className="gap-2">
          New Playbook
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="runs">Simulation Runs</TabsTrigger>
        </TabsList>

        {/* Playbooks Tab */}
        <TabsContent value="playbooks" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-text-secondary">Loading playbooks...</p>
              </CardContent>
            </Card>
          ) : playbooks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-text-secondary">No playbooks yet. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {playbooks.map((playbook) => (
                <Card
                  key={playbook.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPlaybook(playbook)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{playbook.name}</CardTitle>
                        <CardDescription>{playbook.description}</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          runSimulation(playbook.id);
                        }}
                        disabled={simulating || !playbook.is_active}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {simulating ? 'Simulating...' : 'Simulate'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-text-secondary">
                    <div className="space-y-1">
                      <p>Category: {playbook.category}</p>
                      <p>Status: {playbook.is_active ? 'Active' : 'Inactive'}</p>
                      <p>Updated: {new Date(playbook.updated_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Simulation Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          {runs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-text-secondary">No simulation runs yet. Run a playbook to see results.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <Card key={run.runId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">Simulation Run</CardTitle>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getEffectColor(
                              run.overall_effect
                            )}`}
                          >
                            {getEffectIcon(run.overall_effect)}
                            {run.overall_effect?.toUpperCase() || 'NEUTRAL'}
                          </div>
                        </div>
                        <CardDescription>
                          {new Date(run.finished_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        {run.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-success-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-error-600" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {run.summary && (
                    <CardContent>
                      <p className="text-sm text-text-secondary">{run.summary}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Playbook Detail View */}
      {selectedPlaybook && (
        <Card>
          <CardHeader>
            <CardTitle>Playbook: {selectedPlaybook.name}</CardTitle>
            <CardDescription>{selectedPlaybook.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setSelectedPlaybook(null)}>
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
