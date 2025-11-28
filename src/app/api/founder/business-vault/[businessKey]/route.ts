import { NextRequest, NextResponse } from 'next/server';
import { getBusinessWithChannels } from '@/lib/founder/businessVaultService';

/**
 * GET /api/founder/business-vault/[businessKey]
 * Get a single business with channels and recent snapshots
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessKey: string }> }
) {
  try {
    const { businessKey } = await params;

    const data = await getBusinessWithChannels(businessKey);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
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
