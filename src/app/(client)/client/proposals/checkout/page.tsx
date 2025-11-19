'use client';

/**
 * Checkout Redirect Page - Phase 3 Step 6
 *
 * Loading screen that creates a Stripe checkout session and redirects
 * the client to Stripe's secure payment page.
 *
 * Flow:
 * 1. Client selects package on proposals page
 * 2. Redirects to /client/proposals/checkout?ideaId=uuid&tier=better&packageId=uuid
 * 3. This page creates Stripe session via API
 * 4. Redirects to Stripe checkout URL
 * 5. After payment, Stripe redirects to success/cancelled page
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/lib/services/client/paymentService';
import { useToast } from '@/contexts/ToastContext';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [error, setError] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(true);

  // Get parameters from URL
  const ideaId = searchParams.get('ideaId');
  const tier = searchParams.get('tier') as 'good' | 'better' | 'best' | null;
  const packageId = searchParams.get('packageId');

  useEffect(() => {
    // Validate parameters
    if (!ideaId || !tier || !packageId) {
      setError('Missing required parameters. Please return to proposals and try again.');
      setIsCreatingSession(false);
      return;
    }

    if (!['good', 'better', 'best'].includes(tier)) {
      setError('Invalid package tier. Please return to proposals and try again.');
      setIsCreatingSession(false);
      return;
    }

    // Create checkout session
    initiateCheckout();
  }, [ideaId, tier, packageId]);

  async function initiateCheckout() {
    if (!ideaId || !tier || !packageId) return;

    try {
      setIsCreatingSession(true);
      setError(null);

      const result = await createCheckoutSession({
        ideaId,
        tier,
        packageId,
      });

      if (!result.success || !result.sessionUrl) {
        setError(result.error || 'Failed to create checkout session');
        setIsCreatingSession(false);
        return;
      }

      // Redirect to Stripe checkout
      window.location.href = result.sessionUrl;
    } catch (err) {
      console.error('Checkout initiation error:', err);
      setError('Failed to initiate checkout. Please try again.');
      setIsCreatingSession(false);
    }
  }

  // Loading state
  if (isCreatingSession && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Redirecting to Checkout
            </h1>
            <p className="text-gray-400">
              Please wait while we prepare your secure payment page...
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
          </div>
          <p className="text-xs text-gray-600">
            You will be redirected to Stripe's secure checkout page
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6">
        <div className="max-w-md w-full space-y-6">
          <Alert variant="destructive" className="bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push(`/client/proposals?ideaId=${ideaId}`)}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Return to Proposals
            </Button>
            <Button
              onClick={initiateCheckout}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    );
  }

  return null;
}
