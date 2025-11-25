'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Share2, Copy, CheckCircle, Users } from 'lucide-react';

interface ReferralCode {
  id: string;
  code: string;
  campaign: string;
  timesUsed: string;
  referralsAccepted: string;
  totalCreditsIssued: string;
}

interface ReferralInviteWidgetProps {
  workspaceId: string;
  accessToken: string;
  onCodeGenerated?: (code: string) => void;
}

export function ReferralInviteWidget({
  workspaceId,
  accessToken,
  onCodeGenerated,
}: ReferralInviteWidgetProps) {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, [workspaceId, accessToken]);

  async function fetchCodes() {
    try {
      // This would need an endpoint to fetch user's referral codes
      // For now, we'll show the interface ready for integration
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  async function generateCode() {
    setGenerating(true);
    try {
      const response = await fetch('/api/loyalty/referral/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          campaign: 'organic',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const data = await response.json();
      setCodes([...codes, { id: data.code, code: data.code, campaign: data.campaign, timesUsed: '0', referralsAccepted: '0', totalCreditsIssued: '0' }]);
      onCodeGenerated?.(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Referral Program</CardTitle>
            <CardDescription>Invite friends and earn credits</CardDescription>
          </div>
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Generate New Code */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Get Your Referral Code</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Share your unique code with friends. You'll both earn 100 credits per successful referral.
          </p>
          <Button
            onClick={generateCode}
            disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate New Code'}
          </Button>
        </div>

        {/* Existing Codes */}
        {codes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Your Codes</h3>
            {codes.map((code) => (
              <div
                key={code.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-mono font-bold text-teal-600 dark:text-teal-400">
                    {code.code}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Used: {code.timesUsed}x</span>
                    <span>Accepted: {code.referralsAccepted}</span>
                    <span>Credits: {code.totalCreditsIssued}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(code.code)}
                >
                  {copied === code.code ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {codes.length === 0 && !loading && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
              No referral codes yet. Generate one to get started!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
