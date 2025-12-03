'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface RedemptionRequest {
  id: string;
  userId: string;
  userName?: string;
  rewardName: string;
  creditAmount: string;
  status: string;
  createdAt: string;
  founderNotes?: string;
}

interface RedemptionApprovalQueueProps {
  workspaceId: string;
  accessToken: string;
  onApprovalChange?: () => void;
}

export function RedemptionApprovalQueue({
  workspaceId,
  accessToken,
  onApprovalChange,
}: RedemptionApprovalQueueProps) {
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, [workspaceId, accessToken]);

  async function fetchPendingRequests() {
    try {
      // This endpoint would be created to get pending redemptions
      const response = await fetch(
        `/api/loyalty/founder/redemption-queue?workspaceId=${workspaceId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pending requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(requestId: string, approve: boolean) {
    setProcessingId(requestId);
    try {
      const response = await fetch('/api/loyalty/founder/approve-redemption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          requestId,
          approved: approve,
          founderNotes: approve
            ? 'Approved by founder'
            : 'Rejected by founder - insufficient justification',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      // Refresh list
      setRequests(requests.filter((r) => r.id !== requestId));
      onApprovalChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-sm">Loading pending requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Redemption Approval Queue</CardTitle>
            <CardDescription>Review pending reward redemption requests</CardDescription>
          </div>
          {requests.length > 0 && (
            <Badge variant="default" className="bg-blue-600">
              {requests.length} Pending
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {requests.length === 0 ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
              No pending redemption requests. All caught up!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border border-border-subtle rounded-lg p-4 hover:bg-bg-hover/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">
                      {request.rewardName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <User className="w-4 h-4" />
                      <span>{request.userName || request.userId}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {request.creditAmount}
                    </p>
                    <p className="text-xs text-muted-foreground">credits</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>
                    Requested {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {request.founderNotes && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 mb-4 text-sm">
                    <p className="font-semibold text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-text-secondary">{request.founderNotes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproval(request.id, true)}
                    disabled={processingId === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleApproval(request.id, false)}
                    disabled={processingId === request.id}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
