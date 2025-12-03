/**
 * POST /api/synthex/video/generate
 *
 * Generate AI video for Synthex tenant
 *
 * Request body:
 * {
 *   tenantId: string
 *   jobType: 'short_form' | 'promotional' | 'educational' | 'testimonial'
 *   description: string
 *   brandName: string
 *   options?: { addMusic, autoCaptions, addEffects, colorGrading }
 * }
 *
 * Response:
 * {
 *   job: {
 *     id: string
 *     status: 'pending'
 *     job_type: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createVideoJob } from '@/lib/synthex/synthex-video-orchestrator';
import { hasAIDesignerAccess } from '@/lib/synthex/synthexOfferEngine';

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, jobType, description, brandName, options } = body;

    // Validate required fields
    if (!tenantId || !jobType || !description || !brandName) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, jobType, description, brandName' },
        { status: 400 }
      );
    }

    // Validate job type
    const validJobTypes = ['short_form', 'promotional', 'educational', 'testimonial'];
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json(
        { error: `Invalid jobType. Must be one of: ${validJobTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get tenant subscription
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('subscription_plan_code')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const planCode = tenant.subscription_plan_code || 'launch';

    // Check AI Designer access
    if (!hasAIDesignerAccess(planCode)) {
      return NextResponse.json(
        { error: 'Video creation requires AI Designer access (Growth+ plan)' },
        { status: 403 }
      );
    }

    // Create video job
    const job = await createVideoJob(
      tenantId,
      planCode,
      jobType as any,
      description,
      brandName,
      options
    );

    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create video job' },
        { status: 500 }
      );
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
