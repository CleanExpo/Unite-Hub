'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Award, Target } from 'lucide-react';

interface LoyaltyBalance {
  balance: string;
  lifetimeEarned: string;
  lifetimeRedeemed: string;
  monthlyCap: string;
  monthlyEarned: string;
  monthlyRemaining: string;
  canEarnMore: boolean;
}

interface LoyaltyStatusBannerProps {
  workspaceId: string;
  accessToken: string;
  compact?: boolean;
}

export function LoyaltyStatusBanner({
  workspaceId,
  accessToken,
  compact = false,
}: LoyaltyStatusBannerProps) {
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await fetch(
          `/api/loyalty/credit?workspaceId=${workspaceId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch loyalty balance');
        }

        const data = await response.json();
        setBalance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [workspaceId, accessToken]);

  if (loading) {
    return null;
  }

  if (error || !balance) {
    return null;
  }

  const monthlyEarned = BigInt(balance.monthlyEarned);
  const monthlyCap = BigInt(balance.monthlyCap);
  const monthlyPercent = Math.round((Number(monthlyEarned) / Number(monthlyCap)) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Award className="w-4 h-4 text-accent-600" />
        <span className="font-semibold">{balance.balance} Credits</span>
        {!balance.canEarnMore && (
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-accent-50 to-cyan-50 dark:from-accent-950/30 dark:to-cyan-950/30 border-accent-200 dark:border-accent-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Your Loyalty Credits</CardTitle>
            <CardDescription>Earn rewards and unlock features</CardDescription>
          </div>
          <Award className="w-6 h-6 text-accent-600 dark:text-accent-400" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Current Balance */}
          <div className="bg-bg-card rounded-lg p-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold text-accent-600 dark:text-accent-400">
                  {balance.balance}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Lifetime Earned</p>
                <p className="text-lg font-semibold">{balance.lifetimeEarned}</p>
              </div>
            </div>
          </div>

          {/* Monthly Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Monthly Earning Progress</p>
              <p className="text-xs text-muted-foreground">
                {balance.monthlyEarned} / {balance.monthlyCap}
              </p>
            </div>
            <div className="w-full bg-bg-hover rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  !balance.canEarnMore
                    ? 'bg-yellow-500'
                    : 'bg-accent-500'
                }`}
                style={{ width: `${monthlyPercent}%` }}
              />
            </div>
            {!balance.canEarnMore && (
              <Alert className="mt-3 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  Monthly cap reached. Credits will reset next month.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-raised rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-xs font-semibold text-muted-foreground">Lifetime Redeemed</p>
              </div>
              <p className="text-lg font-bold">{balance.lifetimeRedeemed}</p>
            </div>

            <div className="bg-bg-raised rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-muted-foreground">Monthly Remaining</p>
              </div>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {balance.monthlyRemaining}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
