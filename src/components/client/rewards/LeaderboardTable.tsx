'use client';

import { Card } from '@/components/ui/card';

export interface LeaderboardEntry {
  id: string;
  client_user_id: string;
  points_balance: number;
  points_lifetime: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  monthly_rank?: number;
  leaderboard_rank?: number;
  client_users?: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
}

export interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
}

const TIER_EMOJI = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '👑',
};

export function LeaderboardTable({
  leaderboard,
  currentUserId,
}: LeaderboardTableProps) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className="p-6 text-center bg-bg-card">
        <p className="text-text-secondary">No leaderboard data yet</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                Member
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                Points
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-text-primary">
                Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => {
              const isCurrentUser = entry.client_user_id === currentUserId;
              const userName =
                entry.client_users?.user_metadata?.name ||
                entry.client_users?.email?.split('@')[0] ||
                'Anonymous';

              return (
                <tr
                  key={entry.id}
                  className={`border-b border-border transition-colors ${
                    isCurrentUser
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'bg-bg-base hover:bg-bg-card'
                  }`}
                >
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-accent-500">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-white text-xs font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {userName}
                        {isCurrentUser && <span className="text-xs text-accent-500 ml-1">(You)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-text-primary">
                      {entry.points_balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-xl">
                        {TIER_EMOJI[entry.tier]}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="bg-bg-secondary border-t border-border p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-text-secondary">Total Members</p>
            <p className="text-lg font-bold text-text-primary">
              {leaderboard.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Top Score</p>
            <p className="text-lg font-bold text-accent-500">
              {leaderboard[0]?.points_balance.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Avg Points</p>
            <p className="text-lg font-bold text-text-primary">
              {Math.round(
                leaderboard.reduce((sum, e) => sum + e.points_balance, 0) /
                  leaderboard.length
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
