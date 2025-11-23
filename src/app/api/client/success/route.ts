/**
 * Client Success API Route
 * Phase 48: API endpoint for fetching and managing client success data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  getClientSuccessScore,
  getEngagementHistory,
  trackEngagementEvent,
  calculateSuccessScore,
} from '@/lib/services/clientSuccessService';
import {
  getClientInsights,
  markInsightRead,
  dismissInsight,
} from '@/lib/services/clientInsightsService';

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);

      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only the client themselves can view their success data
      if (userData.user.id !== clientId) {
        // Check if staff
        const supabase = await getSupabaseServer();
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', userData.user.id)
          .single();

        if (profile?.role !== 'staff' && profile?.role !== 'admin') {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    }

    // Fetch all success data in parallel
    const [scoreResult, insightsResult, historyResult] = await Promise.all([
      getClientSuccessScore(clientId),
      getClientInsights(clientId, { limit: 10 }),
      getEngagementHistory(clientId, 30),
    ]);

    return NextResponse.json({
      score: scoreResult.score || null,
      insights: insightsResult.insights || [],
      heatmap: historyResult.history || [],
    });
  } catch (error) {
    console.error('Error fetching success data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, insightId, clientId, eventType, eventData } = body;

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | null = null;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);

      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = userData.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = userData.user.id;
    }

    switch (action) {
      case 'mark-read': {
        if (!insightId || !clientId) {
          return NextResponse.json(
            { error: 'Insight ID and Client ID required' },
            { status: 400 }
          );
        }

        if (userId !== clientId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const result = await markInsightRead(insightId, clientId);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      case 'dismiss': {
        if (!insightId || !clientId) {
          return NextResponse.json(
            { error: 'Insight ID and Client ID required' },
            { status: 400 }
          );
        }

        if (userId !== clientId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const result = await dismissInsight(insightId, clientId);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      case 'track-event': {
        if (!clientId || !eventType) {
          return NextResponse.json(
            { error: 'Client ID and event type required' },
            { status: 400 }
          );
        }

        // Get organization ID
        const supabase = await getSupabaseServer();
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('org_id')
          .eq('user_id', clientId)
          .single();

        if (!userOrg) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const result = await trackEngagementEvent({
          clientId,
          organizationId: userOrg.org_id,
          eventType,
          eventData: eventData || {},
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating success data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, organizationId } = body;

    // Verify authentication (should be staff or system)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);

    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate success score
    const result = await calculateSuccessScore(clientId, organizationId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      score: result.score,
    });
  } catch (error) {
    console.error('Error calculating success score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
