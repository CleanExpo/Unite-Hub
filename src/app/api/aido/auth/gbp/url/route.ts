import { NextRequest, NextResponse } from 'next/server';
import { getGBPAuthUrl } from '@/lib/integrations/google-business-profile';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/aido/auth/gbp/url
 *
 * Generates Google Business Profile OAuth URL
 *
 * Query params:
 *   - workspaceId: string (required)
 *
 * Returns:
 *   - authUrl: string - OAuth authorization URL
 */
export async function GET(req: NextRequest) {
  try {
    // Session validation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const authUrl = getGBPAuthUrl(workspaceId);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating GBP auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
