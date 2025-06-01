'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Clock,
  CheckCircle,
  PlusCircle,
  Building,
  Activity,
  TrendingUp
} from 'lucide-react';
import PipelineBoard from '@/components/crm/PipelineBoard';
import PipelineAnalytics from '@/components/crm/PipelineAnalytics';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  upcomingConsultations: number;
  pendingTasks: number;
  completedTasksThisMonth: number;
}

interface RecentActivity {
  id: string;
  entity_type: string;
  action: string;
  entity_name?: string;
  performed_at: string;
  performed_by_name?: string;
}

export default function CRMDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalRevenue: 0,
    upcomingConsultations: 0,
    pendingTasks: 0,
    completedTasksThisMonth: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch client stats
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      const { count: activeClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('client_status', 'active');

      // Fetch project stats
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Calculate total revenue from projects
      const { data: projectRevenue } = await supabase
        .from('projects')
        .select('budget');
      
      const totalRevenue = projectRevenue?.reduce((sum, project) => sum + (project.budget || 0), 0) || 0;

      // Fetch upcoming consultations
      const { count: upcomingConsultations } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .gte('preferred_date', new Date().toISOString())
        .eq('status', 'scheduled');

      // Fetch task stats
      const { count: pendingTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['todo', 'in_progress']);

      // Fetch completed tasks this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: completedTasksThisMonth } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .gte('completed_date', startOfMonth.toISOString());

      // Fetch recent activities
      const { data: activities } = await supabase
        .from('activity_log')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(10);

      setStats({
        totalClients: totalClients || 0,
        activeClients: activeClients || 0,
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        totalRevenue,
        upcomingConsultations: upcomingConsultations || 0,
        pendingTasks: pendingTasks || 0,
        completedTasksThisMonth: completedTasksThisMonth || 0,
      });

      setRecentActivities(activities || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case 'client':
        return <Building className="h-4 w-4" />;
      case 'project':
        return <Briefcase className="h-4 w-4" />;
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600';
      case 'updated':
        return 'text-blue-600';
      case 'deleted':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">CRM Dashboard</h1>
            <p className="text-blue-100">
              Manage your clients, projects, and business relationships
            </p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => router.push('/dashboard/crm/clients/new')}
            className="bg-white text-indigo-600 hover:bg-gray-100"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-green-600 font-medium">
                +{Math.floor(stats.activeClients/stats.totalClients*100)}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {stats.activeClients} active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <div className="flex items-center mt-1">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full" 
                  style={{ width: `${Math.floor(stats.activeProjects/stats.totalProjects*100)}%` }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {stats.activeProjects}/{stats.totalProjects}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium ml-1">
                +12% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.completedTasksThisMonth} completed this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push('/dashboard/crm/clients/new')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Client
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push('/dashboard/crm/projects/new')}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push('/dashboard/crm/tasks')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  View Tasks
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push('/consultations')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Consultation
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest changes in your CRM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`mt-0.5 ${getActivityColor(activity.action)}`}>
                        {getActivityIcon(activity.entity_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium capitalize">{activity.entity_type}</span>
                          {' '}
                          <span className={getActivityColor(activity.action)}>
                            {activity.action}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.performed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline & Analytics Section */}
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Deal Pipeline</CardTitle>
                <CardDescription>Current sales pipeline status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-auto">
                  <PipelineBoard />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Analytics</CardTitle>
                <CardDescription>Key metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <PipelineAnalytics />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Deal Pipeline</CardTitle>
              <CardDescription>Manage your sales pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineBoard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Analytics</CardTitle>
              <CardDescription>Detailed performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
              <CardDescription>View and manage all your clients</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/crm/clients')}>
                View All Clients
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>Track and manage your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/crm/projects')}>
                View All Projects
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>Manage your tasks and to-dos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/crm/tasks')}>
                View All Tasks
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
