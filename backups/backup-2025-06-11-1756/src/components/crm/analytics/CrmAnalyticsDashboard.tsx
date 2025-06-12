'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, CheckCircle, 
  Clock, AlertCircle, Target, Activity 
} from 'lucide-react';

interface AnalyticsData {
  totalClients: number;
  totalDeals: number;
  totalRevenue: number;
  completedTasks: number;
  pendingTasks: number;
  overdueInvoices: number;
  dealConversionRate: number;
  monthlyRevenue: Array<{ month: string; revenue: number; deals: number }>;
  dealsByStage: Array<{ stage: string; count: number; value: number }>;
  tasksByStatus: Array<{ status: string; count: number; color: string }>;
  topClients: Array<{ name: string; revenue: number; deals: number }>;
  recentActivity: Array<{ 
    id: string; 
    type: string; 
    description: string; 
    timestamp: string;
    user: string;
  }>;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6'
};

export default function CrmAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = COLORS.primary 
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && trendValue && (
          <div className={`text-xs flex items-center mt-1 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend === 'down' ? 'rotate-180' : ''
            }`} />
            {trendValue} from last period
          </div>
        )}
      </CardContent>
    </Card>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading analytics: {error}</span>
          </div>
          <Button 
            onClick={fetchAnalyticsData} 
            variant="outline" 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your business performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={analyticsData.totalClients}
          icon={Users}
          trend="up"
          trendValue="+12%"
          color={COLORS.info}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analyticsData.totalRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue="+8.5%"
          color={COLORS.success}
        />
        <StatCard
          title="Active Deals"
          value={analyticsData.totalDeals}
          icon={Target}
          trend="up"
          trendValue="+5.2%"
          color={COLORS.primary}
        />
        <StatCard
          title="Conversion Rate"
          value={`${analyticsData.dealConversionRate}%`}
          icon={TrendingUp}
          trend="up"
          trendValue="+2.1%"
          color={COLORS.warning}
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthlyRevenue}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Task Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
                <CardDescription>Current task distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.tasksByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {analyticsData.tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4">
                  {analyticsData.tasksByStatus.map((item, index) => (
                    <Badge key={index} variant="outline" style={{ borderColor: item.color }}>
                      {item.status}: {item.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                        <span>{activity.user}</span>
                        <span>â€¢</span>
                        <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{activity.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Deals by Stage */}
            <Card>
              <CardHeader>
                <CardTitle>Deals by Stage</CardTitle>
                <CardDescription>Pipeline distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.dealsByStage}>
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Deal Value by Stage */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Value by Stage</CardTitle>
                <CardDescription>Total value in each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.dealsByStage.map((stage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(stage.value)}
                        </span>
                      </div>
                      <Progress 
                        value={(stage.value / Math.max(...analyticsData.dealsByStage.map(s => s.value))) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Completed Tasks"
              value={analyticsData.completedTasks}
              icon={CheckCircle}
              trend="up"
              trendValue="+15%"
              color={COLORS.success}
            />
            <StatCard
              title="Pending Tasks"
              value={analyticsData.pendingTasks}
              icon={Clock}
              trend="down"
              trendValue="-8%"
              color={COLORS.warning}
            />
            <StatCard
              title="Task Completion Rate"
              value={`${Math.round((analyticsData.completedTasks / (analyticsData.completedTasks + analyticsData.pendingTasks)) * 100)}%`}
              icon={Target}
              trend="up"
              trendValue="+12%"
              color={COLORS.info}
            />
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Deals Correlation</CardTitle>
              <CardDescription>Monthly revenue and deal count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.monthlyRevenue}>
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    name="Revenue"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="deals" 
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="Deals"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.deals} deals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(client.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
