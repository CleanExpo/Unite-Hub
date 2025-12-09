/**
 * Synthex Experiment Detail API
 * Phase B41: Experimentation & A/B Testing Engine
 *
 * GET - Get experiment details with variants
 * PATCH - Update experiment metadata/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getExperimentById,
  updateExperiment,
  ExperimentUpdateInput,
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

    return NextResponse.json({ experiment });
  } catch (error) {
    console.error('Error in experiment GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body: ExperimentUpdateInput = await request.json();

    // Validate status transitions
    if (body.status) {
      const current = await getExperimentById(id);
      if (!current) {
        return NextResponse.json(
          { error: 'Experiment not found' },
          { status: 404 }
        );
      }

      const validTransitions: Record<string, string[]> = {
        draft: ['running', 'cancelled'],
        running: ['paused', 'completed', 'cancelled'],
        paused: ['running', 'cancelled'],
        completed: [],
        cancelled: [],
      };

      if (!validTransitions[current.status]?.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from ${current.status} to ${body.status}`,
          },
          { status: 400 }
        );
      }
    }

    const experiment = await updateExperiment(id, body);

    return NextResponse.json({ experiment });
  } catch (error) {
    console.error('Error in experiment PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
