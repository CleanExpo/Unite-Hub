/**
 * Pre-Client History Ingestion API
 *
 * Trigger and monitor historical email ingestion for a pre-client.
 * Part of the Client Historical Email Identity Engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  historyIngestionService,
  threadClusterService,
  relationshipTimelineService,
  opportunityDetectorService,
  preClientMapperService,
} from '@/lib/emailIngestion';

// POST /api/pre-clients/[id]/ingest-history - Start ingestion
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
    const { workspaceId, connectedAppId, startDate, endDate, fullPipeline } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (!connectedAppId) {
      return NextResponse.json(
        { error: 'connectedAppId is required' },
        { status: 400 }
      );
    }

    // Get pre-client to get email filter
    const preClient = await preClientMapperService.getPreClient(
      preClientId,
      workspaceId
    );

    if (!preClient) {
      return NextResponse.json(
        { error: 'Pre-client not found' },
        { status: 404 }
      );
    }

    // Calculate date range (default: 6 months)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    // Start ingestion job
    const jobId = await historyIngestionService.startIngestion({
      preClientId,
      workspaceId,
      connectedAppId,
      startDate: start,
      endDate: end,
      emailFilter: preClient.email,
    });

    if (!jobId) {
      return NextResponse.json(
        { error: 'Failed to start ingestion' },
        { status: 500 }
      );
    }

    // If fullPipeline is true, run the complete processing pipeline asynchronously
    if (fullPipeline) {
      // Note: In production, this should be a background job
      // For now, we'll run it sequentially
      runFullPipeline(preClientId, workspaceId).catch((err) => {
        console.error('[Ingestion] Pipeline error:', err);
      });
    }

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Ingestion started',
      preClientEmail: preClient.email,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] POST /api/pre-clients/[id]/ingest-history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/pre-clients/[id]/ingest-history - Get ingestion status
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
    const jobId = req.nextUrl.searchParams.get('jobId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (jobId) {
      // Get specific job
      const { data: job, error } = await supabase
        .from('pre_client_ingestion_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('pre_client_id', preClientId)
        .eq('workspace_id', workspaceId)
        .single();

      if (error || !job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          threadsFound: job.threads_found,
          messagesIngested: job.messages_ingested,
          insightsExtracted: job.insights_extracted,
          timelineEventsCreated: job.timeline_events_created,
          errorMessage: job.error_message,
        },
      });
    } else {
      // Get all jobs for this pre-client
      const { data: jobs, error } = await supabase
        .from('pre_client_ingestion_jobs')
        .select('*')
        .eq('pre_client_id', preClientId)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch jobs' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        jobs: (jobs || []).map((job) => ({
          id: job.id,
          status: job.status,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          threadsFound: job.threads_found,
          messagesIngested: job.messages_ingested,
          insightsExtracted: job.insights_extracted,
          timelineEventsCreated: job.timeline_events_created,
          errorMessage: job.error_message,
          createdAt: job.created_at,
        })),
      });
    }
  } catch (error) {
    console.error('[API] GET /api/pre-clients/[id]/ingest-history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Run full processing pipeline after ingestion
 */
async function runFullPipeline(
  preClientId: string,
  workspaceId: string
): Promise<void> {
  try {
    console.log(`[Pipeline] Starting full pipeline for pre-client ${preClientId}`);

    // Step 1: Cluster threads
    console.log('[Pipeline] Step 1: Clustering threads...');
    await threadClusterService.processAndSaveThreads({
      preClientId,
      workspaceId,
    });

    // Step 2: Build timeline
    console.log('[Pipeline] Step 2: Building timeline...');
    await relationshipTimelineService.buildTimeline(preClientId, workspaceId);

    // Step 3: Detect opportunities
    console.log('[Pipeline] Step 3: Detecting opportunities...');
    await opportunityDetectorService.processPreClient(preClientId, workspaceId);

    // Step 4: Update stats
    console.log('[Pipeline] Step 4: Updating stats...');
    await preClientMapperService.updateStats(preClientId, workspaceId);

    // Step 5: Calculate sentiment
    console.log('[Pipeline] Step 5: Calculating sentiment...');
    await preClientMapperService.calculateSentimentScore(preClientId, workspaceId);

    // Step 6: Generate relationship narrative
    console.log('[Pipeline] Step 6: Generating narrative...');
    await relationshipTimelineService.generateRelationshipNarrative(
      preClientId,
      workspaceId
    );

    console.log(`[Pipeline] Completed for pre-client ${preClientId}`);
  } catch (error) {
    console.error('[Pipeline] Error:', error);
    throw error;
  }
}
