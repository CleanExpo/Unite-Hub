import { createServiceClient } from '@/lib/supabase/unified-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Initialize default response data
    let dealsData: any[] = [];
    let tasksData: any[] = [];
    let activitiesData: any[] = [];
    let revenue = 0;

    // Try to fetch deals data
    try {
      // First try the view
      const viewResult = await supabase
        .from('deals_with_stages')
        .select('id, status, created_at, display_stage');
      
      if (viewResult.data) {
        dealsData = viewResult.data;
      } else {
        // If view doesn't exist, fetch from deals table directly
        const tableResult = await supabase
          .from('deals')
          .select(`
            id, 
            status, 
            created_at,
            stage_id,
            pipeline_stages (name)
          `);
        
        if (tableResult.data) {
          dealsData = tableResult.data.map((deal: any) => ({
            id: deal.id,
            status: deal.status,
            created_at: deal.created_at,
            display_stage: deal.status === 'won' ? 'Closed Won' : 
                          deal.status === 'lost' ? 'Closed Lost' : 
                          deal.pipeline_stages?.name || 'Unknown'
          }));
        }
      }
    } catch (error) {
      console.warn('Error fetching deals:', error);
    }

    // Fetch tasks data with error handling
    try {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, created_at')
        .eq('status', 'in-progress')
        .limit(10);
      
      if (data) tasksData = data;
    } catch (error) {
      console.warn('Error fetching tasks:', error);
    }

    // Fetch activities/interactions data with error handling
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Try activities view first
      const result = await supabase
        .from('activities')
        .select('id, type, timestamp, description')
        .gte('timestamp', oneWeekAgo.toISOString())
        .limit(10);
      
      if (!result.data || result.error) {
        // Fall back to interactions table
        const interactionsResult = await supabase
          .from('interactions')
          .select('id, interaction_type, interaction_date, summary')
          .gte('interaction_date', oneWeekAgo.toISOString())
          .limit(10);
        
        if (interactionsResult.data) {
          // Map the fields to match expected structure
          activitiesData = interactionsResult.data.map((item: any) => ({
            id: item.id,
            type: item.interaction_type,
            timestamp: item.interaction_date,
            description: item.summary
          }));
        }
      } else {
        activitiesData = result.data;
      }
    } catch (error) {
      console.warn('Error fetching activities:', error);
    }

    // Calculate revenue from won deals with error handling
    try {
      const { data: wonDeals } = await supabase
        .from('deals')
        .select('amount')
        .eq('status', 'won');
      
      if (wonDeals) {
        revenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
      }
    } catch (error) {
      console.warn('Error calculating revenue:', error);
    }

    // Process pipeline data
    const pipelineData = dealsData.reduce<{stage: string, value: number}[]>((acc, deal: any) => {
      const stageName = deal.display_stage || 'Unknown';
      const existing = acc.find(item => item.stage === stageName);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({
          stage: stageName,
          value: 1
        });
      }
      return acc;
    }, []);

    // Return successful response with whatever data we could fetch
    return NextResponse.json({
      dealsCount: dealsData.length,
      revenue,
      tasksCount: tasksData.length,
      activitiesCount: activitiesData.length,
      pipelineData,
      recentActivities: activitiesData.slice(0, 3),
      upcomingTasks: tasksData.slice(0, 3)
    });

  } catch (error) {
    console.error('Error in CRM dashboard:', error);
    // Return minimal valid response even on error
    return NextResponse.json({
      dealsCount: 0,
      revenue: 0,
      tasksCount: 0,
      activitiesCount: 0,
      pipelineData: [],
      recentActivities: [],
      upcomingTasks: []
    });
  }
}
