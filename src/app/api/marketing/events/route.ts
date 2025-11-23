/**
 * Marketing Events API
 * Phase 59: Track lead funnel events
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackLeadEvent, type LeadEvent } from '@/lib/marketing/leadScoreEngine';
import { trackRemarketingEvent } from '@/lib/marketing/remarketingListener';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id, event, metadata } = body;

    if (!lead_id || !event) {
      return NextResponse.json(
        { error: 'Missing required fields: lead_id, event' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEvents: LeadEvent[] = [
      'scroll_depth',
      'cta_click',
      'pricing_view',
      'signup_start',
      'signup_complete',
      'dashboard_first_login',
      'first_action',
      'first_visual',
      'first_strategy_pack',
      'first_success_score',
    ];

    if (!validEvents.includes(event)) {
      return NextResponse.json(
        { error: 'Invalid event type', valid_events: validEvents },
        { status: 400 }
      );
    }

    // Track event for lead scoring
    await trackLeadEvent(lead_id, event, metadata);

    // Track for remarketing (if user consented)
    await trackRemarketingEvent(lead_id, event, metadata);

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    console.error('Marketing events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Return available events for documentation
  return NextResponse.json({
    available_events: [
      { event: 'scroll_depth', points: 5, description: 'User scrolled page' },
      { event: 'cta_click', points: 10, description: 'User clicked CTA button' },
      { event: 'pricing_view', points: 15, description: 'User viewed pricing page' },
      { event: 'signup_start', points: 20, description: 'User started signup' },
      { event: 'signup_complete', points: 30, description: 'User completed signup' },
      { event: 'dashboard_first_login', points: 15, description: 'First dashboard login' },
      { event: 'first_action', points: 20, description: 'First platform action' },
      { event: 'first_visual', points: 25, description: 'First visual generated' },
      { event: 'first_strategy_pack', points: 30, description: 'First strategy pack' },
      { event: 'first_success_score', points: 35, description: 'First success score' },
    ],
    usage: {
      method: 'POST',
      body: {
        lead_id: 'string (required)',
        event: 'string (required)',
        metadata: 'object (optional)',
      },
    },
  });
}
