import { createServiceClient } from '@/lib/supabase/unified-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Simple test - just count deals
    const { count: dealsCount, error: countError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ 
        error: 'Count failed', 
        details: countError.message 
      }, { status: 500 });
    }

    // Get tasks count
    const { count: tasksCount, error: tasksCountError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-progress');

    if (tasksCountError) {
      return NextResponse.json({ 
        error: 'Tasks count failed', 
        details: tasksCountError.message 
      }, { status: 500 });
    }

    // Get activities count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { count: activitiesCount, error: activitiesCountError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .gte('interaction_date', oneWeekAgo.toISOString());

    if (activitiesCountError) {
      return NextResponse.json({ 
        error: 'Activities count failed', 
        details: activitiesCountError.message 
      }, { status: 500 });
    }

    // Simple pipeline data - just use status
    const { data: statusCounts, error: statusError } = await supabase
      .from('deals')
      .select('status');

    if (statusError) {
      return NextResponse.json({ 
        error: 'Status query failed', 
        details: statusError.message 
      }, { status: 500 });
    }

    // Count by status
    const statusMap = statusCounts?.reduce((acc: any, deal) => {
      acc[deal.status || 'unknown'] = (acc[deal.status || 'unknown'] || 0) + 1;
      return acc;
    }, {}) || {};

    const pipelineData = Object.entries(statusMap).map(([status, count]) => ({
      stage: status,
      value: count as number
    }));

    return NextResponse.json({
      dealsCount: dealsCount || 0,
      revenue: 0,
      tasksCount: tasksCount || 0,
      activitiesCount: activitiesCount || 0,
      pipelineData,
      recentActivities: [],
      upcomingTasks: []
    });

  } catch (error) {
    console.error('Error in simple dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
