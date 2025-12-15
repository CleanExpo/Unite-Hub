/**
 * Decision Circuits Releases Page
 * Canary phases, active versions, rollback history
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getReleaseState } from '@/lib/decision-circuits/dashboard-service';
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

export default async function ReleasesPage() {
  const workspaceId = await getWorkspaceId();

  let releaseStates = [];
  let releaseError = null;

  try {
    releaseStates = await getReleaseState(workspaceId, 50);
  } catch (error) {
    console.error('Failed to fetch release state:', error);
    releaseError = error instanceof Error ? error.message : 'Unknown error';
  }

  const activeRelease = releaseStates.find((r) => r.status === 'active');
  const canaryReleases = releaseStates.filter((r) => r.status === 'canary');
  const rolledBack = releaseStates.filter((r) => r.status === 'rolled_back');

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Releases & Rollbacks</h1>
            <p className="text-text-secondary">Circuit version management and canary rollout status</p>
          </div>
          <Link
            href="/crm/decision-circuits"
            className="px-4 py-2 bg-accent-500 text-bg-base rounded hover:bg-accent-600 transition-colors font-medium"
          >
            ← Back
          </Link>
        </div>

        {releaseError ? (
          <div className="bg-error-50 border border-error-500 rounded-lg p-6">
            <p className="text-error-500 font-medium">Error loading releases: {releaseError}</p>
          </div>
        ) : (
          <>
            {/* Active Release */}
            {activeRelease && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Active Release</h2>
                <div className="bg-success-50 border border-success-500 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-text-primary font-semibold text-lg mb-1">
                        Version {activeRelease.version}
                      </p>
                      <p className="text-text-secondary text-sm">
                        Started {format(new Date(activeRelease.started_at), 'MMM d, yyyy HH:mm:ss')}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-success-500 text-white rounded-sm text-sm font-medium">
                      ✓ Active
                    </span>
                  </div>
                  {activeRelease.current_phase && (
                    <div>
                      <p className="text-text-secondary text-sm mb-2">Current Phase</p>
                      <p className="text-text-primary font-medium mb-3">{activeRelease.current_phase}</p>
                      <div className="w-full bg-bg-card rounded-full h-2">
                        <div
                          className="bg-success-500 h-2 rounded-full transition-all"
                          style={{ width: `${activeRelease.phase_progress}%` }}
                        ></div>
                      </div>
                      <p className="text-text-muted text-xs mt-2">
                        Progress: {activeRelease.phase_progress}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Canary Releases */}
            {canaryReleases.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Canary Rollouts ({canaryReleases.length})
                </h2>
                <div className="space-y-4">
                  {canaryReleases.map((release) => (
                    <div
                      key={release.id}
                      className="bg-bg-card border border-warning-500 border-l-4 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-text-primary font-semibold mb-1">
                            Version {release.version}
                          </p>
                          <p className="text-text-secondary text-sm">
                            {format(new Date(release.started_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-warning-50 text-warning-500 rounded text-xs font-medium">
                          🚀 Canary
                        </span>
                      </div>
                      {release.current_phase && (
                        <div>
                          <p className="text-text-muted text-xs mb-2">{release.current_phase}</p>
                          <div className="w-full bg-bg-hover rounded-full h-2">
                            <div
                              className="bg-warning-500 h-2 rounded-full transition-all"
                              style={{ width: `${release.phase_progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rollback History */}
            {rolledBack.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Rollback History ({rolledBack.length})
                </h2>
                <div className="space-y-3">
                  {rolledBack.slice(0, 10).map((release) => (
                    <div
                      key={release.id}
                      className="bg-bg-card border border-error-500 border-l-4 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-text-primary font-semibold text-sm mb-1">
                            Version {release.version}
                          </p>
                          <p className="text-text-secondary text-xs">
                            Rolled back {format(new Date(release.completed_at || ''), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-error-50 text-error-500 rounded text-xs font-medium">
                          ↩️ Rolled Back
                        </span>
                      </div>
                      {release.rollback_reason && (
                        <p className="text-error-500 text-xs mt-2">
                          Reason: {release.rollback_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {releaseStates.length === 0 && (
              <div className="bg-bg-card border border-border-subtle rounded-lg p-8 text-center">
                <p className="text-text-muted">No release data available</p>
              </div>
            )}
          </>
        )}

        {/* Information */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Release Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">🚀 Canary Rollouts</h4>
              <p className="text-text-secondary text-sm">
                Gradual rollout with health checks at each phase
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">✓ Active Releases</h4>
              <p className="text-text-secondary text-sm">
                Production versions currently handling traffic
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent-500 mb-2">↩️ Rollback Triggers</h4>
              <p className="text-text-secondary text-sm">
                Automatic rollback on health check failures
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
