'use client';

/**
 * Payment Success Page - Phase 3 Step 6
 *
 * Displayed after successful payment via Stripe checkout.
 * Shows confirmation and triggers next step (project creation).
 *
 * URL: /client/proposals/success?session_id=cs_xxx
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Optional: Verify session with backend
    if (sessionId) {
      console.log('Payment session ID:', sessionId);
    }
  }, [sessionId]);

  function handleContinue() {
    setRedirecting(true);
    // Redirect to projects page (Phase 3 Step 7 - Project Creation)
    router.push('/client/projects?new=true');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
      <div className="max-w-2xl w-full bg-white/[0.02] border border-white/[0.06] rounded-sm px-12 py-12">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-sm flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-[#00FF88]" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold font-mono text-white">
            Payment Successful!
          </h1>
          <p className="text-lg font-mono text-white/40">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
          <span className="inline-block text-xs font-mono font-bold px-3 py-1 rounded-sm bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88]">
            Order Confirmed
          </span>
        </div>

        {/* Next Steps */}
        <div className="bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-[#00F5FF] mb-3">
            What happens next?
          </h2>
          <ul className="space-y-2 text-sm font-mono text-white/40">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00FF88] mt-0.5 flex-shrink-0" />
              <span>Your project will be created automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00FF88] mt-0.5 flex-shrink-0" />
              <span>You&apos;ll receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00FF88] mt-0.5 flex-shrink-0" />
              <span>Our team will reach out within 1-2 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00FF88] mt-0.5 flex-shrink-0" />
              <span>You can track project progress in your dashboard</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleContinue}
            disabled={redirecting}
            className="flex-1 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {redirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                View Project
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/client')}
            className="flex-1 bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-4 py-2"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Session Info (for debugging) */}
        {sessionId && (
          <p className="text-xs text-center font-mono text-white/20 mt-6">
            Session ID: {sessionId}
          </p>
        )}
      </div>
    </div>
  );
}
