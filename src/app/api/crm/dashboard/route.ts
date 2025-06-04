import { createApiClient } from '@/lib/supabase/api';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createApiClient();

    // Fetch deals data
    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select('id, stage, status, created_at');

    if (dealsError) throw dealsError;

    // Fetch tasks data
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at')
      .eq('status', 'in-progress');

    if (tasksError) throw tasksError;

    // Fetch activities data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('id, type, timestamp, description')
      .gte('timestamp', oneWeekAgo.toISOString());

    if (activitiesError) throw activitiesError;

    // Process pipeline data (count of deals per stage)
    const pipelineData = dealsData.reduce((acc, deal) => {
      const existing = acc.find(item => item.stage === deal.stage);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({
          stage: deal.stage,
          count: 1
        });
      }
      return acc;
    }, []);

    // Calculate metrics
    const dealsCount = dealsData.length;
    // Since the 'value' column doesn't exist, we can't calculate revenue
    const tasksCount = tasksData.length;
    const activitiesCount = activitiesData.length;

    return NextResponse.json({
      dealsCount,
      tasksCount,
      activitiesCount,
      pipelineData: pipelineData.map(p => ({ stage: p.stage, count: p.count })),
      recentActivities: activitiesData.slice(0, 3),
      upcomingTasks: tasksData.slice(0, 3)
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
