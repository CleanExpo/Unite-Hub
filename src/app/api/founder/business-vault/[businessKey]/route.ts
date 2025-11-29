import { NextRequest, NextResponse } from 'next/server';
import { getBusinessWithChannels } from '@/lib/founder/businessVaultService';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/founder/business-vault/[businessKey]
 * Get a single business with channels and recent snapshots
 * Requires authentication - founder data is sensitive
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessKey: string }> }
) {
  try {
    // Require authentication for business vault access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    const { businessKey } = await params;

    const data = await getBusinessWithChannels(businessKey);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Verify the authenticated user owns this business
    if (data.business.owner_user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied - not your business' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      business: data.business,
      channels: data.channels,
      snapshots: data.snapshots
    });
  } catch (error) {
    console.error('[business-vault/[businessKey]] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business' },
      { status: 500 }
    );
  }
}
