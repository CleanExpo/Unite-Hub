/**
 * Autopilot Playbooks API
 * Phase 89: Generate and list weekly playbooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  generatePlaybook,
  listPlaybooks,
  getPlaybook,
  getPlaybookActions,
  executeAutoBatch,
  getPreferences,
} from '@/lib/autopilot';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const playbookId = req.nextUrl.searchParams.get('playbookId');

    if (playbookId) {
      // Get specific playbook with actions
      const playbook = await getPlaybook(playbookId);
      if (!playbook) {
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
      }

      const actions = await getPlaybookActions(playbookId);

      return NextResponse.json({
        success: true,
        playbook,
        actions,
      });
    }

    // List recent playbooks
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const playbooks = await listPlaybooks(workspaceId, limit);

    return NextResponse.json({
      success: true,
      playbooks,
    });
  } catch (error: any) {
    console.error('Get playbooks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Generate new playbook
    const playbook = await generatePlaybook(workspaceId);

    // Get preferences and auto-execute eligible actions
    const preferences = await getPreferences(workspaceId, userId);
    const autoResults = await executeAutoBatch(playbook.id, preferences);

    // Get updated actions
    const actions = await getPlaybookActions(playbook.id);

    return NextResponse.json({
      success: true,
      playbook,
      actions,
      autoExecuted: autoResults.filter(r => r.success).length,
    });
  } catch (error: any) {
    console.error('Generate playbook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
