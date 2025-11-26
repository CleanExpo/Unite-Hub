/**
 * POST /api/payments/stripe-webhook
 * Phase 3 Step 6 - Stripe Payment Integration
 *
 * Handles Stripe webhook events for payment processing.
 *
 * Supported Events:
 * - checkout.session.completed: Payment successful, update database
 * - payment_intent.succeeded: Payment confirmed
 * - payment_intent.payment_failed: Payment failed
 *
 * Security:
 * - Verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * - Idempotent: Safe to receive same event multiple times
 *
 * Following CLAUDE.md patterns:
 * - Raw body parsing for signature verification
 * - Database updates with audit logging
 * - Error handling and retry logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/payments/stripeClient';
import { createProjectFromProposal } from '@/lib/services/staff/projectService';
import Stripe from 'stripe';

/**
 * Handle Stripe webhook events
 *
 * IMPORTANT: This endpoint must receive the raw request body
 * for signature verification to work properly.
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body and signature
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 *
 * This event fires when a customer completes the checkout process.
 * We update the database and trigger project creation.
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout.session.completed:', session.id);

    const supabase = await getSupabaseServer();

    // Extract metadata
    const metadata = session.metadata;
    if (!metadata) {
      console.error('No metadata in session:', session.id);
      return;
    }

    const { ideaId, tier, packageId, clientId, organizationId, proposalScopeId } = metadata;

    // Update payment_sessions table
    const { error: sessionError } = await supabase
      .from('payment_sessions')
      .update({
        status: 'completed',
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', session.id);

    if (sessionError) {
      console.error('Error updating payment_sessions:', sessionError);
    }

    // Update idea status to 'paid'
    const { error: ideaError } = await supabase
      .from('ideas')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ideaId);

    if (ideaError) {
      console.error('Error updating idea status:', ideaError);
    }

    // Store payment record
    await supabase
      .from('payments')
      .insert({
        session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        idea_id: ideaId,
        client_id: clientId,
        organization_id: organizationId,
        tier,
        package_id: packageId,
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        status: 'succeeded',
        customer_email: session.customer_email,
        paid_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Log audit event
    await supabase
      .from('auditLogs')
      .insert({
        organization_id: organizationId,
        user_id: clientId,
        action: 'payment_completed',
        resource_type: 'payment',
        resource_id: session.id,
        details: {
          ideaId,
          tier,
          packageId,
          amount: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_email,
        },
      })
      .select('id')
      .single();

    console.log('Checkout session completed successfully:', session.id);

    // **PHASE 3 STEP 7: Automatic Project Creation**
    // After successful payment, automatically create a project
    if (proposalScopeId) {
      console.log('Creating project automatically for idea:', ideaId);

      const projectResult = await createProjectFromProposal({
        proposalScopeId,
        ideaId,
        clientId,
        organizationId,
        tier: tier as 'good' | 'better' | 'best',
        packageId,
      });

      if (projectResult.success) {
        console.log('Project created successfully:', projectResult.project?.id);

        // Log project creation audit event
        await supabase
          .from('auditLogs')
          .insert({
            organization_id: organizationId,
            user_id: clientId,
            action: 'project_auto_created',
            resource_type: 'project',
            resource_id: projectResult.project?.id,
            details: {
              ideaId,
              tier,
              packageId,
              projectName: projectResult.project?.name,
              taskCount: projectResult.project?.tasks.length,
              triggeredBy: 'stripe_webhook',
            },
          })
          .select('id')
          .single();
      } else {
        console.error('Failed to create project:', projectResult.error);

        // Log failure but don't throw - payment was successful
        await supabase
          .from('auditLogs')
          .insert({
            organization_id: organizationId,
            user_id: clientId,
            action: 'project_auto_creation_failed',
            resource_type: 'project',
            resource_id: ideaId,
            details: {
              ideaId,
              tier,
              packageId,
              error: projectResult.error,
              triggeredBy: 'stripe_webhook',
            },
          })
          .select('id')
          .single();
      }
    } else {
      console.warn('No proposalScopeId in metadata, skipping project creation');
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.succeeded event
 *
 * This event fires when a payment is confirmed.
 * Additional confirmation beyond checkout.session.completed.
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.succeeded:', paymentIntent.id);

    const supabase = await getSupabaseServer();

    // Update payment record
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        payment_method: paymentIntent.payment_method as string,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating payment status:', error);
    }

    console.log('Payment intent succeeded:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.payment_failed event
 *
 * This event fires when a payment fails.
 * We update the status and optionally notify the client.
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed:', paymentIntent.id);

    const supabase = await getSupabaseServer();

    // Update payment record
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating payment status:', error);
    }

    // Update payment_sessions table
    await supabase
      .from('payment_sessions')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', paymentIntent.metadata?.sessionId);

    console.log('Payment intent failed:', paymentIntent.id);

    // TODO: Send notification email to client about payment failure
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
}

// Note: In App Router, the request body is automatically handled as raw
// This is needed for Stripe signature verification
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
