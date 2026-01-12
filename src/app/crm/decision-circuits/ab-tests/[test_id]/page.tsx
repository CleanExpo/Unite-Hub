/**
 * A/B Test Detail Page
 * Detailed view of a single A/B test with variant metrics and evaluation history
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getABTestDetails } from '@/lib/decision-circuits/dashboard-service';
import {
  TestStatusBadge,
  ConfidenceMeter,
  PerformanceDelta,
  VariantComparison,
} from '@/components/decision-circuits/ab-test-status';
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

interface PageParams {
  params: Promise<{ test_id: string }>;
}

export default async function ABTestDetailPage({ params }: PageParams) {
  const { test_id } = await params;
  const workspaceId = await getWorkspaceId();

  let testDetails = null;
  let detailError = null;

  try {
    testDetails = await getABTestDetails(workspaceId, test_id);
  } catch (error) {
    console.error(`Failed to fetch A/B test ${test_id}:`, error);
    detailError = error instanceof Error ? error.message : 'Unknown error';
  }

  if (!testDetails) {
    return (
      <div className="min-h-screen bg-bg-base py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-error-50 border border-error-500 rounded-lg p-6">
            <p className="text-error-500 font-medium">
              {detailError ? `Error: ${detailError}` : 'A/B test not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { test, variants, evaluations } = testDetails;
  const latestEvaluation = evaluations[0];

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">{test.test_name}</h1>
            <p className="text-text-secondary">Test ID: {test.test_id}</p>
          </div>
          <Link
            href="/crm/decision-circuits/ab-tests"
            className="px-4 py-2 bg-accent-500 text-bg-base rounded hover:bg-accent-600 transition-colors font-medium"
          >
            ← Back
          </Link>
        </div>

        {/* Test Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Status</p>
            <TestStatusBadge status={test.status} decision={test.latest_decision} />
          </div>
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Channel</p>
            <p className="text-2xl font-bold text-text-primary">
              {test.channel === 'multichannel' ? '🔗 Multi' : test.channel === 'email' ? '📧 Email' : '📱 Social'}
            </p>
          </div>
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Total Samples</p>
            <p className="text-2xl font-bold text-text-primary">{test.total_samples}</p>
          </div>
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Avg Engagement</p>
            <p className="text-2xl font-bold text-text-primary">{test.avg_engagement_rate.toFixed(2)}%</p>
          </div>
        </div>

        {/* Latest Decision & Confidence */}
        {latestEvaluation && (
          <div className="bg-bg-card border border-border-subtle rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Latest Evaluation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <ConfidenceMeter
                  score={latestEvaluation.confidence_score}
                  threshold={0.95}
                  label="Confidence Score"
                />
              </div>
              <div>
                <PerformanceDelta delta={latestEvaluation.performance_delta} label="Performance Delta" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Decision</p>
                <p className="text-lg font-bold text-accent-500 capitalize">{latestEvaluation.decision.replace(/_/g, ' ')}</p>
                <p className="text-xs text-text-secondary mt-2">
                  {format(new Date(latestEvaluation.evaluated_at), 'MMM d, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
            {latestEvaluation.decision === 'promote' && (
              <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-success-700 font-medium">
                  🏆 {latestEvaluation.winning_variant_id} is promoted with{' '}
                  {(latestEvaluation.confidence_score * 100).toFixed(0)}% confidence
                </p>
              </div>
            )}
            {latestEvaluation.decision === 'terminate' && (
              <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-error-700 font-medium">
                  ❌ {latestEvaluation.winning_variant_id} has been terminated due to underperformance
                </p>
              </div>
            )}
            {latestEvaluation.decision === 'continue_test' && (
              <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-warning-700 font-medium">
                  ⏳ Test continues - confidence below threshold ({(latestEvaluation.confidence_score * 100).toFixed(0)}% &lt; 95%)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Variant Comparison */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Variant Metrics</h2>
          <VariantComparison
            variants={variants.map((v) => ({
              variant_id: v.variant_id,
              engagement_rate: v.engagement_rate,
              click_through_rate: v.click_through_rate,
              sample_size: v.sample_size,
            }))}
            winningVariantId={latestEvaluation?.winning_variant_id}
          />
        </div>

        {/* Evaluation History */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Evaluation History</h2>
          {evaluations.length === 0 ? (
            <p className="text-text-muted">No evaluations yet</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {evaluations.map((eval_) => (
                <div
                  key={eval_.id}
                  className="border border-border-subtle rounded-lg p-4 bg-bg-hover hover:bg-bg-card transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-text-primary capitalize">{eval_.decision.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {format(new Date(eval_.evaluated_at), 'MMM d, yyyy HH:mm:ss')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">{(eval_.confidence_score * 100).toFixed(0)}%</p>
                      <p className="text-xs text-text-secondary">confidence</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Winner: </span>
                      <span className="font-medium text-text-primary">{eval_.winning_variant_id}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Delta: </span>
                      <span className={`font-medium ${eval_.performance_delta >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {eval_.performance_delta > 0 ? '+' : ''}{eval_.performance_delta.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Timeline */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-8 mt-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Test Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 rounded-full bg-accent-500 mt-2" />
              <div>
                <p className="font-medium text-text-primary">Test Started</p>
                <p className="text-sm text-text-secondary">{format(new Date(test.started_at), 'MMM d, yyyy HH:mm:ss')}</p>
              </div>
            </div>
            {test.evaluation_window_end_at && (
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-info-500 mt-2" />
                <div>
                  <p className="font-medium text-text-primary">Evaluation Window Ends</p>
                  <p className="text-sm text-text-secondary">
                    {format(new Date(test.evaluation_window_end_at), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>
            )}
            {latestEvaluation && (
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-success-500 mt-2" />
                <div>
                  <p className="font-medium text-text-primary">Latest Evaluation</p>
                  <p className="text-sm text-text-secondary">
                    {format(new Date(latestEvaluation.evaluated_at), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
