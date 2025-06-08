import { createServiceClient } from '@/lib/supabase/unified-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Initialize default response data
    let dealsData: any[] = [];
    let tasksData: any[] = [];
    let activitiesData: any[] = [];
    let clientsData: any[] = [];
    let revenue = 0;
    let completedTasksCount = 0;
    let pipelineValue = 0;

    // Fetch clients data
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email, status, created_at, last_contact')
        .order('created_at', { ascending: false });
      
      if (clients) clientsData = clients;
    } catch (error) {
      console.warn('Error fetching clients:', error);
    }

    // Try to fetch deals data
    try {
      // First try the view
      const viewResult = await supabase
        .from('deals_with_stages')
        .select('id, status, created_at, display_stage, amount, client_id, title');
      
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
            amount,
            client_id,
            title,
            pipeline_stages (name)
          `);
        
        if (tableResult.data) {
          dealsData = tableResult.data.map((deal: any) => ({
            id: deal.id,
            status: deal.status,
            created_at: deal.created_at,
            amount: deal.amount || 0,
            client_id: deal.client_id,
            title: deal.title,
            display_stage: deal.status === 'won' ? 'Closed Won' : 
                          deal.status === 'lost' ? 'Closed Lost' : 
                          deal.pipeline_stages?.name || 'Unknown'
          }));
        }
      }
    } catch (error) {
      console.warn('Error fetching deals:', error);
    }

    // Fetch all tasks data
    try {
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, created_at, priority, assigned_to');
      
      if (allTasks) {
        tasksData = allTasks;
        completedTasksCount = allTasks.filter(task => task.status === 'completed').length;
      }
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
        .select('id, type, timestamp, description, client_id, user_id')
        .gte('timestamp', oneWeekAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (!result.data || result.error) {
        // Fall back to interactions table
        const interactionsResult = await supabase
          .from('interactions')
          .select('id, interaction_type, interaction_date, summary, client_id, user_id')
          .gte('interaction_date', oneWeekAgo.toISOString())
          .order('interaction_date', { ascending: false })
          .limit(50);
        
        if (interactionsResult.data) {
          // Map the fields to match expected structure
          activitiesData = interactionsResult.data.map((item: any) => ({
            id: item.id,
            type: item.interaction_type,
            timestamp: item.interaction_date,
            description: item.summary,
            client_id: item.client_id,
            user_id: item.user_id
          }));
        }
      } else {
        activitiesData = result.data;
      }
    } catch (error) {
      console.warn('Error fetching activities:', error);
    }

    // Calculate revenue and pipeline value from deals
    try {
      const wonDeals = dealsData.filter(deal => deal.status === 'won');
      const openDeals = dealsData.filter(deal => deal.status !== 'won' && deal.status !== 'lost');
      
      revenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
      pipelineValue = openDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    } catch (error) {
      console.warn('Error calculating revenue:', error);
    }

    // Calculate additional metrics
    const activeClients = clientsData.filter(client => client.status === 'active').length;
    const newClientsThisMonth = clientsData.filter(client => {
      const createdDate = new Date(client.created_at);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear();
    }).length;

    // Calculate conversion rate
    const totalDeals = dealsData.length;
    const wonDealsCount = dealsData.filter(deal => deal.status === 'won').length;
    const conversionRate = totalDeals > 0 ? Math.round((wonDealsCount / totalDeals) * 100) : 0;

    // Process pipeline data with actual values
    const pipelineData = dealsData.reduce<{stage: string, value: number, count: number}[]>((acc, deal: any) => {
      const stageName = deal.display_stage || 'Unknown';
      const existing = acc.find(item => item.stage === stageName);
      if (existing) {
        existing.count += 1;
        existing.value += (deal.amount || 0);
      } else {
        acc.push({
          stage: stageName,
          count: 1,
          value: deal.amount || 0
        });
      }
      return acc;
    }, []);

    // Get top performers from activities
    const performerStats = activitiesData.reduce<Record<string, {count: number, revenue: number}>>((acc, activity) => {
      if (activity.user_id) {
        if (!acc[activity.user_id]) {
          acc[activity.user_id] = { count: 0, revenue: 0 };
        }
        acc[activity.user_id].count += 1;
      }
      return acc;
    }, {});

    // Calculate task completion rate
    const taskCompletionRate = tasksData.length > 0 
      ? Math.round((completedTasksCount / tasksData.length) * 100) 
      : 0;

    // Get CARSI-related data (if exists)
    const carsiData = {
      enrollments: 0,
      courses: 0,
      revenue: 0
    };

    try {
      // Check if we have CARSI-related tables
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id, client_id, course_id, enrollment_date, status')
        .eq('status', 'active');
      
      if (enrollments) {
        carsiData.enrollments = enrollments.length;
        // Get unique courses
        const uniqueCourses = new Set(enrollments.map(e => e.course_id));
        carsiData.courses = uniqueCourses.size;
      }
    } catch (error) {
      // CARSI tables might not exist yet, that's okay
      console.info('CARSI tables not configured yet');
    }

    // Return comprehensive dashboard data
    return NextResponse.json({
      // Core metrics
      dealsCount: dealsData.length,
      revenue,
      tasksCount: tasksData.length,
      completedTasksCount,
      activitiesCount: activitiesData.length,
      clientsCount: clientsData.length,
      activeClientsCount: activeClients,
      newClientsThisMonth,
      pipelineValue,
      conversionRate,
      taskCompletionRate,
      
      // Detailed data
      pipelineData,
      recentActivities: activitiesData.slice(0, 10),
      upcomingTasks: tasksData
        .filter(task => task.status !== 'completed' && task.due_date)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 5),
      
      // Performance data
      topPerformers: Object.entries(performerStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([userId, stats]) => ({
          userId,
          activitiesCount: stats.count,
          revenue: stats.revenue
        })),
      
      // CARSI data
      carsiData,
      
      // Time-based metrics
      monthlyRevenue: revenue, // Current month revenue
      yearlyRevenue: revenue * 12, // Projected yearly (will be replaced with actual when we have historical data)
      
      // Growth metrics (will be calculated from historical data when available)
      revenueGrowth: 0,
      clientGrowth: 0,
      dealGrowth: 0
    });

  } catch (error) {
    console.error('Error in CRM dashboard:', error);
    // Return minimal valid response even on error
    return NextResponse.json({
      dealsCount: 0,
      revenue: 0,
      tasksCount: 0,
      completedTasksCount: 0,
      activitiesCount: 0,
      clientsCount: 0,
      activeClientsCount: 0,
      newClientsThisMonth: 0,
      pipelineValue: 0,
      conversionRate: 0,
      taskCompletionRate: 0,
      pipelineData: [],
      recentActivities: [],
      upcomingTasks: [],
      topPerformers: [],
      carsiData: {
        enrollments: 0,
        courses: 0,
        revenue: 0
      },
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      revenueGrowth: 0,
      clientGrowth: 0,
      dealGrowth: 0
    });
  }
}
