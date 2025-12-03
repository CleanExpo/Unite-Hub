'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gift, AlertCircle, Lock } from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  creditCost: string;
  isActive: boolean;
  dailyLimit?: string;
  metadata: Record<string, any>;
}

interface RewardCatalogListProps {
  workspaceId: string;
  accessToken: string;
  onRewardSelected?: (rewardId: string) => void;
}

export function RewardCatalogList({
  workspaceId,
  accessToken,
  onRewardSelected,
}: RewardCatalogListProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userBalance, setUserBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, [workspaceId, accessToken]);

  async function fetchRewards() {
    try {
      const response = await fetch(
        `/api/loyalty/rewards?workspaceId=${workspaceId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }

      const data = await response.json();
      setRewards(data.rewards);
      setUserBalance(data.userBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function submitRedemption(rewardId: string) {
    setSelectedReward(rewardId);
    setSubmitting(true);
    try {
      const response = await fetch('/api/loyalty/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          rewardId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit redemption');
      }

      const data = await response.json();
      setError(null);
      onRewardSelected?.(rewardId);
      // Show success or reset state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
      setSelectedReward(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading rewards...</p>
        </CardContent>
      </Card>
    );
  }

  const userBalanceBig = BigInt(userBalance);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Reward Catalog</CardTitle>
            <CardDescription>Redeem your credits for rewards</CardDescription>
          </div>
          <Gift className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Balance Display */}
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Available Credits</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {userBalance}
          </p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Rewards Grid */}
        {rewards.length > 0 ? (
          <div className="space-y-3">
            {rewards.map((reward) => {
              const rewardCostBig = BigInt(reward.creditCost);
              const canAfford = userBalanceBig >= rewardCostBig;

              return (
                <div
                  key={reward.id}
                  className="bg-bg-card border border-border-subtle rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">
                        {reward.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {reward.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-bg-hover px-2 py-1 rounded">
                          {reward.category}
                        </span>
                        {reward.dailyLimit && (
                          <span className="text-xs text-muted-foreground">
                            Limited: {reward.dailyLimit}/day
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {reward.creditCost}
                      </p>
                      <p className="text-xs text-muted-foreground">credits</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => submitRedemption(reward.id)}
                    disabled={!canAfford || submitting || selectedReward === reward.id}
                    className="w-full"
                    variant={canAfford ? 'default' : 'outline'}
                  >
                    {selectedReward === reward.id ? (
                      'Submitting...'
                    ) : !canAfford ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Insufficient Credits
                      </>
                    ) : (
                      'Redeem Now'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
              No rewards available at this time.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
