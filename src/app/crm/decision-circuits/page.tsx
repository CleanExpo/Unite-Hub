/**
 * Decision Circuits Overview Page
 * High-level system health and autonomy status dashboard
 * Read-only observability - no mutations allowed
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSystemHealthStatus, getAgentPerformanceMetrics } from '@/lib/decision-circuits/dashboard-service';
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

  // Get workspace from user metadata or session
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

export default async function DecisionCircuitsOverviewPage() {
  const workspaceId = await getWorkspaceId();

  let systemHealth = null;
  let agentMetrics = null;
  let systemError = null;
  let metricsError = null;

  try {
    systemHealth = await getSystemHealthStatus(workspaceId);
  } catch (error) {
    console.error('Failed to fetch system health:', error);
    systemError = error instanceof Error ? error.message : 'Unknown error';
  }

  try {
    agentMetrics = await getAgentPerformanceMetrics(workspaceId);
  } catch (error) {
    console.error('Failed to fetch agent metrics:', error);
    metricsError = error instanceof Error ? error.message : 'Unknown error';
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Decision Circuits</h1>
          <p className="text-text-secondary">
            Autonomous decision governance and multi-channel orchestration dashboard
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 grid grid-cols-6 gap-4">
          <Link
            href="/crm/decision-circuits/executions"
            className="block p-4 bg-bg-card border border-border-subtle rounded-lg hover:bg-bg-hover transition-colors"
          >
            <div className="text-accent-500 font-semibold mb-1">📋 Executions</div>
            <p className="text-text-muted text-sm">Circuit & agent audit trail</p>
          </Link>
          <Link
            href="/crm/decision-circuits/health"
            className="block p-4 bg-bg-card border border-border-subtle rounded-lg hover:bg-bg-hover transition-colors"
          >
            <div className="text-accent-500 font-semibold mb-1">🏥 Health</div>
            <p className="text-text-muted text-sm">Checks & enforcement</p>
          </Link>
          <Link
            href="/crm/decision-circuits/ab-tests"
            className="block p-4 bg-bg-card border border-border-subtle rounded-lg hover:bg-bg-hover transition-colors"
          >
            <div className="text-accent-500 font-semibold mb-1">🧪 A/B Tests</div>
            <p className="text-text-muted text-sm">Variant evaluation</p>
          </Link>
          <Link
            href="/crm/decision-circuits/releases"
            className="block p-4 bg-bg-card border border-border-subtle rounded-lg hover:bg-bg-hover transition-colors"
          >
            <div className="text-accent-500 font-semibold mb-1">🚀 Releases</div>
            <p className="text-text-muted text-sm">Canary & rollback</p>
          </Link>
          <Link
            href="/crm/decision-circuits/performance"
            className="block p-4 bg-bg-card border border-border-subtle rounded-lg hover:bg-bg-hover transition-colors"
          >
            <div className="text-accent-500 font-semibold mb-1">📊 Performance</div>
            <p className="text-text-muted text-sm">Multi-channel metrics</p>
          </Link>
          <Link
            href="/crm"
            className="block p-4 bg-bg-card border border-border-subtle rounded-lg hover:bg-bg-hover transition-colors"
          >
            <div className="text-accent-500 font-semibold mb-1">← Back</div>
            <p className="text-text-muted text-sm">Return to CRM</p>
          </Link>
        </div>

        {/* System Health Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">System Health</h2>
          {systemError ? (
            <div className="bg-error-50 border border-error-500 rounded-lg p-6">
              <p className="text-error-500 font-medium">Error loading system health: {systemError}</p>
            </div>
          ) : systemHealth ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                label="Overall Success Rate"
                value={`${systemHealth.overall_success_rate}%`}
                status={systemHealth.overall_success_rate >= 95 ? 'healthy' : 'warning'}
                icon="✓"
              />
              <StatusCard
                label="Active Versions"
                value={systemHealth.active_circuit_versions}
                metric="circuits"
                status="neutral"
                icon="📦"
              />
              <StatusCard
                label="Health Check Pass Rate"
                value={`${systemHealth.health_check_pass_rate}%`}
                status={systemHealth.health_check_pass_rate >= 95 ? 'healthy' : 'warning'}
                icon="🏥"
              />
              <StatusCard
                label="Rollbacks (30d)"
                value={systemHealth.rollback_count_30d}
                metric="events"
                status={systemHealth.rollback_count_30d === 0 ? 'healthy' : 'warning'}
                icon="🔄"
              />
            </div>
          ) : (
            <div className="text-text-muted">Loading...</div>
          )}
        </div>

        {/* Agent Performance Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Agent Performance</h2>
          {metricsError ? (
            <div className="bg-error-50 border border-error-500 rounded-lg p-6">
              <p className="text-error-500 font-medium">Error loading agent metrics: {metricsError}</p>
            </div>
          ) : agentMetrics ? (
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
          ) : (
            <div className="text-text-muted">Loading...</div>
          )}
        </div>

        {/* Information Section */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">About Decision Circuits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">🤖 Autonomous Agents</h4>
              <p className="text-text-secondary text-sm">
                Circuit-governed execution agents for Email, Social, and Multi-Channel campaigns
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">🛡️ Enforcement</h4>
              <p className="text-text-secondary text-sm">
                Production health checks, compliance validation, and autonomy locks
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">📊 Observability</h4>
              <p className="text-text-secondary text-sm">
                Real-time metrics, audit trails, and executive dashboards
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
