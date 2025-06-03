import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function handleGET() {
  const supabase = await createClient();

  try {
    // Fetch deals data
    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select('id, value, stage, status, created_at');

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

    // Process pipeline data
    const pipelineData = dealsData.reduce((acc, deal) => {
      const existing = acc.find(item => item.stage === deal.stage);
      if (existing) {
        existing.value += 1;
        existing.totalValue += deal.value || 0;
      } else {
        acc.push({
          stage: deal.stage,
          value: 1,
          totalValue: deal.value || 0
        });
      }
      return acc;
    }, []);

    // Calculate metrics
    const dealsCount = dealsData.filter(d => d.status === 'active').length;
    const revenue = pipelineData.reduce((sum, stage) => sum + stage.totalValue, 0);
    const tasksCount = tasksData.length;
    const activitiesCount = activitiesData.length;

    return NextResponse.json({
      dealsCount,
      revenue,
      tasksCount,
      activitiesCount,
      pipelineData: pipelineData.map(p => ({ stage: p.stage, value: p.value })),
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

export const GET = handleGET;
