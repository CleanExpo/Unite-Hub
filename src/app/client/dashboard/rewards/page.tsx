import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import {
  getLeaderboard,
  getClientGamification,
  getContributionImpact,
} from '@/lib/services/client-contribution';
import { PointsDisplay } from '@/components/client/rewards/PointsDisplay';
import { LeaderboardTable } from '@/components/client/rewards/LeaderboardTable';
import { TierBadge } from '@/components/client/rewards/TierBadge';
import { ImpactCard } from '@/components/client/rewards/ImpactCard';

export const metadata = {
  title: 'Rewards & Leaderboard',
  description: 'Track your points, tier, and impact',
};

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  const { workspaceId } = await searchParams;

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Missing workspace ID</h1>
          <p className="text-text-secondary">Please access this page from your client dashboard</p>
        </div>
      </div>
    );
  }

  try {
    // Validate user and workspace
    const { user } = await validateUserAndWorkspace(null, workspaceId);

    // Fetch data in parallel
    const [gam, leaderboard, impact] = await Promise.all([
      getClientGamification(workspaceId, user.id),
      getLeaderboard(workspaceId, 10),
      getContributionImpact(workspaceId, user.id),
    ]);

    return (
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">Rewards & Leaderboard</h1>
          <p className="text-text-secondary">
            Track your impact and see how your contributions help
          </p>
        </div>

        {/* Points & Tier Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PointsDisplay
            balance={gam?.points_balance || 0}
            lifetime={gam?.points_lifetime || 0}
          />
          <TierBadge
            tier={gam?.tier || 'bronze'}
            unlockedAt={gam?.tier_unlocked_at}
          />
        </div>

        {/* Impact Metrics */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Your Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ImpactCard
              label="Total Impressions"
              value={impact?.total_impressions || 0}
              icon="📊"
              subtext="People who saw your content"
            />
            <ImpactCard
              label="Keywords Ranked #1"
              value={impact?.keywords_ranked || 0}
              icon="🏆"
              subtext="Top rankings influenced"
            />
            <ImpactCard
              label="Contribution Streak"
              value={gam?.contribution_streak || 0}
              icon="🔥"
              subtext="Days in a row contributing"
            />
          </div>
        </div>

        {/* Engagement Rate */}
        {impact && (
          <div className="bg-bg-card rounded-lg p-4 border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Avg Engagement Rate</p>
                <p className="text-2xl font-bold text-accent-500">
                  {impact.avg_engagement_rate?.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Contributions</p>
                <p className="text-2xl font-bold text-accent-500">
                  {impact.total_contributions}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Monthly Leaderboard</h2>
          <LeaderboardTable
            leaderboard={leaderboard}
            currentUserId={user.id}
          />
        </div>

        {/* How It Works */}
        <div className="bg-info-50 border border-info-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-text-primary">How to Earn Points</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span>📹</span>
              <div>
                <p className="font-semibold">Video</p>
                <p className="text-text-secondary">100 pts</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>📷</span>
              <div>
                <p className="font-semibold">Photo</p>
                <p className="text-text-secondary">50 pts</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>🎤</span>
              <div>
                <p className="font-semibold">Voice</p>
                <p className="text-text-secondary">40 pts</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>⭐</span>
              <div>
                <p className="font-semibold">Review</p>
                <p className="text-text-secondary">30 pts</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>❓</span>
              <div>
                <p className="font-semibold">FAQ</p>
                <p className="text-text-secondary">35 pts</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>📝</span>
              <div>
                <p className="font-semibold">Text</p>
                <p className="text-text-secondary">25 pts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Progression */}
        <div className="bg-gradient-to-r from-accent-50 to-pink-50 border border-accent-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-text-primary">Tier Levels</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥉</span>
                <span className="font-semibold">Bronze</span>
              </div>
              <span className="text-sm text-text-secondary">0-499 pts</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥈</span>
                <span className="font-semibold">Silver</span>
              </div>
              <span className="text-sm text-text-secondary">500-1,499 pts</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥇</span>
                <span className="font-semibold">Gold</span>
              </div>
              <span className="text-sm text-text-secondary">1,500-3,499 pts</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <span className="font-semibold">Platinum</span>
              </div>
              <span className="text-sm text-text-secondary">3,500+ pts</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading rewards:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Error loading rewards</h1>
          <p className="text-text-secondary">Please try again later</p>
        </div>
      </div>
    );
  }
}
