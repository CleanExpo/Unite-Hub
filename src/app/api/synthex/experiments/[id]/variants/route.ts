/**
 * Synthex Experiment Variants API
 * Phase B41: Experimentation & A/B Testing Engine
 *
 * GET - List variants for experiment
 * POST - Add variant to experiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getExperimentById,
  addVariant,
  VariantInput,
} from '@/lib/synthex/experimentService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const experiment = await getExperimentById(id);

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      variants: experiment.variants || [],
      count: experiment.variants?.length || 0,
    });
  } catch (error) {
    console.error('Error in variants GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: VariantInput = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    // Check experiment exists
    const experiment = await getExperimentById(id);
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Don't allow adding variants to running experiments
    if (experiment.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot add variants to a running experiment' },
        { status: 400 }
      );
    }

    const variant = await addVariant(id, body);

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error('Error in variants POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
