/**
 * Decision Circuits Performance Page
 * Aggregated metrics across Email, Social, and Multi-Channel workflows
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAgentPerformanceMetrics } from '@/lib/decision-circuits/dashboard-service';
import { StatusCard } from '@/components/decision-circuits/status-card';
import Link from 'next/link';

async function getWorkspaceId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userWorkspace } = await supabase
    .from('user_workspaces')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single();

  if (!userWorkspace) {
    redirect('/');
  }

  return userWorkspace.workspace_id;
}

async function getDetailedMetrics(workspaceId: string) {
  const supabase = await createClient();

  try {
    // Get email agent performance view
    const { data: emailPerf } = await supabase
      .from('email_agent_performance')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    // Get social agent performance view
    const { data: socialPerf } = await supabase
      .from('social_agent_performance')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    // Get multichannel performance view
    const { data: multichanelPerf } = await supabase
      .from('multichannel_performance')
      .select('*')
      .eq('workspace_id', workspaceId);

    return { emailPerf, socialPerf, multichanelPerf };
  } catch (error) {
    console.error('Failed to fetch detailed metrics:', error);
    return { emailPerf: null, socialPerf: null, multichanelPerf: [] };
  }
}

export default async function PerformancePage() {
  const workspaceId = await getWorkspaceId();

  let agentMetrics = null;
  let detailedMetrics = null;
  let metricsError = null;

  try {
    agentMetrics = await getAgentPerformanceMetrics(workspaceId);
  } catch (error) {
    console.error('Failed to fetch agent metrics:', error);
    metricsError = error instanceof Error ? error.message : 'Unknown error';
  }

  try {
    detailedMetrics = await getDetailedMetrics(workspaceId);
  } catch (error) {
    console.error('Failed to fetch detailed metrics:', error);
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Performance Metrics</h1>
            <p className="text-text-secondary">Multi-channel workflow execution and engagement metrics</p>
          </div>
          <Link
            href="/crm/decision-circuits"
            className="px-4 py-2 bg-accent-500 text-bg-base rounded hover:bg-accent-600 transition-colors font-medium"
          >
            ← Back
          </Link>
        </div>

        {metricsError ? (
          <div className="bg-error-50 border border-error-500 rounded-lg p-6 mb-8">
            <p className="text-error-500 font-medium">Error loading metrics: {metricsError}</p>
          </div>
        ) : agentMetrics ? (
          <>
            {/* Agent Performance Summary */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Agent Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatusCard
                  label="Email Success Rate"
                  value={`${agentMetrics.email_send_success_rate}%`}
                  status={agentMetrics.email_send_success_rate >= 90 ? 'healthy' : 'warning'}
                  icon="📧"
                />
                <StatusCard
                  label="Social Success Rate"
                  value={`${agentMetrics.social_publish_success_rate}%`}
                  status={agentMetrics.social_publish_success_rate >= 90 ? 'healthy' : 'warning'}
                  icon="📱"
                />
                <StatusCard
                  label="Multi-Channel Completion"
                  value={`${agentMetrics.multichannel_completion_rate}%`}
                  status={agentMetrics.multichannel_completion_rate >= 90 ? 'healthy' : 'warning'}
                  icon="🔗"
                />
                <StatusCard
                  label="Avg Retries"
                  value={agentMetrics.avg_retries_per_agent.toFixed(2)}
                  metric="per agent"
                  status="neutral"
                  icon="🔁"
                />
                <StatusCard
                  label="Suppression Blocks"
                  value={agentMetrics.suppression_blocks}
                  metric="recipients"
                  status="neutral"
                  icon="🚫"
                />
              </div>
            </div>

            {/* Detailed Performance Tables */}
            {detailedMetrics && (
              <>
                {/* Email Performance */}
                {detailedMetrics.emailPerf && (
                  <div className="mb-8 bg-bg-card border border-border-subtle rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Email Agent Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-text-muted text-sm">Total Emails</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {detailedMetrics.emailPerf.total_emails || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-sm">Successful Sends</p>
                        <p className="text-2xl font-bold text-success-500">
                          {detailedMetrics.emailPerf.successful_sends || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-sm">Success Rate</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {detailedMetrics.emailPerf.success_rate || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-sm">Avg Retries</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {detailedMetrics.emailPerf.avg_retries_on_success?.toFixed(2) || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Performance */}
                {detailedMetrics.socialPerf && (
                  <div className="mb-8 bg-bg-card border border-border-subtle rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Social Agent Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-text-muted text-sm">Total Posts</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {detailedMetrics.socialPerf.total_posts || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-sm">Published</p>
                        <p className="text-2xl font-bold text-success-500">
                          {detailedMetrics.socialPerf.successful_publishes || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-sm">Success Rate</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {detailedMetrics.socialPerf.success_rate || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-sm">Platforms</p>
                        <p className="text-2xl font-bold text-accent-500">
                          {detailedMetrics.socialPerf.platform_count || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Multi-Channel Performance */}
                {detailedMetrics.multichanelPerf && detailedMetrics.multichanelPerf.length > 0 && (
                  <div className="mb-8 bg-bg-card border border-border-subtle rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">
                      Multi-Channel by Flow Type
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border-subtle">
                            <th className="px-4 py-2 text-left text-text-secondary font-medium">
                              Flow Type
                            </th>
                            <th className="px-4 py-2 text-right text-text-secondary font-medium">
                              Total
                            </th>
                            <th className="px-4 py-2 text-right text-text-secondary font-medium">
                              Successful
                            </th>
                            <th className="px-4 py-2 text-right text-text-secondary font-medium">
                              Success Rate
                            </th>
                            <th className="px-4 py-2 text-right text-text-secondary font-medium">
                              Avg Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedMetrics.multichanelPerf.map((flow) => (
                            <tr key={flow.id} className="border-b border-border-subtle">
                              <td className="px-4 py-2 text-text-primary font-medium">{flow.flow_id}</td>
                              <td className="px-4 py-2 text-right text-text-secondary">
                                {flow.total_executions}
                              </td>
                              <td className="px-4 py-2 text-right text-success-500">
                                {flow.successful_executions}
                              </td>
                              <td className="px-4 py-2 text-right text-text-primary">
                                {flow.success_rate}%
                              </td>
                              <td className="px-4 py-2 text-right text-text-secondary">
                                {flow.avg_duration_seconds?.toFixed(2)}s
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Metrics Guide */}
            <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Metrics Explained</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-accent-500 mb-2">✓ Success Rate</h4>
                  <p className="text-text-secondary text-sm">
                    Percentage of executions that completed successfully without failures
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-accent-500 mb-2">🔁 Retries</h4>
                  <p className="text-text-secondary text-sm">
                    Average number of retry attempts before successful execution
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-accent-500 mb-2">🚫 Suppression</h4>
                  <p className="text-text-secondary text-sm">
                    Recipients blocked from all channels due to bounces/complaints
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-accent-500 mb-2">⏱️ Duration</h4>
                  <p className="text-text-secondary text-sm">
                    Average time from workflow start to completion
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-text-muted text-center py-8">Loading metrics...</div>
        )}
      </div>
    </div>
  );
}
