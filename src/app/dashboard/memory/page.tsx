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
        <Alert className="border-[#FFB800]/20 bg-[#FFB800]/10">
          <AlertTriangle className="h-4 w-4 text-[#FFB800]" />
          <AlertDescription className="text-[#FFB800]">
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
        <h1 className="text-3xl font-bold text-white/90 flex items-center gap-2">
          <Brain className="w-8 h-8 text-[#00F5FF]" />
          Living Intelligence Dashboard
        </h1>
        <p className="text-white/50 mt-1">
          Explore and manage the unified memory system across all agents and operations.
        </p>
      </div>

      {/* Metrics Overview */}
      {!metricsLoading && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/70 mb-2">Total Memories</p>
            <div className="text-3xl font-bold text-[#00F5FF]">
              {metrics.totalMemories}
            </div>
            <p className="text-xs text-white/40 mt-1">
              Stored in system
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/70 mb-2">Avg Importance</p>
            <div className="text-3xl font-bold text-[#FFB800]">
              {metrics.averageImportance.toFixed(0)}
            </div>
            <p className="text-xs text-white/40 mt-1">
              Out of 100
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/70 mb-2">Avg Confidence</p>
            <div className="text-3xl font-bold text-[#00FF88]">
              {metrics.averageConfidence.toFixed(0)}
            </div>
            <p className="text-xs text-white/40 mt-1">
              Out of 100
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/70 mb-2">Unresolved Signals</p>
            <div className="text-3xl font-bold text-[#FF4444]">
              {metrics.unresignedSignals}
            </div>
            <p className="text-xs text-white/40 mt-1">
              Requiring attention
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/70 mb-2">Memory Types</p>
            <div className="text-3xl font-bold text-[#FF00FF]">
              {Object.keys(metrics.memoryTypeDistribution).length}
            </div>
            <p className="text-xs text-white/40 mt-1">
              Categories in use
            </p>
          </div>
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
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <h3 className="text-lg font-bold text-white/90 mb-1">Relationship Graph Viewer</h3>
            <p className="text-sm text-white/40 mb-4">
              Explore memory relationships. Start by entering a memory ID.
            </p>
            <p className="text-sm text-white/50 mb-4">
              To view relationships, first search for a memory in the Explorer tab and note its ID.
            </p>
            <div className="p-6 bg-white/[0.02] rounded-sm border border-dashed border-white/[0.06] text-center">
              <Brain className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/40">
                Select a memory from the Explorer to view its relationships
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <h3 className="text-lg font-bold text-white/90 mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Memory System Insights
            </h3>
            <p className="text-sm text-white/40 mb-4">
              Analysis and trends in your memory system
            </p>
            <div className="space-y-4">
              {/* Memory Type Distribution */}
              {metrics && Object.keys(metrics.memoryTypeDistribution).length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-white/90 mb-3">
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
                              <span className="text-white/70">{type}</span>
                              <span className="text-white/50">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-white/[0.06] rounded-sm h-2">
                              <div
                                className="bg-[#00F5FF] h-2 rounded-sm"
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
              <div className="border-t border-white/[0.06] pt-4">
                <h3 className="font-semibold text-sm text-white/90 mb-3">
                  System Status
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/50">Status</p>
                    <p className="font-medium text-[#00FF88] flex items-center gap-1">
                      <span className="w-2 h-2 bg-[#00FF88] rounded-sm" />
                      Operational
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50">Workspace</p>
                    <p className="font-medium text-white/90 font-mono text-xs">
                      {workspaceId.substring(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <Alert className="border-[#00F5FF]/20 bg-[#00F5FF]/10">
                <AlertDescription className="text-[#00F5FF] text-sm">
                  <strong>Quick Stats:</strong> Your memory system is{' '}
                  {metrics && metrics.totalMemories > 100 ? 'actively' : 'being'} used.
                  {metrics && metrics.unresignedSignals > 0 && (
                    <> You have {metrics.unresignedSignals} unresolved signals to review.</>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <div className="bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-sm p-4">
        <h3 className="text-base font-bold text-white/90 mb-3">About the Living Intelligence System</h3>
        <div className="space-y-2 text-sm text-white/70">
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
        </div>
      </div>
    </div>
  );
}
