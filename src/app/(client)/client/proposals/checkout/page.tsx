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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <Loader2 className="w-16 h-16 text-[#00F5FF] animate-spin mx-auto" />
          <div>
            <h1 className="text-2xl font-bold font-mono text-white mb-2">
              Redirecting to Checkout
            </h1>
            <p className="text-white/40 font-mono">
              Please wait while we prepare your secure payment page...
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-white/30">
            <div className="w-2 h-2 bg-[#00F5FF] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#00F5FF] rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-[#00F5FF] rounded-full animate-pulse delay-150"></div>
          </div>
          <p className="text-xs font-mono text-white/20">
            You will be redirected to Stripe&apos;s secure checkout page
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-[#FF4444] mt-0.5 flex-shrink-0" />
            <p className="text-sm font-mono text-[#FF4444]">{error}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/client/proposals?ideaId=${ideaId}`)}
              className="flex-1 bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5"
            >
              Return to Proposals
            </button>
            <button
              onClick={initiateCheckout}
              className="flex-1 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2"
            >
              Try Again
            </button>
          </div>

          <p className="text-xs text-center font-mono text-white/30">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    );
  }

  return null;
}
