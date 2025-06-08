import { createServiceClient } from '@/lib/supabase/unified-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Super simple approach - no joins, no views
    
    // 1. Get all deals
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, status, stage_id, amount');
      
    if (dealsError) {
      console.error('Deals error:', dealsError);
      throw dealsError;
    }

    // 2. Get all pipeline stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('id, name');
      
    if (stagesError) {
      console.error('Stages error:', stagesError);
      throw stagesError;
    }

    // 3. Create stage map
    const stageMap = new Map(stages?.map(s => [s.id, s.name]) || []);

    // 4. Process pipeline data manually
    const pipelineData: {stage: string, value: number}[] = [];
    const stageCount: Record<string, number> = {};
    
    deals?.forEach(deal => {
      const stageName = stageMap.get(deal.stage_id) || 'Unknown';
      stageCount[stageName] = (stageCount[stageName] || 0) + 1;
    });
    
    Object.entries(stageCount).forEach(([stage, count]) => {
      pipelineData.push({ stage, value: count });
    });

    // 5. Get tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at')
      .eq('status', 'in-progress');
      
    if (tasksError) {
      console.error('Tasks error:', tasksError);
      throw tasksError;
    }

    // 6. Get interactions
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select('id, interaction_type, interaction_date, summary')
      .gte('interaction_date', oneWeekAgo.toISOString());
      
    if (interactionsError) {
      console.error('Interactions error:', interactionsError);
      throw interactionsError;
    }

    // 7. Calculate revenue
    const revenue = deals?.reduce((sum, deal) => {
      return sum + ((deal.status === 'won' && deal.amount) ? Number(deal.amount) : 0);
    }, 0) || 0;

    // 8. Format activities
    const recentActivities = interactions?.slice(0, 3).map(i => ({
      id: i.id,
      type: i.interaction_type,
      timestamp: i.interaction_date,
      description: i.summary
    })) || [];

    // 9. Format tasks
    const upcomingTasks = tasks?.slice(0, 3) || [];

    // Return the data
    return NextResponse.json({
      dealsCount: deals?.length || 0,
      revenue,
      tasksCount: tasks?.length || 0,
      activitiesCount: interactions?.length || 0,
      pipelineData,
      recentActivities,
      upcomingTasks
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
