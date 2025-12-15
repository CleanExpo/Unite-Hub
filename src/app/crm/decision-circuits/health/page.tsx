/**
 * Decision Circuits Health Page
 * Health checks, violation rates, and enforcement signals
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRecentHealthChecks } from '@/lib/decision-circuits/dashboard-service';
import Link from 'next/link';
import { format } from 'date-fns';

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

async function getEnforcementStatus(workspaceId: string) {
  const supabase = await createClient();

  try {
    const { data: enforcement } = await supabase
      .from('circuit_enforcement')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);

    return enforcement || [];
  } catch (error) {
    console.error('Failed to fetch enforcement status:', error);
    return [];
  }
}

export default async function HealthPage() {
  const workspaceId = await getWorkspaceId();

  let healthChecks = [];
  let enforcementEvents = [];
  let healthError = null;

  try {
    healthChecks = await getRecentHealthChecks(workspaceId, 100);
  } catch (error) {
    console.error('Failed to fetch health checks:', error);
    healthError = error instanceof Error ? error.message : 'Unknown error';
  }

  try {
    enforcementEvents = await getEnforcementStatus(workspaceId);
  } catch (error) {
    console.error('Failed to fetch enforcement events:', error);
  }

  const healthSummary = {
    total: healthChecks.length,
    passed: healthChecks.filter((h) => h.status === 'pass').length,
    failed: healthChecks.filter((h) => h.status === 'fail').length,
  };

  const enforcementSummary = {
    total: enforcementEvents.length,
    violations: enforcementEvents.filter((e) => e.violation_type).length,
  };

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Health & Enforcement</h1>
            <p className="text-text-secondary">Production health checks and compliance validation</p>
          </div>
          <Link
            href="/crm/decision-circuits"
            className="px-4 py-2 bg-accent-500 text-bg-base rounded hover:bg-accent-600 transition-colors font-medium"
          >
            ← Back
          </Link>
        </div>

        {/* Health Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Total Health Checks</p>
            <p className="text-3xl font-bold text-text-primary">{healthSummary.total}</p>
          </div>
          <div className="bg-bg-card border border-success-500 border-l-4 rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Passed Checks</p>
            <p className="text-3xl font-bold text-success-500">{healthSummary.passed}</p>
          </div>
          <div
            className={`bg-bg-card border ${healthSummary.failed > 0 ? 'border-error-500 border-l-4' : 'border-border-subtle'} rounded-lg p-6`}
          >
            <p className="text-text-secondary text-sm mb-2">Failed Checks</p>
            <p
              className={`text-3xl font-bold ${healthSummary.failed > 0 ? 'text-error-500' : 'text-text-primary'}`}
            >
              {healthSummary.failed}
            </p>
          </div>
        </div>

        {/* Health Checks */}
        {healthError ? (
          <div className="bg-error-50 border border-error-500 rounded-lg p-6 mb-8">
            <p className="text-error-500 font-medium">Error loading health checks: {healthError}</p>
          </div>
        ) : (
          <div className="mb-8">
            <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
              <div className="border-b border-border-subtle px-6 py-4">
                <h3 className="text-lg font-semibold text-text-primary">Recent Health Checks</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-hover">
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">
                        Check Name
                      </th>
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">Time</th>
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">
                        Violation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthChecks.slice(0, 50).map((check, idx: number) => (
                      <tr
                        key={check.id}
                        className={`border-b border-border-subtle ${
                          idx % 2 === 0 ? 'bg-bg-base' : 'bg-bg-card'
                        }`}
                      >
                        <td className="px-6 py-3 text-text-primary">{check.check_name}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium ${
                              check.status === 'pass'
                                ? 'bg-success-50 text-success-500'
                                : 'bg-error-50 text-error-500'
                            }`}
                          >
                            {check.status === 'pass' ? '✓ Pass' : '✗ Fail'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-text-secondary text-xs">
                          {format(new Date(check.checked_at), 'MMM d, HH:mm:ss')}
                        </td>
                        <td className="px-6 py-3 text-text-muted text-xs">
                          {check.violation || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Enforcement Events */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Enforcement Events ({enforcementSummary.total})
          </h3>
          {enforcementEvents.length === 0 ? (
            <p className="text-text-muted">No enforcement events recorded</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {enforcementEvents.slice(0, 20).map((event) => (
                <div
                  key={event.id}
                  className="border border-border-subtle rounded p-4 bg-bg-hover"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text-primary text-sm">{event.event_type}</p>
                      <p className="text-text-secondary text-xs mt-1">
                        {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                      </p>
                    </div>
                    {event.violation_type && (
                      <span className="px-2 py-1 rounded-sm bg-error-50 text-error-500 text-xs font-medium">
                        ⚠️ {event.violation_type}
                      </span>
                    )}
                  </div>
                  {event.details && (
                    <p className="text-text-muted text-xs mt-2">{JSON.stringify(event.details).substring(0, 100)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
