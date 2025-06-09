import { NextResponse } from 'next/server';
import { DealPipelineWorkflows } from '@/lib/crm/business-logic/DealPipelineWorkflows';
import { TaskManagementSystem } from '@/lib/crm/business-logic/TaskManagementSystem';
import { FinancialTracking } from '@/lib/crm/business-logic/FinancialTracking';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('📊 CRM Dashboard API: Starting data fetch using business logic layer...');

    // Use business logic classes to get comprehensive data
    const [
      pipelineMetrics,
      dealsResult,
      taskMetrics,
      financialMetrics
    ] = await Promise.all([
      DealPipelineWorkflows.getPipelineMetrics(),
      DealPipelineWorkflows.getDealsByStage(),
      TaskManagementSystem.getTaskMetrics(),
      FinancialTracking.getFinancialMetrics()
    ]);

    console.log('📈 Pipeline metrics:', pipelineMetrics.success ? 'SUCCESS' : 'FAILED');
    console.log('🎯 Deals data:', dealsResult.success ? 'SUCCESS' : 'FAILED'); 
    console.log('✅ Task metrics:', taskMetrics.success ? 'SUCCESS' : 'FAILED');
    console.log('💰 Financial metrics:', financialMetrics.success ? 'SUCCESS' : 'FAILED');

    // Get basic client data
    let clientsData: any[] = [];
    let activitiesData: any[] = [];

    // Get server client
    const supabase = await createClient();

    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email, status, created_at, last_contact')
        .order('created_at', { ascending: false });
      
      clientsData = clients || [];
    } catch (error) {
      console.warn('⚠️ Error fetching clients:', error);
    }

    // Get recent activities
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: activities } = await supabase
        .from('activities')
        .select('id, type, timestamp, description, related_to, related_id, user_id')
        .gte('timestamp', oneWeekAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(20);
      
      activitiesData = activities || [];
    } catch (error) {
      console.warn('⚠️ Error fetching activities:', error);
    }

    // Process business logic results
    const deals = dealsResult.success ? dealsResult.deals || [] : [];
    const pipeline = pipelineMetrics.success ? pipelineMetrics.metrics : null;
    const tasks = taskMetrics.success ? taskMetrics.metrics : null;
    const financial = financialMetrics.success ? financialMetrics.metrics : null;

    // Calculate client metrics
    const activeClients = clientsData.filter(client => client.status === 'active').length;
    const newClientsThisMonth = clientsData.filter(client => {
      const createdDate = new Date(client.created_at);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear();
    }).length;

    // Process pipeline data for frontend
    const pipelineData = pipeline?.stageDistribution ? 
      Object.entries(pipeline.stageDistribution).map(([status, count]) => ({
        status,
        count,
        value: deals
          .filter((deal: any) => deal.status === status)
          .reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
      })) : [];

    // Get upcoming tasks separately since metrics don't include task list
    let upcomingTasks: any[] = [];
    try {
      const upcomingTasksResult = await TaskManagementSystem.getTasks({
        due_after: new Date().toISOString(),
        due_before: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
      });
      
      if (upcomingTasksResult.success && upcomingTasksResult.tasks) {
        upcomingTasks = upcomingTasksResult.tasks
          .filter(task => task.status !== 'completed' && task.status !== 'cancelled')
          .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())
          .slice(0, 5);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching upcoming tasks:', error);
    }

    // Calculate top performers from activities
    const performerStats = activitiesData.reduce<Record<string, {count: number, revenue: number}>>((acc, activity) => {
      if (activity.user_id) {
        if (!acc[activity.user_id]) {
          acc[activity.user_id] = { count: 0, revenue: 0 };
        }
        acc[activity.user_id].count += 1;
      }
      return acc;
    }, {});

    const topPerformers = Object.entries(performerStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([userId, stats]) => ({
        userId,
        activitiesCount: stats.count,
        revenue: stats.revenue
      }));

    // CARSI data placeholder
    const carsiData = {
      enrollments: 0,
      courses: 0,
      revenue: 0
    };

    const dashboardData = {
      // Core metrics from business logic
      dealsCount: pipeline?.totalDeals || 0,
      revenue: financial?.totalRevenue || 0,
      tasksCount: tasks?.totalTasks || 0,
      completedTasksCount: tasks?.completedTasks || 0,
      activitiesCount: activitiesData.length,
      clientsCount: clientsData.length,
      activeClientsCount: activeClients,
      newClientsThisMonth,
      pipelineValue: pipeline?.weightedPipelineValue || 0,
      conversionRate: pipeline?.conversionRate || 0,
      taskCompletionRate: tasks?.completionRate || 0,
      
      // Detailed data
      pipelineData,
      recentActivities: activitiesData.slice(0, 10),
      upcomingTasks,
      topPerformers,
      carsiData,
      
      // Financial metrics
      monthlyRevenue: financial?.monthlyRevenue || 0,
      yearlyRevenue: financial?.totalRevenue || 0, // Use total revenue as yearly
      revenueGrowth: financial?.growthRate || 0,
      clientGrowth: 0, // Will be calculated when we have historical data
      dealGrowth: 0    // Will be calculated when we have historical data
    };

    console.log('✅ Dashboard data compiled successfully');
    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('❌ Error in CRM dashboard API:', error);
    
    // Return minimal valid response on error
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
      carsiData: { enrollments: 0, courses: 0, revenue: 0 },
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      revenueGrowth: 0,
      clientGrowth: 0,
      dealGrowth: 0
    });
  }
}
