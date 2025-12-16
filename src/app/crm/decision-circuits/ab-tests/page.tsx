/**
 * Decision Circuits A/B Tests Page
 * List all A/B tests with status, decision, confidence, and performance metrics
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getABTests } from '@/lib/decision-circuits/dashboard-service';
import { TestStatusBadge } from '@/components/decision-circuits/ab-test-status';
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

export default async function ABTestsPage() {
  const workspaceId = await getWorkspaceId();

  let abTests = [];
  let testsError = null;

  try {
    abTests = await getABTests(workspaceId, 100);
  } catch (error) {
    console.error('Failed to fetch A/B tests:', error);
    testsError = error instanceof Error ? error.message : 'Unknown error';
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">A/B Tests</h1>
            <p className="text-text-secondary">Statistical variant evaluation and decision tracking</p>
          </div>
          <Link
            href="/crm/decision-circuits"
            className="px-4 py-2 bg-accent-500 text-bg-base rounded hover:bg-accent-600 transition-colors font-medium"
          >
            ← Back
          </Link>
        </div>

        {/* Error State */}
        {testsError && (
          <div className="bg-error-50 border border-error-500 rounded-lg p-6 mb-8">
            <p className="text-error-500 font-medium">Error loading A/B tests: {testsError}</p>
          </div>
        )}

        {/* Tests Table */}
        {!testsError && (
          <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
            <div className="border-b border-border-subtle px-6 py-4">
              <h2 className="text-lg font-semibold text-text-primary">Active & Completed Tests</h2>
            </div>

            {abTests.length === 0 ? (
              <div className="px-6 py-8 text-center text-text-muted">
                <p>No A/B tests found. Create your first test to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-hover">
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">Test Name</th>
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">Channel</th>
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">Status</th>
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">Variants</th>
                      <th className="px-6 py-3 text-right text-text-secondary font-medium">Samples</th>
                      <th className="px-6 py-3 text-right text-text-secondary font-medium">Engagement</th>
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">Started</th>
                      <th className="px-6 py-3 text-left text-text-secondary font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abTests.map((test, idx) => (
                      <tr
                        key={test.id}
                        className={`border-b border-border-subtle ${idx % 2 === 0 ? 'bg-bg-base' : 'bg-bg-card'}`}
                      >
                        <td className="px-6 py-4 text-text-primary font-medium">{test.test_name}</td>
                        <td className="px-6 py-4 text-text-secondary">
                          <span className="capitalize text-xs px-2 py-1 bg-bg-hover rounded">
                            {test.channel === 'multichannel' ? '🔗 Multi' : test.channel === 'email' ? '📧 Email' : '📱 Social'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <TestStatusBadge status={test.status} />
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{test.variant_count} variant{test.variant_count !== 1 ? 's' : ''}</td>
                        <td className="px-6 py-4 text-right text-text-primary font-medium">{test.total_samples}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-text-primary font-medium">{test.avg_engagement_rate.toFixed(1)}%</span>
                        </td>
                        <td className="px-6 py-4 text-text-secondary text-xs">
                          {format(new Date(test.started_at), 'MMM d, HH:mm')}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/crm/decision-circuits/ab-tests/${test.test_id}`}
                            className="text-accent-500 hover:text-accent-600 font-medium text-xs"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">A/B Testing Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">📊 Statistical Testing</h4>
              <p className="text-text-secondary text-sm">
                Uses two-proportion z-test with 95% confidence threshold to determine statistical significance
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">🏆 Winner Selection</h4>
              <p className="text-text-secondary text-sm">
                Automatically promotes variant with highest engagement rate when confidence threshold is met
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">📈 Decision Tracking</h4>
              <p className="text-text-secondary text-sm">
                All evaluations logged with metrics snapshot, confidence score, and optimization signal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
