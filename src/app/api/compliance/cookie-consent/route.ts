import { createServiceClient } from '@/lib/supabase/unified-auth';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Get sessionId from query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // For now, return default cookie preferences
    // In production, this would check the database for saved preferences
    return NextResponse.json({
      sessionId,
      preferences: {
        necessary: true,
        analytics: false,
        marketing: false,
        performance: false
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching cookie consent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cookie consent' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();
    
    const { sessionId, preferences } = body;

    if (!sessionId || !preferences) {
      return NextResponse.json(
        { error: 'Session ID and preferences required' },
        { status: 400 }
      );
    }

    // For now, just acknowledge the consent
    // In production, this would save to a cookie_consents table
    console.log('Cookie consent received:', { sessionId, preferences });

    return NextResponse.json({
      success: true,
      message: 'Cookie preferences saved',
      sessionId,
      preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving cookie consent:', error);
    return NextResponse.json(
      { error: 'Failed to save cookie consent' },
      { status: 500 }
    );
  }
}
