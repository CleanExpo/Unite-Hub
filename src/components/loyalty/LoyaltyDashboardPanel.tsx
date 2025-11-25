'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Users, AlertTriangle, ArrowRight } from 'lucide-react';

interface LoyaltyStats {
  currentBalance: string;
  monthlyRemaining: string;
  lifetimeEarned: string;
  lifetimeRedeemed: string;
  monthlyProgress: number;
  canEarnMore: boolean;
  recentTransactions: Array<{
    type: string;
    amount: string;
    timestamp: string;
  }>;
  referralStats?: {
    totalCodes: number;
    totalInvitesSent: number;
    totalAccepted: number;
    creditsEarned: string;
  };
}

interface LoyaltyDashboardPanelProps {
  workspaceId: string;
  accessToken: string;
  isTrialUser?: boolean;
  onNavigateToRewards?: () => void;
}

export function LoyaltyDashboardPanel({
  workspaceId,
  accessToken,
  isTrialUser = false,
  onNavigateToRewards,
}: LoyaltyDashboardPanelProps) {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [workspaceId, accessToken]);

  async function fetchStats() {
    try {
      const response = await fetch(
        `/api/loyalty/dashboard?workspaceId=${workspaceId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch loyalty stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-sm">Loading loyalty stats...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
              {error || 'Unable to load loyalty information'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Loyalty & Rewards
            </CardTitle>
            <CardDescription>Track your credits and earning progress</CardDescription>
          </div>
          {isTrialUser && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Trial Mode
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trial Banner */}
        {isTrialUser && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
              Trial users are capped at 5,000 credits per month. Upgrade to earn more.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Current Balance</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.currentBalance}
            </p>
            <p className="text-xs text-muted-foreground mt-1">credits</p>
          </div>

          {/* Monthly Remaining */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Monthly Remaining</p>
            <p className={`text-2xl font-bold ${
              stats.canEarnMore
                ? 'text-green-600 dark:text-green-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {stats.monthlyRemaining}
            </p>
            <p className="text-xs text-muted-foreground mt-1">available</p>
          </div>
        </div>

        {/* Monthly Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Monthly Progress</p>
            <p className="text-xs text-muted-foreground">{stats.monthlyProgress}%</p>
          </div>
          <div
            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden"
            role="progressbar"
            aria-label="Monthly credit earning progress"
            aria-valuenow="50"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              className={`h-2.5 rounded-full transition-all ${
                !stats.canEarnMore ? 'bg-yellow-500' : 'bg-purple-500'
              }`}
              style={{
                width: `${Math.min(stats.monthlyProgress, 100)}%`,
              }}
            />
          </div>
          {!stats.canEarnMore && (
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
              Monthly cap reached. Resets {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>

        {/* Lifetime Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Lifetime Earned</p>
            <p className="text-lg font-bold text-green-600">{stats.lifetimeEarned}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Lifetime Redeemed</p>
            <p className="text-lg font-bold text-orange-600">{stats.lifetimeRedeemed}</p>
          </div>
        </div>

        {/* Referral Stats (if available) */}
        {stats.referralStats && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="font-semibold text-sm">Referral Activity</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Codes</p>
                <p className="text-lg font-bold">{stats.referralStats.totalCodes}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Accepted</p>
                <p className="text-lg font-bold text-green-600">{stats.referralStats.totalAccepted}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="text-lg font-bold text-purple-600">{stats.referralStats.creditsEarned}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {stats.recentTransactions && stats.recentTransactions.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="font-semibold text-sm mb-3">Recent Activity</p>
            <div className="space-y-2">
              {stats.recentTransactions.slice(0, 3).map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground capitalize">{tx.type.replace('_', ' ')}</span>
                  <span className={`font-semibold ${
                    tx.type.includes('redeem') ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {tx.type.includes('redeem') ? '−' : '+'} {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onNavigateToRewards}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            disabled={isTrialUser}
          >
            <Gift className="w-4 h-4 mr-2" />
            View Rewards
          </Button>
          <Button variant="outline" className="flex-1">
            <TrendingUp className="w-4 h-4 mr-2" />
            Learn More
          </Button>
        </div>

        {isTrialUser && (
          <p className="text-xs text-center text-muted-foreground">
            Upgrade your account to redeem rewards
          </p>
        )}
      </CardContent>
    </Card>
  );
}
