'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  creditCost: string;
  metadata: Record<string, any>;
}

interface RewardRedemptionModalProps {
  isOpen: boolean;
  reward: Reward | null;
  userBalance: string;
  workspaceId: string;
  accessToken: string;
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
}

export function RewardRedemptionModal({
  isOpen,
  reward,
  userBalance,
  workspaceId,
  accessToken,
  onClose,
  onSuccess,
}: RewardRedemptionModalProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setError(null);
      setRequestId(null);
    }
  }, [isOpen]);

  async function handleRedeem() {
    if (!reward) return;

    setStatus('submitting');
    setError(null);

    try {
      const response = await fetch('/api/loyalty/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          rewardId: reward.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit redemption request');
      }

      const data = await response.json();
      setStatus('success');
      setRequestId(data.requestId);
      onSuccess?.(data.requestId);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (!reward) return null;

  const userBalanceBig = BigInt(userBalance);
  const rewardCostBig = BigInt(reward.creditCost);
  const canAfford = userBalanceBig >= rewardCostBig;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redeem Reward</DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? 'Redemption request submitted'
              : 'Complete this redemption'}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your redemption request has been submitted! A founder will review and approve
                within 24 hours.
              </AlertDescription>
            </Alert>

            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-muted-foreground mb-2">Request ID</p>
              <p className="font-mono text-sm break-all">{requestId}</p>
            </Card>

            <p className="text-sm text-muted-foreground">
              You can track the status of your redemption in your account dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reward Details */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-lg mb-2">{reward.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium">Cost</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {reward.creditCost} credits
                </span>
              </div>
            </Card>

            {/* Balance Check */}
            <Card className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <span className={`text-lg font-bold ${
                  canAfford ? 'text-green-600' : 'text-red-600'
                }`}>
                  {userBalance} credits
                </span>
              </div>
              {!canAfford && (
                <Alert className="mt-3 border-red-200 bg-red-50 dark:bg-red-950/30">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200 text-xs">
                    You don't have enough credits for this reward. Earn more credits first.
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            {status === 'error' && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Info Message */}
            <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-800">
              <strong>Note:</strong> Reward redemptions require founder approval. You'll receive
              a notification once it's been processed.
            </p>
          </div>
        )}

        <DialogFooter>
          {status === 'success' ? (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleRedeem}
                disabled={!canAfford || status === 'submitting'}
                className="ml-auto"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Redemption'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
