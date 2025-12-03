'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  details?: Record<string, any>;
  createdAt: string;
}

interface LoyaltyHistoryPanelProps {
  workspaceId: string;
  accessToken: string;
  limit?: number;
}

export function LoyaltyHistoryPanel({
  workspaceId,
  accessToken,
  limit = 10,
}: LoyaltyHistoryPanelProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [workspaceId, accessToken, limit]);

  async function fetchHistory() {
    try {
      const response = await fetch(
        `/api/loyalty/history?workspaceId=${workspaceId}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'referral_invite':
      case 'referral_accepted':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'reward_redeemed':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'task_completed':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTransactionBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'referral_invite':
      case 'referral_accepted':
      case 'task_completed':
        return 'default';
      case 'reward_redeemed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-sm">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Transaction History</CardTitle>
            <CardDescription>Recent loyalty credit activity</CardDescription>
          </div>
          <History className="w-5 h-5 text-gray-500" />
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-bg-raised rounded-lg hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {getTransactionLabel(tx.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={getTransactionBadgeVariant(tx.type)} className="text-xs">
                    {tx.type.includes('redeem') ? '−' : '+'} {tx.amount}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
