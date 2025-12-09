/**
 * Synthex Experiment Assignment API
 * Phase B41: Experimentation & A/B Testing Engine
 *
 * POST - Assign contact to variant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getExperimentById,
  assignVariantForContact,
} from '@/lib/synthex/experimentService';

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
    const body = await request.json();
    const { tenantId, contactId } = body;

    if (!tenantId || !contactId) {
      return NextResponse.json(
        { error: 'tenantId and contactId are required' },
        { status: 400 }
      );
    }

    // Check experiment exists and is running
    const experiment = await getExperimentById(id);
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    if (experiment.status !== 'running') {
      return NextResponse.json(
        { error: 'Can only assign variants for running experiments' },
        { status: 400 }
      );
    }

    const assignment = await assignVariantForContact(tenantId, id, contactId);

    return NextResponse.json({
      variant_id: assignment.variant_id,
      variant_name: assignment.variant_name,
      is_new_assignment: assignment.is_new,
    });
  } catch (error) {
    console.error('Error in experiment assign POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
