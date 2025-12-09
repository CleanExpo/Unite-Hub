/**
 * Synthex Competitor Intelligence API
 * Phase B30: AI-Powered Competitive Analysis
 *
 * GET  - List competitors for tenant
 * POST - Add a new competitor to monitor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getCompetitors,
  getCompetitor,
  monitorCompetitor,
  updateCompetitor,
  deleteCompetitor,
  generateCompetitorReport,
  competitorForecast,
  getCompetitorSummary,
  type CompetitorType,
} from '@/lib/synthex/competitorIntelligenceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const competitorId = searchParams.get('competitorId');
    const action = searchParams.get('action');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Get summary
    if (action === 'summary') {
      const summary = await getCompetitorSummary(tenantId);
      return NextResponse.json({ summary });
    }

    // Get forecast for specific competitor
    if (action === 'forecast' && competitorId) {
      const forecast = await competitorForecast(tenantId, competitorId);
      return NextResponse.json({ forecast });
    }

    // Get single competitor
    if (competitorId) {
      const competitor = await getCompetitor(tenantId, competitorId);
      if (!competitor) {
        return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
      }
      return NextResponse.json({ competitor });
    }

    // List all competitors
    const competitors = await getCompetitors(tenantId);

    return NextResponse.json({ competitors, count: competitors.length });
  } catch (error) {
    console.error('Error in competitors GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, action, ...params } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    // Generate report action
    if (action === 'generate_report') {
      const { competitor_id } = params;
      if (!competitor_id) {
        return NextResponse.json({ error: 'competitor_id is required' }, { status: 400 });
      }
      const report = await generateCompetitorReport(tenant_id, competitor_id);
      return NextResponse.json({ report });
    }

    // Add new competitor
    const { domain, company_name, competitor_type, priority } = body;

    if (!domain) {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const competitor = await monitorCompetitor({
      tenant_id,
      domain,
      company_name,
      competitor_type: competitor_type as CompetitorType,
      priority,
    });

    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error) {
    console.error('Error in competitors POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, competitor_id, company_name, competitor_type, priority, is_active } = body;

    if (!tenant_id || !competitor_id) {
      return NextResponse.json(
        { error: 'tenant_id and competitor_id are required' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (company_name !== undefined) {
updates.company_name = company_name;
}
    if (competitor_type !== undefined) {
updates.competitor_type = competitor_type;
}
    if (priority !== undefined) {
updates.priority = priority;
}
    if (is_active !== undefined) {
updates.is_active = is_active;
}

    const competitor = await updateCompetitor(tenant_id, competitor_id, updates);

    return NextResponse.json({ competitor });
  } catch (error) {
    console.error('Error in competitors PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const competitorId = searchParams.get('competitorId');

    if (!tenantId || !competitorId) {
      return NextResponse.json(
        { error: 'tenantId and competitorId are required' },
        { status: 400 }
      );
    }

    await deleteCompetitor(tenantId, competitorId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in competitors DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
