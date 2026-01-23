/**
 * API Route: /api/campaigns/channels
 * GET: List available channels and templates for a brand
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { getBrandChannels } from '@/lib/campaigns/channelPlaybooks';
import { apiRateLimit } from '@/lib/rate-limit';

const logger = createApiLogger({ route: '/api/campaigns/channels' });

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
return rateLimitResult;
}

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const brandSlug = req.nextUrl.searchParams.get('brandSlug');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'founder' || profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    // Get channels from database (if seeded)
    const { data: dbChannels, error: channelsError } = await supabase.rpc('get_brand_channels', {
      p_workspace_id: workspaceId,
      p_brand_slug: brandSlug || 'unite_group',
    });

    if (channelsError) {
      logger.warn('Database channels not available, using playbooks', { channelsError });
    }

    // Get channel slugs from playbooks
    const playbookChannels = brandSlug ? getBrandChannels(brandSlug) : [];

    // Merge database and playbook data
    const channels = dbChannels && dbChannels.length > 0
      ? dbChannels
      : playbookChannels.map(slug => ({
          channel_slug: slug,
          channel_name: slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          is_active: true,
          requires_approval: true,
        }));

    // Get templates if brand specified
    let templates = null;
    if (brandSlug && dbChannels && dbChannels.length > 0) {
      const channelIds = dbChannels.map((c: any) => c.id);

      const { data: dbTemplates } = await supabase.rpc('get_channel_templates', {
        p_workspace_id: workspaceId,
        p_channel_id: channelIds[0], // Get templates for first channel as example
        p_brand_slug: brandSlug,
      });

      templates = dbTemplates || [];
    }

    logger.info('Channels retrieved', {
      workspaceId,
      brandSlug,
      channelsCount: channels.length,
    });

    return NextResponse.json({
      success: true,
      channels,
      templates,
      playbook_channels: playbookChannels,
    });
  } catch (error) {
    logger.error('Failed to get channels', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
