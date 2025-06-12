import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    const cookieStore = cookies();
    const supabase = createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch total clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString());

    if (clientsError) {
      console.error('Clients fetch error:', clientsError);
      return NextResponse.json({ error: 'Failed to fetch clients data' }, { status: 500 });
    }

    // Fetch deals with their values
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, title, value, stage, status, created_at, client_id')
      .gte('created_at', startDate.toISOString());

    if (dealsError) {
      console.error('Deals fetch error:', dealsError);
      return NextResponse.json({ error: 'Failed to fetch deals data' }, { status: 500 });
    }

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, priority, created_at, assigned_to')
      .gte('created_at', startDate.toISOString());

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks data' }, { status: 500 });
    }

    // Fetch invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, amount, status, due_date, created_at, client_id')
      .gte('created_at', startDate.toISOString());

    if (invoicesError) {
      console.error('Invoices fetch error:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices data' }, { status: 500 });
    }

    // Fetch recent audit trail activities
    const { data: auditActivities, error: auditError } = await supabase
      .from('audit_trail')
      .select('id, action, entity_type, entity_id, user_id, created_at, metadata')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (auditError) {
      console.error('Audit trail fetch error:', auditError);
    }

    // Calculate analytics
    const totalClients = clients?.length || 0;
    const totalDeals = deals?.length || 0;
    const totalRevenue = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
    
    const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
    const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;
    const overdueInvoices = invoices?.filter(invoice => 
      invoice.status !== 'paid' && new Date(invoice.due_date) < now
    ).length || 0;

    const closedDeals = deals?.filter(deal => deal.status === 'closed').length || 0;
    const dealConversionRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0;

    // Monthly revenue data
    const monthlyRevenue = calculateMonthlyRevenue(deals || [], range);

    // Deals by stage
    const dealsByStage = calculateDealsByStage(deals || []);

    // Tasks by status
    const tasksByStatus = calculateTasksByStatus(tasks || []);

    // Top clients by revenue
    const topClients = await calculateTopClients(supabase, deals || [], clients || []);

    // Recent activity from audit trail
    const recentActivity = formatRecentActivity(auditActivities || []);

    const analyticsData = {
      totalClients,
      totalDeals,
      totalRevenue,
      completedTasks,
      pendingTasks,
      overdueInvoices,
      dealConversionRate,
      monthlyRevenue,
      dealsByStage,
      tasksByStatus,
      topClients,
      recentActivity
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateMonthlyRevenue(deals: any[], range: string) {
  const months: { [key: string]: { revenue: number; deals: number } } = {};
  
  deals.forEach(deal => {
    const date = new Date(deal.created_at);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!months[monthKey]) {
      months[monthKey] = { revenue: 0, deals: 0 };
    }
    
    months[monthKey].revenue += deal.value || 0;
    months[monthKey].deals += 1;
  });

  return Object.entries(months)
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      deals: data.deals
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

function calculateDealsByStage(deals: any[]) {
  const stages: { [key: string]: { count: number; value: number } } = {};
  
  deals.forEach(deal => {
    const stage = deal.stage || 'Unknown';
    
    if (!stages[stage]) {
      stages[stage] = { count: 0, value: 0 };
    }
    
    stages[stage].count += 1;
    stages[stage].value += deal.value || 0;
  });

  return Object.entries(stages).map(([stage, data]) => ({
    stage,
    count: data.count,
    value: data.value
  }));
}

function calculateTasksByStatus(tasks: any[]) {
  const statusColors = {
    pending: '#F59E0B',
    'in-progress': '#3B82F6',
    completed: '#10B981',
    cancelled: '#EF4444'
  };

  const statuses: { [key: string]: number } = {};
  
  tasks.forEach(task => {
    const status = task.status || 'pending';
    statuses[status] = (statuses[status] || 0) + 1;
  });

  return Object.entries(statuses).map(([status, count]) => ({
    status,
    count,
    color: statusColors[status as keyof typeof statusColors] || '#6B7280'
  }));
}

async function calculateTopClients(supabase: any, deals: any[], clients: any[]) {
  const clientRevenue: { [key: string]: { name: string; revenue: number; deals: number } } = {};
  
  // Group deals by client
  deals.forEach(deal => {
    if (deal.client_id) {
      if (!clientRevenue[deal.client_id]) {
        clientRevenue[deal.client_id] = { name: '', revenue: 0, deals: 0 };
      }
      clientRevenue[deal.client_id].revenue += deal.value || 0;
      clientRevenue[deal.client_id].deals += 1;
    }
  });

  // Get client names
  for (const clientId of Object.keys(clientRevenue)) {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      clientRevenue[clientId].name = client.name || `Client ${clientId}`;
    }
  }

  return Object.values(clientRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function formatRecentActivity(activities: any[]) {
  return activities.map(activity => ({
    id: activity.id,
    type: activity.entity_type || 'System',
    description: generateActivityDescription(activity),
    timestamp: activity.created_at,
    user: activity.user_id ? `User ${activity.user_id}` : 'System'
  }));
}

function generateActivityDescription(activity: any) {
  const { action, entity_type, metadata } = activity;
  
  switch (action) {
    case 'created':
      return `New ${entity_type} created`;
    case 'updated':
      return `${entity_type} updated`;
    case 'deleted':
      return `${entity_type} deleted`;
    case 'status_changed':
      return `${entity_type} status changed to ${metadata?.new_status || 'unknown'}`;
    default:
      return `${action} performed on ${entity_type}`;
  }
}
