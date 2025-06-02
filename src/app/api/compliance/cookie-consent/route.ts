import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ComplianceService } from '@/lib/compliance/service';
import { CookieConsentFormData } from '@/lib/compliance/types';

/**
 * POST /api/compliance/cookie-consent
 * Record cookie consent preferences
 */
async function handlePOST(req: NextRequest, userId: string) {
  try {
    // Parse request body
    const body = await req.json();
    const { sessionId, preferences }: { sessionId: string; preferences: CookieConsentFormData } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      );
    }

    // Get user information if logged in
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json(
        { error: 'Failed to get user session' },
        { status: 500 }
      );
    }
    const userId = session?.user?.id;

    // Get IP address and user agent from the request
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Record cookie consent
    const consent = await ComplianceService.recordCookieConsent(
      sessionId,
      preferences,
      userId,
      ipAddress as string,
      userAgent
    );

    if (!consent) {
      return NextResponse.json(
        { error: 'Failed to record cookie consent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Cookie consent recorded successfully',
      consent
    });
  } catch (error: unknown) {
    console.error('Error recording cookie consent:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}

import { withApiAuth } from '@/lib/supabase/apiAuth';

/**
 * GET /api/compliance/cookie-consent?sessionId=xxx
 * Get cookie consent preferences for a session
 */
async function handleGET(req: NextRequest, userId: string) {
  try {
    // Get session ID from query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Use the userId passed from withApiAuth directly

    // Get cookie consent
    const consent = await ComplianceService.getCookieConsent(sessionId, userId);

    if (!consent) {
      return NextResponse.json(
        { exists: false }
      );
    }

    return NextResponse.json({
      exists: true,
      consent: {
        preferences: consent.preferences,
        analytics: consent.analytics,
        marketing: consent.marketing
      }
    });
  } catch (error: unknown) {
    console.error('Error getting cookie consent:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
