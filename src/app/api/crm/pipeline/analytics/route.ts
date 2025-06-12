import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// REAL PIPELINE ANALYTICS API - NO MOCK DATA
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch all deals within time range
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id,
        title,
        value,
        stage,
        status,
        created_at,
        updated_at,
        closed_at
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (dealsError) {
      console.error('Error fetching deals for analytics:', dealsError);
      return NextResponse.json(
        { error: 'Failed to fetch deals data' },
        { status: 500 }
      );
    }

    // Calculate analytics from real data
    const analytics = calculatePipelineAnalytics(deals || []);

    return NextResponse.json({
      data: analytics,
      timeRange,
      totalRecords: deals?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error in pipeline analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculatePipelineAnalytics(deals: any[]) {
  if (deals.length === 0) {
    return {
      stageDistribution: [],
      dealValueByStage: [],
      conversionRate: 0,
      avgDealSize: 0,
      totalDeals: 0,
      totalValue: 0,
      isEmpty: true
    };
  }

  // Stage distribution - count deals per stage
  const stageDistribution = deals.reduce((acc: { [key: string]: number }, deal) => {
    const stage = deal.stage || 'Unassigned';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const stageDistributionArray = Object.entries(stageDistribution).map(([stage, count]) => ({
    stage,
    count: count as number
  }));

  // Deal value by stage - sum values per stage
  const dealValueByStage = deals.reduce((acc: { [key: string]: number }, deal) => {
    const stage = deal.stage || 'Unassigned';
    const value = parseFloat(deal.value) || 0;
    acc[stage] = (acc[stage] || 0) + value;
    return acc;
  }, {});

  const dealValueByStageArray = Object.entries(dealValueByStage).map(([stage, total]) => ({
    stage,
    total: total as number
  }));

  // Calculate total metrics
  const totalValue = deals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0);
  const totalDeals = deals.length;
  const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

  // Calculate conversion rate (closed won vs total)
  const closedWonDeals = deals.filter(deal => 
    deal.status === 'won' || deal.stage === 'Closed Won' || deal.stage === 'Won'
  ).length;
  const conversionRate = totalDeals > 0 ? (closedWonDeals / totalDeals) * 100 : 0;

  // Calculate additional metrics
  const closedLostDeals = deals.filter(deal => 
    deal.status === 'lost' || deal.stage === 'Closed Lost' || deal.stage === 'Lost'
  ).length;

  const activeDeals = deals.filter(deal => 
    !['won', 'lost'].includes(deal.status) && 
    !['Closed Won', 'Won', 'Closed Lost', 'Lost'].includes(deal.stage)
  ).length;

  // Calculate average time in pipeline for closed deals
  const closedDeals = deals.filter(deal => deal.closed_at);
  const avgTimeInPipeline = closedDeals.length > 0 
    ? closedDeals.reduce((sum, deal) => {
        const created = new Date(deal.created_at);
        const closed = new Date(deal.closed_at);
        return sum + (closed.getTime() - created.getTime());
      }, 0) / (closedDeals.length * 24 * 60 * 60 * 1000) // Convert to days
    : 0;

  return {
    stageDistribution: stageDistributionArray,
    dealValueByStage: dealValueByStageArray,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgDealSize: Math.round(avgDealSize * 100) / 100,
    totalDeals,
    totalValue: Math.round(totalValue * 100) / 100,
    additionalMetrics: {
      activeDeals,
      closedWonDeals,
      closedLostDeals,
      avgTimeInPipeline: Math.round(avgTimeInPipeline * 10) / 10
    },
    isEmpty: false
  };
}

// Stage mappings for consistency
const STANDARD_STAGES = [
  'Lead',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
];

// Function to normalize stage names
function normalizeStage(stage: string): string {
  const lowerStage = stage.toLowerCase();
  
  if (lowerStage.includes('lead') || lowerStage.includes('prospect')) return 'Lead';
  if (lowerStage.includes('qual')) return 'Qualified';
  if (lowerStage.includes('proposal') || lowerStage.includes('quote')) return 'Proposal';
  if (lowerStage.includes('negot') || lowerStage.includes('review')) return 'Negotiation';
  if (lowerStage.includes('won') || lowerStage.includes('closed') && lowerStage.includes('won')) return 'Closed Won';
  if (lowerStage.includes('lost') || lowerStage.includes('closed') && lowerStage.includes('lost')) return 'Closed Lost';
  
  return stage; // Return original if no match
}
