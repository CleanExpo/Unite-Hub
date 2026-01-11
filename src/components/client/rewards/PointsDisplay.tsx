import { Card } from '@/components/ui/card';

export interface PointsDisplayProps {
  balance: number;
  lifetime: number;
}

export function PointsDisplay({ balance, lifetime }: PointsDisplayProps) {
  const progress = (balance / 500) * 100; // Silver tier at 500 points

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Current Balance
        </h3>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-5xl font-bold text-accent-500">{balance}</div>
            <span className="text-sm text-text-secondary">points</span>
          </div>
          <p className="text-xs text-text-secondary">
            {500 - balance} more points to Silver tier
          </p>
        </div>

        {/* Progress Bar to Next Tier */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-accent-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Bronze</span>
            <span>Silver</span>
          </div>
        </div>

        {/* Lifetime Stats */}
        <div className="border-t border-blue-200 pt-4">
          <p className="text-xs text-text-secondary mb-2">Lifetime Points</p>
          <p className="text-2xl font-bold text-text-primary">{lifetime}</p>
        </div>
      </div>
    </Card>
  );
}
