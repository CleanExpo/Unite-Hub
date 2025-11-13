import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, cancelImmediately } = await req.json();
    
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 });
    }

    const updated = cancelImmediately
      ? await stripe.subscriptions.cancel(subscriptionId, { prorate: true })
      : await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
