import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { StripeApiClient } from '@/lib/api/stripe/client';

// Input validation schema
const createIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default('aud'),
  description: z.string().optional(),
  customer_id: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  receipt_email: z.string().email().optional(),
  payment_method_types: z.array(z.string()).optional(),
});

/**
 * Create Payment Intent API Endpoint
 * Creates a Stripe payment intent and returns the client secret
 * 
 * @route POST /api/payment/create-intent
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validation = createIntentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { 
      amount, 
      currency, 
      description, 
      customer_id, 
      metadata, 
      receipt_email,
      payment_method_types 
    } = validation.data;
    
    // Initialize Stripe client
    const stripeClient = new StripeApiClient({
      apiKey: process.env.STRIPE_SECRET_KEY || '',
    });
    
    // Create payment intent
    const paymentIntent = await stripeClient.createPaymentIntent({
      amount,
      currency,
      description: description || 'UNITE Group payment',
      customer: customer_id,
      metadata,
      receiptEmail: receipt_email,
      paymentMethodTypes: payment_method_types || ['card'],
    });
    
    // Return client secret and payment intent ID
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
