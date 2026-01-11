/**
 * Founder Assistant API Route
 * Phase 51: AI Executive Assistant endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseBrowser } from '@/lib/supabase';
import { generateDailyBriefing, getLatestBriefing, markBriefingRead } from '@/lib/services/founderBriefingService';
import { getMemoryNodes, getMemoryStats, searchMemory } from '@/lib/services/founderMemoryService';
import { getEmailSummary, getUrgentEmails } from '@/lib/services/founderEmailService';
import { getTeamOverview, getStaffInsights } from '@/lib/services/founderStaffInsightsService';
import { executeVoiceCommand, getCommandHistory } from '@/lib/services/founderVoiceCommands';
import { getUnifiedFinancialSummary } from '@/lib/bridges/xeroUnifiedBridge';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
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

    const action = req.nextUrl.searchParams.get('action');
    const organizationId = req.nextUrl.searchParams.get('organizationId') || '';

    switch (action) {
      case 'briefing': {
        const briefing = await getLatestBriefing(userId);
        return NextResponse.json({ briefing });
      }

      case 'memory': {
        const nodeType = req.nextUrl.searchParams.get('nodeType') || undefined;
        const nodes = await getMemoryNodes(userId, {
          node_type: nodeType as any,
          limit: 50,
        });
        const stats = await getMemoryStats(userId);
        return NextResponse.json({ nodes, stats });
      }

      case 'search': {
        const query = req.nextUrl.searchParams.get('query') || '';
        const results = await searchMemory(userId, query);
        return NextResponse.json({ results });
      }

      case 'emails': {
        const summary = await getEmailSummary(userId);
        const urgent = await getUrgentEmails(userId);
        return NextResponse.json({ summary, urgent });
      }

      case 'staff': {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const overview = await getTeamOverview(userId, weekAgo, today);
        const insights = await getStaffInsights(userId, { limit: 10 });
        return NextResponse.json({ overview, insights });
      }

      case 'financials': {
        const financial = await getUnifiedFinancialSummary(userId);
        return NextResponse.json({ financial });
      }

      case 'commandHistory': {
        const history = await getCommandHistory(userId, 20);
        return NextResponse.json({ history });
      }

      case 'dashboard': {
        // Get all dashboard data at once
        const [briefing, memoryStats, emailSummary, staffOverview, financial] = await Promise.all([
          getLatestBriefing(userId),
          getMemoryStats(userId),
          getEmailSummary(userId),
          getTeamOverview(
            userId,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          ),
          getUnifiedFinancialSummary(userId),
        ]);

        return NextResponse.json({
          briefing,
          memoryStats,
          emailSummary,
          staffOverview,
          financial,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Founder assistant GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
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

    const body = await req.json();
    const { action, organizationId } = body;

    switch (action) {
      case 'generateBriefing': {
        const briefing = await generateDailyBriefing(userId, organizationId);
        return NextResponse.json({ briefing });
      }

      case 'markBriefingRead': {
        const { briefingId } = body;
        const success = await markBriefingRead(userId, briefingId);
        return NextResponse.json({ success });
      }

      case 'voiceCommand': {
        const { command } = body;
        const result = await executeVoiceCommand(userId, organizationId, command);
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Founder assistant POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
