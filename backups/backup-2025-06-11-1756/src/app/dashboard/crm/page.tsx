'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileBarChart,
  Filter,
  Network,
  Plus,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import DashboardMetrics, { DashboardMetricsData } from '@/components/crm/dashboard/DashboardMetrics';
import DataCleanupTools from '@/components/crm/dashboard/DataCleanupTools';
import { TestDataRecord } from '@/lib/crm/test-data-manager';
import { DashboardOverview } from '@/components/crm/DashboardOverview';
import { AddClientModal } from '@/components/crm/clients/AddClientModal';
import { AddDealModal } from '@/components/crm/deals/AddDealModal';
import { AddTaskModal } from '@/components/crm/tasks/AddTaskModal';
import { AddInvoiceModal } from '@/components/crm/invoices/AddInvoiceModal';
import { ScheduleMeetingModal } from '@/components/crm/meetings/ScheduleMeetingModal';

// Real CRM Components (Mock Data Eliminated)
import ClientAnalytics from '@/components/crm/clients/ClientAnalytics';
import DealProbabilityEngine from '@/components/crm/deals/DealProbabilityEngine';
import FinancialAnalytics from '@/components/crm/financial/FinancialAnalytics';
import TaskIntelligence from '@/components/crm/tasks/TaskIntelligence';

// Mock data transformer for test records
const transformClientsToTestRecords = (clients: any[]): TestDataRecord[] => {
  return clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    revenue: client.total_revenue || 0,
    lastContact: client.last_contact ? new Date(client.last_contact) : undefined,
    createdAt: client.created_at ? new Date(client.created_at) : undefined,
  }));
};

