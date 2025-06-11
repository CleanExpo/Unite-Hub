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
          open: data.openDealsCount || 0,
          won: data.wonDealsThisMonth || 0,
          pipeline: data.pipelineValue || 0,
        },
        tasks: {
          pending: data.pendingTasksCount || 0,
          completed: data.completedTasksThisMonth || 0,
          overdue: data.overdueTasksCount || 0,
        },
      };
      setMetricsData(metrics);

      // Fetch and transform clients data
      const clientsData = await apiClient.get('crm/clients');
      setClients(transformClientsToTestRecords(clientsData.clients || []));

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading CRM Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              CRM Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive customer relationship management and analytics
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <Button
                variant={timeframe === 'mtd' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('mtd')}
              >
                MTD
              </Button>
              <Button
                variant={timeframe === 'ytd' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('ytd')}
              >
                YTD
              </Button>
            </div>
            
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        {metricsData && (
          <div className="mb-8">
            <DashboardMetrics data={metricsData} timeframe={timeframe} />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Deals</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview 
              data={dashboardData} 
              timeframe={timeframe}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Client Analytics
              </h2>
              <AddClientModal onClientAdded={handleRefresh} />
            </div>
            <ClientAnalytics 
              clients={clients}
              timeframe={timeframe}
            />
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Deal Probability Engine
              </h2>
              <AddDealModal onDealAdded={handleRefresh} />
            </div>
            <DealProbabilityEngine 
              data={dashboardData?.deals || []}
              timeframe={timeframe}
            />
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Financial Analytics
              </h2>
              <AddInvoiceModal onInvoiceAdded={handleRefresh} />
            </div>
            <FinancialAnalytics 
              data={dashboardData}
              timeframe={timeframe}
            />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Task Intelligence
              </h2>
              <div className="flex space-x-2">
                <AddTaskModal onTaskAdded={handleRefresh} />
                <ScheduleMeetingModal onMeetingScheduled={handleRefresh} />
              </div>
            </div>
            <TaskIntelligence 
              data={dashboardData?.tasks || []}
              timeframe={timeframe}
            />
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Data Management Tools
              </h2>
            </div>
            <DataCleanupTools 
              clients={clients}
              onDataUpdated={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
