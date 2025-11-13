'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutButtonProps {
  amount: number;
  productName: string;
  description: string;
  priceId?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable Stripe Checkout Button Component
 *
 * @param amount - Amount in cents (e.g., 9999 for $99.99)
 * @param productName - Name of the product/subscription
 * @param description - Description shown in checkout
 * @param priceId - Optional Stripe Price ID (for subscriptions)
 */
export function CheckoutButton({
  amount,
  productName,
  description,
  priceId,
  variant = 'default',
  className,
  children,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          productName,
          description,
          priceId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      if (!sessionId) {
        throw new Error('No session ID returned from server');
      }

      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={loading}
        variant={variant}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          children || 'Subscribe Now'
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