export default function CRMDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState<'mtd' | 'ytd'>('mtd');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<DashboardMetricsData | null>(null);
  const [clients, setClients] = useState<TestDataRecord[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch main dashboard data
      const data = await apiClient.get('crm/dashboard');
      setDashboardData(data);

      // Transform to metrics format using real data
      const metrics: DashboardMetricsData = {
        revenue: {
          mtd: data.monthlyRevenue || 0,
          ytd: data.yearlyRevenue || 0,
          growth: data.revenueGrowth || 0,
        },
        clients: {
          active: data.activeClientsCount || 0,
          new: data.newClientsThisMonth || 0,
          retention: data.clientsCount > 0 
            ? Math.round((data.activeClientsCount / data.clientsCount) * 100) 
            : 0,
        },
        deals: {
          pipeline: data.pipelineValue || 0,
          conversion: data.conversionRate || 0,
          averageSize: data.dealsCount > 0 ? Math.round(data.revenue / data.dealsCount) : 0,
        },
        tasks: {
          completed: data.completedTasksCount || 0,
          pending: data.tasksCount - data.completedTasksCount || 0,
          completionRate: data.taskCompletionRate || 0,
        },
        carsi: data.carsiData || {
          enrollments: 0,
          courses: 0,
          revenue: 0,
        },
      };
      setMetricsData(metrics);

      // Fetch clients for data cleanup tools
      try {
        const clientsData = await apiClient.get('crm/clients');
        setClients(transformClientsToTestRecords(clientsData.data || []));
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        setClients([]);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Error loading dashboard</h3>
            <p className="text-slate-700 dark:text-slate-300 mt-2">{error}</p>
            <Button 
              onClick={fetchDashboardData}
              className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your customers, deals, and business insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchDashboardData}
                className="border-slate-300 dark:border-slate-600"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <AddDealModal onDealAdded={fetchDashboardData} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-7xl mx-auto grid-cols-8 h-auto p-1 gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="clients-ai" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="deals-ai" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Target className="h-4 w-4 mr-2" />
              Deals
            </TabsTrigger>
            <TabsTrigger value="financial-ai" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="tasks-ai" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Brain className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="data-quality" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Filter className="h-4 w-4 mr-2" />
              Data Quality
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <FileBarChart className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {dashboardData && (
              <>
                <DashboardOverview 
                  dealsCount={dashboardData.dealsCount || 0}
                  revenue={dashboardData.revenue || 0}
                  tasksCount={dashboardData.tasksCount || 0}
                  activitiesCount={dashboardData.activitiesCount || 0}
                  pipelineData={dashboardData.pipelineData || []}
                  recentActivities={(dashboardData.recentActivities || []).map((act: any) => ({
                    id: act.id,
                    type: 'note',
                    title: act.description,
                    user: 'System',
                    time: new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }))}
                />

                {/* Quick Actions Bar */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <AddClientModal 
                        onClientAdded={fetchDashboardData}
                        trigger={
                          <Button size="sm" variant="outline">
                            <Users className="h-4 w-4 mr-2" />
                            Add Client
                          </Button>
                        }
                      />
                      <ScheduleMeetingModal 
                        onMeetingScheduled={fetchDashboardData}
                        trigger={
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Meeting
                          </Button>
                        }
                      />
                      <AddTaskModal 
                        onTaskAdded={fetchDashboardData}
                        trigger={
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Create Task
                          </Button>
                        }
                      />
                      <AddInvoiceModal 
                        onInvoiceAdded={fetchDashboardData}
                        trigger={
                          <Button size="sm" variant="outline">
                            <DollarSign className="h-4 w-4 mr-2" />
                            New Invoice
                          </Button>
                        }
                      />
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="mt-6">
            {metricsData && (
              <>
                {/* Timeframe Selector */}
                <div className="flex justify-end mb-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={timeframe === 'mtd' ? 'default' : 'outline'}
                      onClick={() => setTimeframe('mtd')}
                    >
                      Month to Date
                    </Button>
                    <Button
                      size="sm"
                      variant={timeframe === 'ytd' ? 'default' : 'outline'}
                      onClick={() => setTimeframe('ytd')}
                    >
                      Year to Date
                    </Button>
                  </div>
                </div>

                <DashboardMetrics data={metricsData} timeframe={timeframe} />
              </>
            )}
          </TabsContent>

          {/* Client Analytics Tab */}
          <TabsContent value="clients-ai" className="mt-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Client Analytics</h2>
                <Badge className="bg-purple-100 text-purple-800">Real Data Analytics</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Client analytics with real data from your CRM database
              </p>
            </div>
            <ClientAnalytics />
          </TabsContent>

          {/* Deal Pipeline Tab */}
          <TabsContent value="deals-ai" className="mt-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Deal Pipeline</h2>
                <Badge className="bg-blue-100 text-blue-800">Real Data Analysis</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deal analysis and pipeline management with real database data
              </p>
            </div>
            <DealProbabilityEngine />
          </TabsContent>

          {/* Financial Analytics Tab */}
          <TabsContent value="financial-ai" className="mt-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Analytics</h2>
                <Badge className="bg-green-100 text-green-800">Real Financial Data</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Financial analytics and reporting with real transaction data
              </p>
            </div>
            <FinancialAnalytics />
          </TabsContent>

          {/* Task Management Tab */}
          <TabsContent value="tasks-ai" className="mt-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Management</h2>
                <Badge className="bg-orange-100 text-orange-800">Real Task Data</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Task management and analytics with real data from your CRM database
              </p>
            </div>
            <TaskIntelligence />
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="data-quality" className="mt-6">
            <DataCleanupTools records={clients} onRefresh={fetchDashboardData} />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Top Performers
                    <Badge>This Month</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.topPerformers?.length > 0 ? (
                      dashboardData.topPerformers.map((performer: any, index: number) => (
                        <div key={performer.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full ${index === 0 ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} flex items-center justify-center`}>
                              <Users className={`h-5 w-5 ${index === 0 ? 'text-teal-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium">Team Member {index + 1}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{performer.activitiesCount} activities</p>
                            </div>
                          </div>
                          <span className={`font-bold ${index === 0 ? 'text-teal-600' : 'text-blue-600'}`}>
                            ${performer.revenue.toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No activity data available yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Upcoming Deadlines
                    <Badge variant="destructive">Urgent</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.upcomingTasks?.slice(0, 3).map((task: any) => (
                      <div key={task.id} className="flex items-start gap-3">
                        <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
