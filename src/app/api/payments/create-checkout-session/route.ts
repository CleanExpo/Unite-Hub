/**
 * POST /api/payments/create-checkout-session
 * Phase 3 Step 6 - Stripe Payment Integration
 *
 * Creates a Stripe Checkout session for a selected proposal package.
 *
 * Request Body:
 * - ideaId: UUID of the client idea
 * - tier: 'good' | 'better' | 'best'
 * - packageId: ID of the selected package
 *
 * Returns:
 * - success: boolean
 * - sessionId: Stripe session ID
 * - sessionUrl: Stripe checkout URL for redirect
 * - error?: string
 *
 * Following CLAUDE.md patterns:
 * - Bearer token authentication
 * - Workspace isolation
 * - Database validation
 * - Audit logging
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createCheckoutSession, dollarsToCents } from '@/lib/payments/stripeClient';
import type { ProposalScope, ScopePackage } from '@/lib/projects/scope-planner';

interface CreateCheckoutRequest {
  ideaId: string;
  tier: 'good' | 'better' | 'best';
  packageId: string;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body: CreateCheckoutRequest = await req.json();
    const { ideaId, tier, packageId } = body;

    // Validate required fields
    if (!ideaId || !tier || !packageId) {
      return NextResponse.json(
        { success: false, error: 'ideaId, tier, and packageId are required' },
        { status: 400 }
      );
    }

    // Validate tier value
    if (!['good', 'better', 'best'].includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier. Must be good, better, or best' },
        { status: 400 }
      );
    }

    // Authenticate request
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let userEmail: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      userId = data.user.id;
      userEmail = data.user.email || 'unknown';
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      userId = data.user.id;
      userEmail = data.user.email || 'unknown';
    }

    const supabase = await getSupabaseServer();

    // Verify the idea belongs to the authenticated client
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, client_id, organization_id, title, description')
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        { success: false, error: 'Idea not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch the proposal scope to get pricing
    const { data: proposalScope, error: scopeError } = await supabase
      .from('proposal_scopes')
      .select('id, scope_data, status')
      .eq('idea_id', ideaId)
      .eq('status', 'sent')
      .single();

    if (scopeError || !proposalScope) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Extract and validate the selected package
    const scopeData = proposalScope.scope_data as ProposalScope;
    const selectedPackage = scopeData.packages?.find(
      (pkg: ScopePackage) => pkg.id === packageId && pkg.tier === tier
    );

    if (!selectedPackage) {
      return NextResponse.json(
        { success: false, error: 'Selected package not found in proposal' },
        { status: 400 }
      );
    }

    // Validate package has pricing
    if (!selectedPackage.priceMin || selectedPackage.priceMin <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'This package does not have a set price. Please contact sales.',
        },
        { status: 400 }
      );
    }

    // Calculate payment amount (use midpoint of price range)
    const priceAmount =
      selectedPackage.priceMax && selectedPackage.priceMax > selectedPackage.priceMin
        ? Math.round((selectedPackage.priceMin + selectedPackage.priceMax) / 2)
        : selectedPackage.priceMin;

    // Convert dollars to cents for Stripe
    const priceInCents = dollarsToCents(priceAmount);

    // Create checkout session
    const { sessionId, sessionUrl } = await createCheckoutSession({
      priceAmount: priceInCents,
      currency: 'usd',
      productName: `${idea.title} - ${selectedPackage.label} Package`,
      productDescription: selectedPackage.summary,
      metadata: {
        ideaId: idea.id,
        tier: selectedPackage.tier,
        packageId: selectedPackage.id,
        clientId: idea.client_id,
        organizationId: idea.organization_id,
        proposalScopeId: proposalScope.id, // Added for Phase 3 Step 7 - Project creation
      },
    });

    // Store checkout session in database for tracking
    await supabase
      .from('payment_sessions')
      .insert({
        session_id: sessionId,
        idea_id: ideaId,
        proposal_scope_id: proposalScope.id,
        client_id: idea.client_id,
        organization_id: idea.organization_id,
        tier: selectedPackage.tier,
        package_id: selectedPackage.id,
        amount: priceInCents,
        currency: 'usd',
        status: 'pending',
        created_by: userEmail,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Log audit event
    await supabase
      .from('auditLogs')
      .insert({
        organization_id: idea.organization_id,
        user_id: userId,
        action: 'payment_session_created',
        resource_type: 'payment',
        resource_id: sessionId,
        details: {
          ideaId,
          tier: selectedPackage.tier,
          packageId: selectedPackage.id,
          amount: priceInCents,
          currency: 'usd',
        },
      })
      .select('id')
      .single();

    return NextResponse.json({
      success: true,
      sessionId,
      sessionUrl,
      message: 'Checkout session created successfully',
    });
  } catch (error) {
    console.error('POST /api/payments/create-checkout-session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
