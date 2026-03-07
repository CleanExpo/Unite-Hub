'use client';

/**
 * Payment Cancelled Page - Phase 3 Step 6
 *
 * Displayed when client cancels Stripe checkout.
 * Provides option to retry payment or return to proposals.
 *
 * URL: /client/proposals/cancelled?idea_id=uuid
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentCancelledPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('idea_id');

  function handleRetry() {
    if (ideaId) {
      router.push(`/client/proposals?ideaId=${ideaId}`);
    } else {
      router.push('/client/ideas');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
      <div className="max-w-2xl w-full bg-white/[0.02] border border-white/[0.06] rounded-sm px-12 py-12">
        {/* Cancelled Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-sm flex items-center justify-center">
            <XCircle className="w-12 h-12 text-[#FFB800]" />
          </div>
        </div>

        {/* Cancelled Message */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold font-mono text-white">
            Payment Cancelled
          </h1>
          <p className="text-lg font-mono text-white/40">
            Your payment was cancelled. No charges have been made to your account.
          </p>
        </div>

        {/* Information Box */}
        <div className="bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-sm p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-[#FFB800] mb-3">
            What you can do:
          </h2>
          <ul className="space-y-2 text-sm font-mono text-white/40">
            <li className="flex items-start gap-2">
              <RefreshCw className="w-4 h-4 text-[#FFB800] mt-0.5 flex-shrink-0" />
              <span>Return to proposals and try again with a different payment method</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowLeft className="w-4 h-4 text-[#FFB800] mt-0.5 flex-shrink-0" />
              <span>Review your package selection before proceeding</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFB800] mt-0.5">&#x1F4A1;</span>
              <span>Contact our support team if you need assistance with payment options</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => router.push('/client')}
            className="flex-1 bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-4 py-2 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center font-mono text-white/30 mt-6">
          Need help? Contact us at{' '}
          <a href="mailto:support@unite-group.in" className="text-[#00F5FF] hover:underline">
            support@unite-group.in
          </a>
        </p>
      </div>
    </div>
  );
}
