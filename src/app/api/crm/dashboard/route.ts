import { createServiceClient } from '@/lib/supabase/unified-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Fetch deals data with proper stage names
    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id, 
        status, 
        created_at,
        stage_id,
        pipeline_stages (name)
      `);

    if (dealsError) throw dealsError;

    // Fetch tasks data
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at')
      .eq('status', 'in-progress');

    if (tasksError) throw tasksError;

    // Fetch activities data (from interactions table)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('interactions')
      .select('id, interaction_type as type, interaction_date as timestamp, summary as description')
      .gte('interaction_date', oneWeekAgo.toISOString());

    if (activitiesError) throw activitiesError;

    // Process pipeline data (count of deals per stage)
    const pipelineData = dealsData?.reduce<{stage: string, count: number}[]>((acc, deal: any) => {
      const stageName = deal.pipeline_stages?.name || 'Unknown';
      const existing = acc.find(item => item.stage === stageName);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({
          stage: stageName,
          count: 1
        });
      }
      return acc;
    }, []) || [];

    // Calculate metrics
    const dealsCount = dealsData?.length || 0;
    const tasksCount = tasksData?.length || 0;
    const activitiesCount = activitiesData?.length || 0;
    
    // Calculate revenue from won deals
    const { data: wonDeals } = await supabase
      .from('deals')
      .select('amount')
      .eq('status', 'won');
    
    const revenue = wonDeals?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0;

    return NextResponse.json({
      dealsCount,
      revenue,
      tasksCount,
      activitiesCount,
      pipelineData: pipelineData.map(p => ({ stage: p.stage, value: p.count })), // Changed 'count' to 'value' to match frontend
      recentActivities: activitiesData?.slice(0, 3) || [],
      upcomingTasks: tasksData?.slice(0, 3) || []
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
