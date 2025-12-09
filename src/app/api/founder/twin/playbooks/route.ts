/**
 * Founder Twin Playbooks API
 * Phase D01: Founder Cognitive Twin Kernel
 *
 * GET - List playbooks
 * POST - Create new playbook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listPlaybooks,
  upsertPlaybook,
  suggestPlaybookSteps,
  type PlaybookCategory,
} from '@/lib/founder/founderTwinService';

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
    const category = searchParams.get('category') as PlaybookCategory | null;
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const includeTemplates = searchParams.get('includeTemplates') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const playbooks = await listPlaybooks(tenantId, {
      category: category || undefined,
      activeOnly,
      includeTemplates,
      limit,
    });

    return NextResponse.json({
      playbooks,
      count: playbooks.length,
    });
  } catch (error) {
    console.error('Error in playbooks GET:', error);
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
    const { tenantId, generateSteps, ...playbookData } = body;

    if (!tenantId || !playbookData.name || !playbookData.slug) {
      return NextResponse.json(
        { error: 'tenantId, name, and slug are required' },
        { status: 400 }
      );
    }

    // Optionally generate steps with AI
    let finalPlaybookData = playbookData;
    if (generateSteps && playbookData.description) {
      const suggestedSteps = await suggestPlaybookSteps(
        playbookData.name,
        playbookData.description,
        playbookData.category || 'general'
      );
      if (suggestedSteps.length > 0) {
        finalPlaybookData = {
          ...playbookData,
          steps: suggestedSteps,
        };
      }
    }

    // Ensure steps is an array
    if (!finalPlaybookData.steps || !Array.isArray(finalPlaybookData.steps)) {
      finalPlaybookData.steps = [];
    }

    const playbook = await upsertPlaybook(tenantId, finalPlaybookData, user.id);

    return NextResponse.json({ playbook }, { status: 201 });
  } catch (error) {
    console.error('Error in playbooks POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
