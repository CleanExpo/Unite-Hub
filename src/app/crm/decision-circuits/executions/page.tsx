/**
 * Decision Circuits Executions Page
 * Audit trail of circuit, agent, and multichannel executions
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getRecentCircuitExecutions,
  getRecentAgentExecutions,
} from '@/lib/decision-circuits/dashboard-service';
import { ExecutionList } from '@/components/decision-circuits/execution-list';
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

export default async function ExecutionsPage() {
  const workspaceId = await getWorkspaceId();

  let circuitExecutions = [];
  let emailExecutions = [];
  let socialExecutions = [];
  let multichanelExecutions = [];
  let executionError = null;

  try {
    circuitExecutions = await getRecentCircuitExecutions(workspaceId, 50);
  } catch (error) {
    console.error('Failed to fetch circuit executions:', error);
    executionError = error instanceof Error ? error.message : 'Unknown error';
  }

  try {
    emailExecutions = await getRecentAgentExecutions(workspaceId, 'email', 30);
  } catch (error) {
    console.error('Failed to fetch email executions:', error);
  }

  try {
    socialExecutions = await getRecentAgentExecutions(workspaceId, 'social', 30);
  } catch (error) {
    console.error('Failed to fetch social executions:', error);
  }

  try {
    multichanelExecutions = await getRecentAgentExecutions(workspaceId, 'multichannel', 30);
  } catch (error) {
    console.error('Failed to fetch multichannel executions:', error);
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Executions</h1>
            <p className="text-text-secondary">Audit trail of all circuit and agent executions</p>
          </div>
          <Link
            href="/crm/decision-circuits"
            className="px-4 py-2 bg-accent-500 text-bg-base rounded hover:bg-accent-600 transition-colors font-medium"
          >
            ← Back
          </Link>
        </div>

        {/* Execution Lists */}
        {executionError ? (
          <div className="bg-error-50 border border-error-500 rounded-lg p-6 mb-8">
            <p className="text-error-500 font-medium">Error loading executions: {executionError}</p>
          </div>
        ) : (
          <>
            {/* Circuit Executions */}
            <div className="mb-8">
              <ExecutionList
                executions={circuitExecutions}
                columns={['id', 'type', 'status', 'time', 'duration', 'error']}
                title={`Circuit Executions (${circuitExecutions.length})`}
              />
            </div>

            {/* Email Agent Executions */}
            <div className="mb-8">
              <ExecutionList
                executions={emailExecutions}
                columns={['id', 'status', 'time', 'duration', 'error', 'metrics']}
                title={`Email Agent Executions (${emailExecutions.length})`}
              />
            </div>

            {/* Social Agent Executions */}
            <div className="mb-8">
              <ExecutionList
                executions={socialExecutions}
                columns={['id', 'status', 'time', 'duration', 'error', 'metrics']}
                title={`Social Agent Executions (${socialExecutions.length})`}
              />
            </div>

            {/* Multi-Channel Executions */}
            <div className="mb-8">
              <ExecutionList
                executions={multichanelExecutions}
                columns={['id', 'type', 'status', 'time', 'duration', 'error']}
                title={`Multi-Channel Executions (${multichanelExecutions.length})`}
              />
            </div>
          </>
        )}

        {/* Information */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">About This Page</h3>
          <p className="text-text-secondary text-sm mb-4">
            This page displays a read-only audit trail of all circuit and agent executions.
          </p>
          <ul className="text-text-secondary text-sm space-y-2">
            <li>• <strong>Circuit Executions:</strong> Core decision circuits execution logs</li>
            <li>• <strong>Email Agent:</strong> Email sending execution history</li>
            <li>• <strong>Social Agent:</strong> Social media publishing history</li>
            <li>• <strong>Multi-Channel:</strong> Coordinated multi-channel workflow executions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
