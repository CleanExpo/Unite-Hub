/**
 * Synthex Template Feedback API
 * Phase D05: Template Intelligence
 *
 * GET - Get feedback summary
 * POST - Submit feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTemplate } from '@/lib/synthex/templateService';
import {
  submitFeedback,
  getFeedbackSummary,
} from '@/lib/synthex/templateAIService';

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

    const summary = await getFeedbackSummary(id);

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error('[Template Feedback API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get feedback' },
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
    const body = await request.json();

    const { rating, feedback_type, comment, usage_context, output_id } = body;

    if (!rating || !feedback_type) {
      return NextResponse.json(
        { error: 'rating and feedback_type are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get template to verify existence and get tenant_id
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await submitFeedback(template.tenant_id, id, user.id, {
      rating,
      feedback_type,
      comment,
      usage_context,
      output_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted',
    }, { status: 201 });
  } catch (error) {
    console.error('[Template Feedback API] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
