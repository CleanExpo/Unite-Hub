/**
 * Synthex Brand Generation from URL API
 * Phase D06: Auto-Branding Engine
 *
 * POST - Start brand generation from website URL
 * GET - Check generation job status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateFromWebsite,
  getGenerationJob,
  applyGeneratedProfile,
} from '@/lib/synthex/brandingService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    const job = await getGenerationJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('[Brand Generate URL API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get job status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, url, applyJobId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Apply an existing job's results
    if (applyJobId) {
      const profile = await applyGeneratedProfile(applyJobId);
      return NextResponse.json({
        success: true,
        message: 'Generated profile applied',
        profile,
      });
    }

    // Start new generation
    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const job = await generateFromWebsite(tenantId, url, user.id);

    return NextResponse.json({
      success: true,
      message: 'Brand generation started',
      job,
    }, { status: 202 });
  } catch (error) {
    console.error('[Brand Generate URL API] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start brand generation' },
      { status: 500 }
    );
  }
}
