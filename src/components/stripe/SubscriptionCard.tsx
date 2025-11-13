'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface SubscriptionCardProps {
  subscription: {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    planTier: 'starter' | 'professional';
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
  };
  customerId: string;
}

export function SubscriptionCard({ subscription, customerId }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'past_due':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = (tier: string) => {
    return tier === 'professional' ? 'Professional Plan' : 'Starter Plan';
  };

  const getPlanPrice = (tier: string) => {
    return tier === 'professional' ? '$549' : '$249';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{getPlanName(subscription.planTier)}</CardTitle>
            <CardDescription className="text-lg mt-1">
              {getPlanPrice(subscription.planTier)}/month + GST
            </CardDescription>
          </div>
          <Badge className={getStatusColor(subscription.status)}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Subscription Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Next Billing Date</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Your subscription will cancel on {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleManageSubscription}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {loading ? 'Loading...' : 'Manage Subscription'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Update payment method, view invoices, or cancel
          </p>
        </div>

        {/* Plan Features */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Plan Includes:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ AI-Powered Content Calendar</li>
            <li>✓ Email Sequence Builder</li>
            <li>✓ Landing Page Generator</li>
            <li>✓ Social Media Templates</li>
            <li>✓ Competitor Analysis</li>
            {subscription.planTier === 'professional' && (
              <>
                <li>✓ Unlimited Clients</li>
                <li>✓ Priority Support</li>
                <li>✓ Advanced Analytics</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
