import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get sessionId from query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Return default cookie preferences - no auth required
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
    const body = await req.json();
    const { sessionId, preferences } = body;

    if (!sessionId || !preferences) {
      return NextResponse.json(
        { error: 'Session ID and preferences required' },
        { status: 400 }
      );
    }

    // Acknowledge the consent - no auth required
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
