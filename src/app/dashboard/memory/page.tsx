/**
 * /dashboard/memory
 * Founder memory management and exploration dashboard
 *
 * Central hub for managing the Living Intelligence system with
 * search, visualization, and analysis tools.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, BarChart3, AlertTriangle } from 'lucide-react';
import { MemoryExplorerPanel } from '@/components/memory/MemoryExplorerPanel';
import { MemoryGraphView } from '@/components/memory/MemoryGraphView';
import { MemoryDetailModal } from '@/components/memory/MemoryDetailModal';

interface MemoryMetrics {
  totalMemories: number;
  memoryTypeDistribution: { [type: string]: number };
  averageImportance: number;
  averageConfidence: number;
  unresignedSignals: number;
}

export default function MemoryDashboard() {
  const { session, currentOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState('explorer');
  const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const workspaceId = currentOrganization?.org_id;
  const accessToken = session?.access_token;

  useEffect(() => {
    if (!workspaceId || !accessToken) return;

    const fetchMetrics = async () => {
      setMetricsLoading(true);
      setMetricsError(null);

      try {
        // For now, fetch dummy metrics - would call metrics endpoint
        // const response = await fetch(`/api/memory/metrics?workspaceId=${workspaceId}`, {
        //   headers: { 'Authorization': `Bearer ${accessToken}` }
        // });

        // Placeholder metrics
        setMetrics({
          totalMemories: 0,
          memoryTypeDistribution: {},
          averageImportance: 0,
          averageConfidence: 0,
          unresignedSignals: 0,
        });
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setMetricsError('Failed to load memory metrics');
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchMetrics();
  }, [workspaceId, accessToken]);

  if (!session || !currentOrganization || !workspaceId || !accessToken) {
    return (
      <div className="p-6">
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Please log in to access the memory dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          Living Intelligence Dashboard
        </h1>
        <p className="text-text-secondary mt-1">
          Explore and manage the unified memory system across all agents and operations.
        </p>
      </div>

      {/* Metrics Overview */}
      {!metricsLoading && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.totalMemories}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Stored in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Importance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {metrics.averageImportance.toFixed(0)}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Out of 100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {metrics.averageConfidence.toFixed(0)}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Out of 100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unresolved Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {metrics.unresignedSignals}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Memory Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {Object.keys(metrics.memoryTypeDistribution).length}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Categories in use
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="explorer">Explorer</TabsTrigger>
          <TabsTrigger value="graph">Relationships</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Explorer Tab */}
        <TabsContent value="explorer" className="space-y-4">
          <MemoryExplorerPanel
            workspaceId={workspaceId}
            accessToken={accessToken}
          />
        </TabsContent>

        {/* Graph Tab */}
        <TabsContent value="graph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relationship Graph Viewer</CardTitle>
              <CardDescription>
                Explore memory relationships. Start by entering a memory ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary mb-4">
                To view relationships, first search for a memory in the Explorer tab and note its ID.
              </p>
              <div className="p-6 bg-bg-raised rounded border border-dashed border-border-base text-center">
                <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-text-secondary">
                  Select a memory from the Explorer to view its relationships
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Memory System Insights
              </CardTitle>
              <CardDescription>
                Analysis and trends in your memory system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Memory Type Distribution */}
              {metrics && Object.keys(metrics.memoryTypeDistribution).length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                    Memory Type Distribution
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(metrics.memoryTypeDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => {
                        const total = metrics.totalMemories || 1;
                        const percentage = Math.round((count / total) * 100);
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-text-secondary">{type}</span>
                              <span className="text-text-secondary">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-bg-hover rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* System Status */}
              <div className="border-t border-border-subtle pt-4">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                  System Status
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Status</p>
                    <p className="font-medium text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full" />
                      Operational
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Workspace</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 font-mono text-xs">
                      {workspaceId.substring(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                  <strong>Quick Stats:</strong> Your memory system is{' '}
                  {metrics && metrics.totalMemories > 100 ? 'actively' : 'being'} used.
                  {metrics && metrics.unresignedSignals > 0 && (
                    <> You have {metrics.unresignedSignals} unresolved signals to review.</>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-base">About the Living Intelligence System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
          <p>
            The Living Intelligence Foundation is a unified memory architecture that serves as the
            persistent intelligence substrate for all agents and systems. It provides:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Unified Storage:</strong> Central repository for all memories across agents
            </li>
            <li>
              <strong>Relationship Tracking:</strong> Knowledge graph connecting related memories
            </li>
            <li>
              <strong>Intelligent Retrieval:</strong> Hybrid search combining keywords, semantics,
              and ranking
            </li>
            <li>
              <strong>Anomaly Detection:</strong> Signals for risks, contradictions, and
              uncertainties
            </li>
            <li>
              <strong>Audit Trail:</strong> Complete history of all memory operations
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
