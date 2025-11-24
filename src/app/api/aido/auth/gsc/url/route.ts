import { NextRequest, NextResponse } from 'next/server';
import { getGSCAuthUrl } from '@/lib/integrations/google-search-console';

/**
 * GET /api/aido/auth/gsc/url
 *
 * Generates Google Search Console OAuth URL
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

    const authUrl = getGSCAuthUrl(workspaceId);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating GSC auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
