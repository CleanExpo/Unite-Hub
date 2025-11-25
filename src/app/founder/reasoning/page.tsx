import React from 'react';
import { getSupabaseServer } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReasoningConsole } from '@/components/reasoning/ReasoningConsole';
import { ReasoningTimeline } from '@/components/reasoning/ReasoningTimeline';
import { ReasoningGraphOverlay } from '@/components/reasoning/ReasoningGraphOverlay';

async function getReasoningStats(workspaceId: string) {
  const supabase = await getSupabaseServer();

  // Get reasoning run counts
  const { data: runs, error: runsError } = await supabase
    .from('reasoning_runs')
    .select('status, risk_score, uncertainty_score')
    .eq('workspace_id', workspaceId);

  if (runsError) {
    console.error('Error fetching reasoning runs:', runsError);
    return {
      totalRuns: 0,
      avgRisk: 0,
      avgUncertainty: 0,
      successRate: 0,
      statusDistribution: [],
    };
  }

  const runsArray = runs || [];

  // Calculate stats
  const totalRuns = runsArray.length;
  const successfulRuns = runsArray.filter((r) => r.status === 'completed').length;
  const avgRisk = runsArray.length > 0
    ? (runsArray.reduce((sum, r) => sum + (r.risk_score || 0), 0) / runsArray.length)
    : 0;
  const avgUncertainty = runsArray.length > 0
    ? (runsArray.reduce((sum, r) => sum + (r.uncertainty_score || 0), 0) / runsArray.length)
    : 0;

  const statusCounts: Record<string, number> = {};
  runsArray.forEach((run) => {
    const status = run.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  return {
    totalRuns,
    avgRisk,
    avgUncertainty,
    successRate: totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0,
    statusDistribution,
  };
}

async function getLatestReasoning(workspaceId: string) {
  const supabase = await getSupabaseServer();

  const { data: runs, error } = await supabase
    .from('reasoning_runs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching latest reasoning:', error);
    return [];
  }

  return runs || [];
}

export default async function ReasoningDashboard() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please sign in to access the reasoning dashboard</p>
      </div>
    );
  }

  // Get user's workspace
  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .single();

  if (!userOrg) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">You don't have access to any workspaces</p>
      </div>
    );
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', userOrg.org_id)
    .single();

  if (!workspace) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Workspace not found</p>
      </div>
    );
  }

  const stats = await getReasoningStats(workspace.id);
  const latestRuns = await getLatestReasoning(workspace.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">🧠 Reasoning Engine</h1>
          <p className="text-lg text-gray-600 mt-2">
            Multi-pass AI reasoning with memory integration and uncertainty tracking
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{stats.totalRuns}</div>
                <div className="text-sm text-gray-600 mt-2">Total Reasoning Runs</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{stats.successRate.toFixed(0)}%</div>
                <div className="text-sm text-gray-600 mt-2">Success Rate</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600">{stats.avgRisk.toFixed(1)}</div>
                <div className="text-sm text-gray-600 mt-2">Average Risk</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{stats.avgUncertainty.toFixed(1)}</div>
                <div className="text-sm text-gray-600 mt-2">Average Uncertainty</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="console" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="console">🚀 Console</TabsTrigger>
            <TabsTrigger value="timeline">📊 Timeline</TabsTrigger>
            <TabsTrigger value="graph">🔗 Graph</TabsTrigger>
            <TabsTrigger value="history">📜 History</TabsTrigger>
          </TabsList>

          {/* Console Tab */}
          <TabsContent value="console" className="mt-6">
            <ReasoningConsole workspaceId={workspace.id} />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            {latestRuns.length > 0 ? (
              <ReasoningTimeline
                passes={[]}
                finalRisk={stats.avgRisk}
                finalUncertainty={stats.avgUncertainty}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  <p>No reasoning runs yet. Start a run from the Console tab.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Graph Tab */}
          <TabsContent value="graph" className="mt-6">
            {latestRuns.length > 0 ? (
              <ReasoningGraphOverlay passes={[]} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  <p>No reasoning runs yet. Start a run from the Console tab.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reasoning Runs</CardTitle>
              </CardHeader>
              <CardContent>
                {latestRuns.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <p>No reasoning runs yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {latestRuns.map((run) => (
                      <div
                        key={run.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{run.objective}</h3>
                            <p className="text-sm text-gray-600 mt-1">Agent: {run.agent}</p>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                run.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : run.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {run.status}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                Risk: {run.risk_score?.toFixed(1) || '-'}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">
                                Uncertainty: {run.uncertainty_score?.toFixed(1) || '-'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {new Date(run.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Distribution Chart */}
        {stats.statusDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reasoning Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.statusDistribution.map((item) => {
                  const maxCount = Math.max(...stats.statusDistribution.map((s) => s.count), 1);
                  const percentage = (item.count / maxCount) * 100;

                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{item.status}</span>
                        <span className="text-sm font-semibold text-gray-600">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-8">
                        <div
                          className="bg-blue-600 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 10 && `${percentage.toFixed(0)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
