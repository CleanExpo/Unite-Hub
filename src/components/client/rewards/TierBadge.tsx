import { Card } from '@/components/ui/card';

export interface TierBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: string;
}

const TIER_CONFIG = {
  bronze: {
    emoji: '🥉',
    label: 'Bronze',
    color: 'from-amber-100 to-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
  },
  silver: {
    emoji: '🥈',
    label: 'Silver',
    color: 'from-gray-100 to-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
  },
  gold: {
    emoji: '🥇',
    label: 'Gold',
    color: 'from-yellow-100 to-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
  },
  platinum: {
    emoji: '👑',
    label: 'Platinum',
    color: 'from-purple-100 to-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
  },
};

export function TierBadge({ tier, unlockedAt }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const unlockedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Card className={`p-6 bg-gradient-to-br ${config.color} border-2 ${config.border}`}>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Current Tier
        </h3>

        {/* Tier Badge */}
        <div className="flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-6xl">{config.emoji}</div>
            <div className={`text-3xl font-bold ${config.text}`}>
              {config.label}
            </div>
          </div>
        </div>

        {/* Unlock Date */}
        {unlockedDate && (
          <div className="border-t border-current/20 pt-4 text-center">
            <p className="text-xs text-text-secondary mb-1">Unlocked</p>
            <p className={`font-semibold ${config.text}`}>{unlockedDate}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="border-t border-current/20 pt-4 space-y-1">
          <p className="text-xs font-semibold text-text-secondary mb-2">Benefits</p>
          <ul className="text-xs space-y-1 text-text-secondary">
            <li className="flex items-center gap-2">
              <span>✨</span>
              <span>Exclusive badge on profile</span>
            </li>
            <li className="flex items-center gap-2">
              <span>🎯</span>
              <span>Higher content priority</span>
            </li>
            <li className="flex items-center gap-2">
              <span>🚀</span>
              <span>Featured on leaderboard</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
