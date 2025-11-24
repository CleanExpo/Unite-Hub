import { NextRequest, NextResponse } from 'next/server';
import { getGA4AuthUrl } from '@/lib/integrations/google-analytics-4';

/**
 * GET /api/aido/auth/ga4/url
 *
 * Generates Google Analytics 4 OAuth URL
 *
 * Query params:
 *   - workspaceId: string (required)
 *
 * Returns:
 *   - authUrl: string - OAuth authorization URL
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const authUrl = getGA4AuthUrl(workspaceId);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating GA4 auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
