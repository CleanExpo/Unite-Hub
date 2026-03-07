/**
 * Stripe Webhook Handler for Managed Service Subscriptions
 * POST /api/founder/webhooks/stripe-managed-service
 *
 * Listens for Stripe events:
 * - customer.created: New customer
 * - customer.subscription.created: New managed service subscription
 * - customer.subscription.updated: Subscription changes (paused, cancelled, etc.)
 * - invoice.payment_succeeded: Payment received
 * - invoice.payment_failed: Payment failed (alert)
 *
 * Automatically:
 * 1. Creates managed_service_project record
 * 2. Initiates timeline phases
 * 3. Creates initial tasks for orchestrator
 * 4. Sends onboarding email
 * 5. Records stripe event for audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import Stripe from 'stripe';

const logger = createApiLogger({ route: '/api/founder/webhooks/stripe-managed-service' });

// Initialize Stripe lazily to avoid build-time errors
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, any>;
  };
}

/**
 * Verify Stripe webhook signature
 */
function verifyWebhookSignature(
  body: string,
  signature: string
): StripeEvent | null {
  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as StripeEvent;
    return event;
  } catch (error) {
    logger.warn('❌ Webhook signature verification failed', { error });
    return null;
  }
}

/**
 * Extract service tier from Stripe product metadata
 */
function extractServiceTier(product: any): string {
  const metadata = product?.metadata || {};
  if (metadata.service_tier === 'professional') return 'professional';
  if (metadata.service_tier === 'enterprise') return 'enterprise';
  return 'starter';  // Default to starter
}

/**
 * Extract service type from Stripe product metadata
 */
function extractServiceType(product: any): string {
  const metadata = product?.metadata || {};
  return metadata.service_type || 'seo_management';  // Default to SEO
}

/**
 * Get monthly hours from product metadata
 */
