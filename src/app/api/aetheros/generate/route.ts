/**
 * AetherOS Omega Protocol - Generation API Route
 * 
 * Endpoint: POST /api/aetheros/generate
 * Purpose: Generate visuals using the AetherOS tiered system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  startSession,
  generateVisual,
  recommendTier,
  type GenerationRequest,
  type GenerationTier,
} from '@/lib/synthex/aetheros';

export const runtime = 'edge';

interface GenerateRequestBody {
  prompt: string;
  tier?: GenerationTier;
  aspect_ratio?: '16:9' | '1:1' | '9:16' | '4:3';
  auto_tier?: boolean; // If true, automatically select best tier
  purpose?: 'iteration' | 'preview' | 'final';
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenant
    const { data: userTenant } = await supabase
      .from('synthex_user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 404 }
      );
    }

    // Parse request body
    const body: GenerateRequestBody = await request.json();

    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Start AetherOS session
    const { sessionId, telemetry } = await startSession(
      userTenant.tenant_id,
      user.id
    );

    // Determine tier
    let selectedTier: GenerationTier = body.tier || 'draft';

    if (body.auto_tier && body.purpose) {
      const budgetRemaining = parseFloat(
        telemetry.saas_economics.remaining_budget.replace('$', '')
      );

      selectedTier = recommendTier({
        budgetRemaining,
        purpose: body.purpose,
        clientApprovalNeeded: body.purpose === 'preview',
      });
    }

    // Build generation request
    const generationRequest: GenerationRequest = {
      tenant_id: userTenant.tenant_id,
      user_id: user.id,
      tier: selectedTier,
      prompt_original: body.prompt,
      aspect_ratio: body.aspect_ratio || '16:9',
      metadata: {
        api_version: '1.0',
        source: 'api',
      },
    };

    // Generate visual
    const result = await generateVisual(
      generationRequest,
      telemetry,
      sessionId
    );

    // Return result
    return NextResponse.json({
      success: true,
      data: {
        job_id: result.id,
        session_id: sessionId,
        tier: result.tier,
        status: result.status,
        output_url: result.output_url,
        preview_url: result.preview_url,
        cost: result.cost,
        generation_time_ms: result.generation_time_ms,
        quality_score: result.quality_score,
      },
      telemetry: {
        region: telemetry.global_clock.region,
        energy_arbitrage_active: telemetry.global_clock.energy_arbitrage_active,
        remaining_budget: telemetry.saas_economics.remaining_budget,
      },
    });
  } catch (error) {
    console.error('[AetherOS API] Generation failed:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Generation failed',
      },
      { status: 500 }
    );
  }
}

// GET: Check generation status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json(
        { error: 'job_id parameter is required' },
        { status: 400 }
      );
    }

    // Get job status
    const { data: job, error: jobError } = await supabase
      .from('synthex_aetheros_visual_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        job_id: job.id,
        tier: job.tier,
        status: job.status,
        output_url: job.output_url,
        preview_url: job.preview_url,
        cost: job.cost,
        error_message: job.error_message,
        created_at: job.created_at,
        completed_at: job.completed_at,
      },
    });
  } catch (error) {
    console.error('[AetherOS API] Status check failed:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Status check failed',
      },
      { status: 500 }
    );
  }
}
