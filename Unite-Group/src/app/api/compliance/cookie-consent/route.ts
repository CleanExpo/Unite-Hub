import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { ComplianceService } from '@/lib/compliance/service';
import { CookieConsentFormData } from '@/lib/compliance/types';

/**
 * POST /api/compliance/cookie-consent
 * Record cookie consent preferences
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
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
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

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
  } catch (error: any) {
    console.error('Error recording cookie consent:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/compliance/cookie-consent?sessionId=xxx
 * Get cookie consent preferences for a session
 */
export async function GET(request: NextRequest) {
  try {
    // Get session ID from query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get user information if logged in
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Get cookie consent
    const consent = await ComplianceService.getCookieConsent(
      sessionId,
      userId
    );

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
  } catch (error: any) {
    console.error('Error getting cookie consent:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
