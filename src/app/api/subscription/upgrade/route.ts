import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, newPriceId } = await req.json();
    
    if (!subscriptionId || !newPriceId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice',
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
