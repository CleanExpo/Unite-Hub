/**
 * GET /api/synthex/visual/capabilities?tenantId=...&planCode=...
 *
 * Get visual generation capabilities and quota usage for a tenant
 *
 * Response:
 * {
 *   capabilities: {
 *     graphicsPerMonth: number
 *     graphicsUsed: number
 *     videosPerMonth: number
 *     videosUsed: number
 *     brandKitsPerMonth: number
 *     brandKitsUsed: number
 *     aiDesignerAccess: boolean
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  getVisualCapabilities,
  getGraphicsQuota,
  getVideoQuota,
  getBrandKitQuota,
  hasAIDesignerAccess,
} from '@/lib/synthex/synthexOfferEngine';

export async function GET(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const planCode = req.nextUrl.searchParams.get('planCode') || 'launch';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    // Get capabilities from offer engine
    const capabilities = getVisualCapabilities(planCode);
    if (!capabilities) {
      return NextResponse.json(
        { error: 'Invalid plan code' },
        { status: 400 }
      );
    }

    // Fetch quota usage from queue table
    const { data: queue, error } = await supabaseAdmin
      .from('synthex_visual_generation_queues')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('plan_code', planCode)
      .single();

    // Default usage if no queue exists yet
    let graphicsUsed = 0;
    let videosUsed = 0;
    let brandKitsUsed = 0;

    if (queue) {
      graphicsUsed = queue.graphics_used_month || 0;
      videosUsed = queue.videos_used_month || 0;
      brandKitsUsed = queue.brand_kits_used_month || 0;
    }

    return NextResponse.json(
      {
        capabilities: {
          graphicsPerMonth: getGraphicsQuota(planCode),
          graphicsUsed,
          videosPerMonth: getVideoQuota(planCode),
          videosUsed,
          brandKitsPerMonth: getBrandKitQuota(planCode),
          brandKitsUsed,
          aiDesignerAccess: hasAIDesignerAccess(planCode),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Capabilities GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
