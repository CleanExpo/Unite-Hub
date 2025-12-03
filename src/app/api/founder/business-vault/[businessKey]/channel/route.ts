import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addBusinessChannel } from '@/lib/founder/businessVaultService';

/**
 * POST /api/founder/business-vault/[businessKey]/channel
 * Add a channel/platform mapping to a business
 *
 * Body:
 * {
 *   channel_type: string (e.g., 'search', 'social', 'ads', 'email', 'analytics')
 *   provider: string (e.g., 'google', 'facebook', 'linkedin', 'sendgrid', 'semrush')
 *   account_label?: string (e.g., 'Main GA4 Property', 'Brand Facebook Page')
 *   external_id?: string (e.g., GA4 property ID, Facebook Page ID)
 *   meta?: object (additional provider-specific data)
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessKey: string }> }
) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { businessKey } = await params;
    const body = await req.json();

    // Validate required fields
    if (!body.channel_type || !body.provider) {
      return NextResponse.json(
        { success: false, error: 'channel_type and provider are required' },
        { status: 400 }
      );
    }

    const channel = await addBusinessChannel(businessKey, {
      channel_type: body.channel_type,
      provider: body.provider,
      account_label: body.account_label,
      external_id: body.external_id,
      meta: body.meta
    });

    return NextResponse.json({ success: true, channel });
  } catch (error) {
    console.error('[business-vault/[businessKey]/channel] POST error:', error);

    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json(
          { success: false, error: 'Not authenticated' },
          { status: 401 }
        );
      }
      if (error.message === 'Business not found') {
        return NextResponse.json(
          { success: false, error: 'Business not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add channel' },
      { status: 500 }
    );
  }
}
