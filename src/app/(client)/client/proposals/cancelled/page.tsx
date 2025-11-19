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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
      <Card className="max-w-2xl w-full bg-gray-900 border-gray-800">
        <CardContent className="pt-12 pb-12">
          {/* Cancelled Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          {/* Cancelled Message */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-100">
              Payment Cancelled
            </h1>
            <p className="text-lg text-gray-400">
              Your payment was cancelled. No charges have been made to your account.
            </p>
          </div>

          {/* Information Box */}
          <div className="bg-yellow-900/10 border border-yellow-800/30 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-yellow-300 mb-3">
              What you can do:
            </h2>
            <ul className="space-y-2 text-sm text-yellow-200/70">
              <li className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Return to proposals and try again with a different payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowLeft className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Review your package selection before proceeding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">💡</span>
                <span>Contact our support team if you need assistance with payment options</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => router.push('/client')}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-gray-500 mt-6">
            Need help? Contact us at{' '}
            <a href="mailto:support@unite-hub.com" className="text-blue-400 hover:underline">
              support@unite-hub.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
