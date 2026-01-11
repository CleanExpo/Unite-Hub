/**
 * Billing Webhook Handler
 * Phase: D66
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhook } from '@/lib/unite/billingService';

export async function POST(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') || 'stripe';
    const body = await request.json();

    // Currently only Stripe is implemented
    if (provider === 'stripe') {
      await handleStripeWebhook(body.type || 'unknown', body);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ error: 'Provider not supported' }, { status: 400 });
  } catch (error: unknown) {
    console.error('[Webhook Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
