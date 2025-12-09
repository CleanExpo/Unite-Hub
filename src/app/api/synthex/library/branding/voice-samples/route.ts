/**
 * Synthex Brand Voice Samples API
 * Phase D06: Auto-Branding Engine
 *
 * GET - List voice samples
 * POST - Add voice sample
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listVoiceSamples,
  addVoiceSample,
  analyzeVoiceSample,
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
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const filters = {
      content_type: searchParams.get('contentType') || undefined,
      is_approved: searchParams.get('approved') === 'true' ? true : undefined,
    };

    const samples = await listVoiceSamples(tenantId, filters);

    return NextResponse.json({
      success: true,
      samples,
      count: samples.length,
    });
  } catch (error) {
    console.error('[Voice Samples API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list samples' },
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
    const { tenantId, content, content_type, source, source_url, analyze = false } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!content || !content_type) {
      return NextResponse.json(
        { error: 'content and content_type are required' },
        { status: 400 }
      );
    }

    const sample = await addVoiceSample(tenantId, {
      content,
      content_type,
      source,
      source_url,
    });

    // Optionally analyze immediately
    let analysis = null;
    if (analyze) {
      analysis = await analyzeVoiceSample(sample.id);
    }

    return NextResponse.json({
      success: true,
      sample,
      analysis,
    }, { status: 201 });
  } catch (error) {
    console.error('[Voice Samples API] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add sample' },
      { status: 500 }
    );
  }
}
