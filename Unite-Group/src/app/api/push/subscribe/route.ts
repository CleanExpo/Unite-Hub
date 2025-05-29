import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// Schema for push subscription validation
const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

/**
 * API Route to handle push notification subscription registration
 * POST /api/push/subscribe
 */
export async function POST(request: NextRequest) {
  try {
    // Get the subscription object from the request
    const subscription = await request.json();
    
    // Validate the subscription object
    const validationResult = PushSubscriptionSchema.safeParse(subscription);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid subscription format', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Get the Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Common subscription data
    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expiration_time: subscription.expirationTime || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // If the user is logged in, associate the subscription with their user ID
    if (session) {
      const userId = session.user.id;
      
      // Store the subscription in the database
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            ...subscriptionData,
            user_id: userId,
          },
          { onConflict: 'endpoint' }
        )
        .select();
      
      if (error) {
        console.error('Error storing push subscription:', error);
        return NextResponse.json(
          { error: 'Failed to store subscription' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: true, message: 'Subscription stored successfully', data },
        { status: 200 }
      );
    } else {
      // For anonymous users, store the subscription without a user ID
      // This allows for site-wide notifications even for non-logged-in users
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert(
          subscriptionData,
          { onConflict: 'endpoint' }
        )
        .select();
      
      if (error) {
        console.error('Error storing anonymous push subscription:', error);
        return NextResponse.json(
          { error: 'Failed to store subscription' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: true, message: 'Anonymous subscription stored successfully', data },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in push subscription handler:', error);
    return NextResponse.json(
      { error: 'Server error processing push subscription' },
      { status: 500 }
    );
  }
}
