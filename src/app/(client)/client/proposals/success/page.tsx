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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
      <Card className="max-w-2xl w-full bg-gray-900 border-gray-800">
        <CardContent className="pt-12 pb-12">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-100">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-400">
              Thank you for your purchase. Your payment has been processed successfully.
            </p>
            <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
              Order Confirmed
            </Badge>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-300 mb-3">
              What happens next?
            </h2>
            <ul className="space-y-2 text-sm text-blue-200/70">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Your project will be created automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You'll receive a confirmation email shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Our team will reach out within 1-2 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You can track project progress in your dashboard</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleContinue}
              disabled={redirecting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  View Project
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button
              onClick={() => router.push('/client')}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Session Info (for debugging) */}
          {sessionId && (
            <p className="text-xs text-center text-gray-600 mt-6">
              Session ID: {sessionId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