function extractMonthlyHours(product: any): number {
  const metadata = product?.metadata || {};
  const hours = parseInt(metadata.monthly_hours || '20', 10);
  return Math.max(1, hours);  // Minimum 1 hour
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(event: StripeEvent, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  logger.info('📋 New managed service subscription', {
    customerId,
    subscriptionId: subscription.id,
  });

  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = (customer as any).email || 'unknown@example.com';
    const customerName = (customer as any).name || 'Unknown Customer';

    // Get product details (service tier, type, hours)
    const lineItems = subscription.items.data;
    const firstItem = lineItems[0];
    const priceId = firstItem.price.id;
    const price = await stripe.prices.retrieve(priceId);
    const productId = price.product as string;
    const product = await stripe.products.retrieve(productId);

    const serviceTier = extractServiceTier(product);
    const serviceType = extractServiceType(product);
    const monthlyHours = extractMonthlyHours(product);
    const monthlyAmount = firstItem.price.unit_amount || 0;

    // Get tenant ID (organization) - could be from customer metadata
    const productMetadata = (product as any).metadata || {};
    const tenantId = productMetadata.tenant_id || customer.metadata?.tenant_id;

    if (!tenantId) {
      logger.warn('⚠️ Subscription created without tenant_id', { customerId });
      return;
    }

    // Create managed service project
    const { data: project, error: projectError } = await supabase
      .from('managed_service_projects')
      .insert({
        tenant_id: tenantId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        project_name: `${serviceType.replace(/_/g, ' ').toUpperCase()} - ${customerName}`,
        service_type: serviceType,
        service_tier: serviceTier,
        monthly_hours: monthlyHours,
        monthly_cost_cents: monthlyAmount,
        status: 'pending',  // Will move to 'active' after onboarding
        start_date: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
        client_name: customerName,
        client_email: customerEmail,
        metadata: {
          stripe_metadata: product.metadata,
          created_via: 'webhook',
        },
      })
      .select()
      .single();

    if (projectError) {
      logger.error('❌ Failed to create project', { projectError });
      return;
    }

    logger.info('✅ Managed service project created', { projectId: project.id });

    // Create initial timeline phase (Discovery & Baseline)
    const { data: timeline, error: timelineError } = await supabase
      .from('managed_service_timelines')
      .insert({
        project_id: project.id,
        phase_number: 1,
        phase_name: 'Discovery & Baseline',
        start_date: new Date().toISOString().split('T')[0],
        planned_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // 2 weeks
        description: 'Understand current state, collect baseline metrics, and define success criteria',
        key_activities: [
          'Website audit and analysis',
          'Competitor research',
          'Current metrics baseline collection',
          'Success criteria definition',
        ],
        deliverables: [
          { name: 'Website Audit Report', format: 'PDF', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { name: 'Baseline Metrics', format: 'Dashboard', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { name: 'Strategy Framework', format: 'Document', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        ],
        status: 'in_progress',
      })
      .select()
      .single();

    if (timelineError) {
      logger.error('❌ Failed to create timeline phase', { timelineError });
      return;
    }

    logger.info('✅ Timeline phase created', { timelineId: timeline.id });

    // Create initial discovery tasks for orchestrator
    const tasks = [
      {
        task_name: 'Conduct Website Audit',
        task_type: 'analysis',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        task_name: 'Collect Baseline Metrics',
        task_type: 'monitoring',
        priority: 'high',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        task_name: 'Research Competitors',
        task_type: 'analysis',
        priority: 'normal',
        due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];

    const { error: tasksError } = await supabase
      .from('managed_service_tasks')
      .insert(
        tasks.map(task => ({
          project_id: project.id,
          timeline_id: timeline.id,
          task_name: task.task_name,
          task_type: task.task_type,
          priority: task.priority,
          due_date: task.due_date,
          status: 'pending',
          description: `Initial ${task.task_name.toLowerCase()} for baseline assessment`,
          required_inputs: {},
          expected_outputs: {},
        }))
      );

    if (tasksError) {
      logger.error('❌ Failed to create initial tasks', { tasksError });
    } else {
      logger.info('✅ Initial tasks created for orchestrator');
    }

    // Send onboarding email (will be queued, not sent immediately)
    await supabase
      .from('managed_service_notifications')
      .insert({
        project_id: project.id,
        recipient_email: customerEmail,
        notification_type: 'onboarding',
        subject: `Welcome to ${serviceType.replace(/_/g, ' ').toUpperCase()}!`,
        email_body_html: `
          <h1>Welcome to Your Managed Service Project</h1>
          <p>Hi ${customerName},</p>
          <p>Your ${serviceTier.toUpperCase()} plan is now active with ${monthlyHours} hours per month allocated.</p>
          <p>We're kicking off your project and will begin the Discovery & Baseline phase immediately.</p>
          <p>Expect your first report in 7-10 days with baseline metrics and initial recommendations.</p>
          <p>Questions? Reply to this email or contact us directly.</p>
          <p>Best regards,<br>The Managed Service Team</p>
        `,
        email_body_text: `Welcome to Your Managed Service Project\n\nHi ${customerName},\n\nYour ${serviceTier.toUpperCase()} plan is now active with ${monthlyHours} hours per month.\n\nWe're starting your project immediately.\n\nBest regards, The Managed Service Team`,
        status: 'pending',
      });

    logger.info('✅ Onboarding notification queued', { customerEmail });

  } catch (error) {
    logger.error('❌ Error handling subscription created', { error });
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(event: StripeEvent, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  const newStatus = subscription.status;

  logger.info('📝 Subscription updated', {
    customerId,
    subscriptionId: subscription.id,
    newStatus,
  });

  // Map Stripe status to project status
  let projectStatus = 'active';
  if (newStatus === 'paused') projectStatus = 'paused';
  if (newStatus === 'canceled') projectStatus = 'cancelled';

  // Update project status
  const { error } = await supabase
    .from('managed_service_projects')
    .update({
      status: projectStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    logger.error('❌ Failed to update project status', { error });
  } else {
    logger.info('✅ Project status updated', { projectStatus });
  }
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handlePaymentSucceeded(event: StripeEvent, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;

  logger.info('💰 Payment succeeded', {
    invoiceId: invoice.id,
    subscriptionId,
    amount: invoice.amount_paid,
  });

  // Find and update project
  const { data: project, error: queryError } = await supabase
    .from('managed_service_projects')
    .select('id, status')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (queryError) {
    logger.error('⚠️ Could not find project for subscription', { subscriptionId });
    return;
  }

  // If project is pending, activate it now
  if (project.status === 'pending') {
    await supabase
      .from('managed_service_projects')
      .update({ status: 'active' })
      .eq('id', project.id);

    logger.info('✅ Project activated on payment', { projectId: project.id });
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(event: StripeEvent, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;

  logger.warn('❌ Payment failed', {
    invoiceId: invoice.id,
    subscriptionId,
  });

  // Could pause project or send alert email
  // For now, just log the event
}

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    logger.warn('❌ Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify webhook
  const event = verifyWebhookSignature(body, signature);
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Record stripe event for audit trail
  await supabase
    .from('managed_service_stripe_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event.data.object,
      received_at: new Date().toISOString(),
      processed: false,
    })
    .catch(err => logger.warn('⚠️ Could not record stripe event', { err }));

  try {
    // Handle specific event types
    if (event.type === 'customer.subscription.created') {
      await handleSubscriptionCreated(event, supabase);
    } else if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(event, supabase);
    } else if (event.type === 'invoice.payment_succeeded') {
      await handlePaymentSucceeded(event, supabase);
    } else if (event.type === 'invoice.payment_failed') {
      await handlePaymentFailed(event, supabase);
    } else {
      logger.info('ℹ️ Unhandled event type', { eventType: event.type });
    }

    // Mark as processed
    await supabase
      .from('managed_service_stripe_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ success: true, eventId: event.id });

  } catch (error) {
    logger.error('❌ Webhook handler error', { error });

    // Mark as failed
    await supabase
      .from('managed_service_stripe_events')
      .update({
        processed: true,
        processing_error: error instanceof Error ? error.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', event.id);

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
