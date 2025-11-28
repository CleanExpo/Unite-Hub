/**
 * Pre-Client Timeline API
 *
 * Get relationship timeline for a pre-client.
 * Part of the Client Historical Email Identity Engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  relationshipTimelineService,
  type EventType,
} from '@/lib/emailIngestion';

// GET /api/pre-clients/[id]/timeline - Get timeline
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: preClientId } = await params;
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

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Parse filters
    const eventTypesParam = req.nextUrl.searchParams.get('eventTypes');
    const significanceParam = req.nextUrl.searchParams.get('significance');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const eventTypes = eventTypesParam
      ? (eventTypesParam.split(',') as EventType[])
      : undefined;
    const significance = significanceParam
      ? (significanceParam.split(',') as ('minor' | 'moderate' | 'major' | 'critical')[])
      : undefined;

    const timeline = await relationshipTimelineService.getTimeline(
      preClientId,
      workspaceId,
      {
        eventTypes,
        significance,
        limit,
        offset,
      }
    );

    return NextResponse.json({
      success: true,
      events: timeline.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        eventDate: e.eventDate.toISOString(),
        summary: e.summary,
        details: e.details,
        sourceType: e.sourceType,
        sourceMessageId: e.sourceMessageId,
        sourceThreadId: e.sourceThreadId,
        significance: e.significance,
        metadata: e.metadata,
      })),
      count: timeline.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] GET /api/pre-clients/[id]/timeline error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pre-clients/[id]/timeline - Build timeline or get summary
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: preClientId } = await params;
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
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'build': {
        // Build timeline from threads
        const events = await relationshipTimelineService.buildTimeline(
          preClientId,
          workspaceId
        );

        return NextResponse.json({
          success: true,
          eventsCreated: events.length,
          message: 'Timeline built successfully',
        });
      }

      case 'summary': {
        // Get relationship summary
        const summary = await relationshipTimelineService.generateRelationshipSummary(
          preClientId,
          workspaceId
        );

        return NextResponse.json({
          success: true,
          summary: {
            preClientId: summary.preClientId,
            firstContactDate: summary.firstContactDate?.toISOString(),
            lastContactDate: summary.lastContactDate?.toISOString(),
            relationshipDurationDays: summary.relationshipDurationDays,
            totalEvents: summary.totalEvents,
            milestoneCount: summary.milestoneCount,
            issuesCount: summary.issuesCount,
            currentPhase: summary.currentPhase,
            engagementLevel: summary.engagementLevel,
            keyMilestones: summary.keyMilestones.map((m) => ({
              eventType: m.eventType,
              eventDate: m.eventDate.toISOString(),
              summary: m.summary,
              significance: m.significance,
            })),
            recentActivity: summary.recentActivity.map((a) => ({
              eventType: a.eventType,
              eventDate: a.eventDate.toISOString(),
              summary: a.summary,
              significance: a.significance,
            })),
          },
        });
      }

      case 'narrative': {
        // Generate AI narrative
        const narrative = await relationshipTimelineService.generateRelationshipNarrative(
          preClientId,
          workspaceId
        );

        return NextResponse.json({
          success: true,
          narrative,
        });
      }

      case 'add': {
        // Add manual timeline event
        const { eventType, eventDate, summary, details, significance } = body;

        if (!eventType || !eventDate || !summary) {
          return NextResponse.json(
            { error: 'eventType, eventDate, and summary are required' },
            { status: 400 }
          );
        }

        const eventId = await relationshipTimelineService.saveTimelineEvent({
          preClientId,
          workspaceId,
          eventType,
          eventDate: new Date(eventDate),
          summary,
          details,
          sourceType: 'manual',
          significance: significance || 'moderate',
        });

        return NextResponse.json({
          success: true,
          eventId,
          message: 'Event added to timeline',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "build", "summary", "narrative", or "add"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] POST /api/pre-clients/[id]/timeline error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
