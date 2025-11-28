/**
 * Client Email Summary API
 *
 * GET /api/email-intel/client/[clientId]/summary
 * Returns a high-level summary of the client's email history, key ideas,
 * concerns, and opportunities for use in upcoming meetings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { clientEmailIntelligenceService } from '@/lib/crm/clientEmailIntelligenceService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const includeTimeline = searchParams.get('includeTimeline') === 'true';
    const meetingContext = searchParams.get('meetingContext'); // Optional: upcoming meeting topic

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace access
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('org_id', workspaceId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get email summary
    const summary = await clientEmailIntelligenceService.getClientEmailSummary(
      workspaceId,
      clientId
    );

    if (!summary) {
      return NextResponse.json({
        summary: null,
        message: 'No email communication history found for this client.',
      });
    }

    // Generate AI insights
    const insights = await clientEmailIntelligenceService.generateCommunicationInsights(
      workspaceId,
      clientId,
      meetingContext
    );

    // Get pending ideas grouped by type
    const ideas = await clientEmailIntelligenceService.getClientIdeas(
      workspaceId,
      clientId,
      { limit: 20 }
    );

    const pendingIdeas = ideas.filter(
      (i) => i.status !== 'completed' && i.status !== 'dismissed'
    );

    const ideasByType = {
      actionItems: pendingIdeas.filter((i) => i.type === 'action_item'),
      meetingRequests: pendingIdeas.filter((i) => i.type === 'meeting_request'),
      deadlines: pendingIdeas.filter((i) => i.type === 'deadline'),
      followUps: pendingIdeas.filter((i) => i.type === 'follow_up'),
      opportunities: pendingIdeas.filter((i) => i.type === 'opportunity'),
      concerns: pendingIdeas.filter((i) => i.type === 'concern'),
      questions: pendingIdeas.filter((i) => i.type === 'question'),
      decisionsNeeded: pendingIdeas.filter((i) => i.type === 'decision_needed'),
    };

    // Build meeting prep briefing
    const meetingBriefing = {
      clientName: summary.clientName,
      relationshipDuration: calculateRelationshipDuration(summary.firstContactAt),
      lastContactAt: summary.lastEmailAt,
      communicationFrequency: calculateFrequency(
        summary.totalMessages,
        summary.firstContactAt
      ),
      overallSentiment: getSentimentLabel(summary.averageSentiment),
      engagementScore: summary.engagementScore,
      keyTopics: insights?.keyTopics || [],
      talkingPoints: [
        ...(ideasByType.actionItems.length > 0
          ? [`${ideasByType.actionItems.length} pending action items to review`]
          : []),
        ...(ideasByType.deadlines.length > 0
          ? [`${ideasByType.deadlines.length} upcoming deadlines`]
          : []),
        ...(ideasByType.opportunities.length > 0
          ? [`${ideasByType.opportunities.length} potential opportunities to discuss`]
          : []),
        ...(ideasByType.concerns.length > 0
          ? [`${ideasByType.concerns.length} concerns to address`]
          : []),
        ...(ideasByType.questions.length > 0
          ? [`${ideasByType.questions.length} open questions`]
          : []),
      ],
      riskIndicators: insights?.riskIndicators || [],
      opportunitySignals: insights?.opportunitySignals || [],
      suggestedActions: insights?.suggestedActions || [],
    };

    // Optionally include timeline
    let timeline = null;
    if (includeTimeline) {
      timeline = await clientEmailIntelligenceService.getClientTimeline(
        workspaceId,
        clientId,
        { limit: 20 }
      );
    }

    return NextResponse.json({
      summary: {
        ...summary,
        insights,
      },
      pendingIdeas: ideasByType,
      meetingBriefing,
      timeline,
    });
  } catch (error) {
    console.error('Error generating client summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

// Helper functions

function calculateRelationshipDuration(firstContactAt: string | null): string {
  if (!firstContactAt) return 'Unknown';

  const start = new Date(firstContactAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}

function calculateFrequency(
  totalMessages: number,
  firstContactAt: string | null
): string {
  if (!firstContactAt || totalMessages === 0) return 'No activity';

  const start = new Date(firstContactAt);
  const now = new Date();
  const diffWeeks = Math.max(
    1,
    Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  );

  const messagesPerWeek = totalMessages / diffWeeks;

  if (messagesPerWeek >= 10) return 'Very Active (10+ msgs/week)';
  if (messagesPerWeek >= 5) return 'Active (5-10 msgs/week)';
  if (messagesPerWeek >= 2) return 'Regular (2-5 msgs/week)';
  if (messagesPerWeek >= 0.5) return 'Occasional (1-2 msgs/week)';
  return 'Infrequent (<1 msg/week)';
}

function getSentimentLabel(score: number): string {
  if (score > 0.5) return 'Very Positive';
  if (score > 0.2) return 'Positive';
  if (score > -0.2) return 'Neutral';
  if (score > -0.5) return 'Negative';
  return 'Very Negative';
}
