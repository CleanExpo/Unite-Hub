/**
 * Synthex Coach API
 * Phase B42: Guided Playbooks & In-App Coach
 *
 * GET - Get conversation history
 * POST - Send message to coach
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendCoachMessage,
  getConversationHistory,
  CoachMessage,
} from '@/lib/synthex/playbookService';

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
    const threadId = searchParams.get('threadId') || undefined;
    const contextType = searchParams.get('contextType') as CoachMessage['context_type'] | undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const messages = await getConversationHistory(tenantId, user.id, {
      threadId,
      contextType,
      limit,
    });

    return NextResponse.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error in coach GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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
    const { tenantId, message, contextType, contextRef, threadId } = body;

    if (!tenantId || !message) {
      return NextResponse.json(
        { error: 'tenantId and message are required' },
        { status: 400 }
      );
    }

    const response = await sendCoachMessage(tenantId, user.id, message, {
      contextType,
      contextRef,
      threadId,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in coach POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
