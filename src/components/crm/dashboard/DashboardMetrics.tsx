'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  Package,
  GraduationCap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color?: string;
  subtitle?: string;
  progress?: number;
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'text-gray-600',
  subtitle,
  progress,
}: MetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {change !== undefined && (
          <p className={`text-xs flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {change >= 0 ? '+' : ''}{change}% from last month
          </p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-2" />
        )}
      </CardContent>
    </Card>
  );
}

export interface DashboardMetricsData {
  revenue: {
    mtd: number;
    ytd: number;
    growth: number;
  };
  clients: {
    active: number;
    new: number;
    retention: number;
  };
  deals: {
    pipeline: number;
    conversion: number;
    averageSize: number;
  };
  tasks: {
    completed: number;
    pending: number;
    completionRate: number;
  };
  carsi?: {
    enrollments: number;
    courses: number;
    revenue: number;
  };
}

interface DashboardMetricsProps {
  data: DashboardMetricsData;
  timeframe?: 'mtd' | 'ytd';
}

export default function DashboardMetrics({ data, timeframe = 'mtd' }: DashboardMetricsProps) {
  const revenueValue = timeframe === 'mtd' ? data.revenue.mtd : data.revenue.ytd;
  const timeframeLabel = timeframe === 'mtd' ? 'Month to Date' : 'Year to Date';

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
        <p className="text-teal-100">
          Performance overview for {new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-teal-100 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(revenueValue)}</p>
          </div>
          <div>
            <p className="text-teal-100 text-sm">Active Clients</p>
            <p className="text-3xl font-bold">{data.clients.active}</p>
          </div>
          <div>
            <p className="text-teal-100 text-sm">Deal Pipeline</p>
            <p className="text-3xl font-bold">{formatCurrency(data.deals.pipeline)}</p>
          </div>
          <div>
            <p className="text-teal-100 text-sm">Task Completion</p>
            <p className="text-3xl font-bold">{data.tasks.completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Metrics */}
        <MetricCard
          title={`Revenue (${timeframeLabel})`}
          value={formatCurrency(revenueValue)}
          change={data.revenue.growth}
          icon={DollarSign}
          color="text-green-600"
          subtitle={timeframe === 'mtd' ? `YTD: ${formatCurrency(data.revenue.ytd)}` : undefined}
        />

        {/* Client Metrics */}
        <MetricCard
          title="Active Clients"
          value={data.clients.active}
          icon={Users}
          color="text-blue-600"
          subtitle={`${data.clients.new} new this month`}
          progress={data.clients.retention}
        />

        {/* Deal Metrics */}
        <MetricCard
          title="Deal Pipeline"
          value={formatCurrency(data.deals.pipeline)}
          icon={Target}
          color="text-purple-600"
          subtitle={`Avg size: ${formatCurrency(data.deals.averageSize)}`}
          progress={data.deals.conversion}
        />

        {/* Task Metrics */}
        <MetricCard
          title="Task Completion"
          value={`${data.tasks.completionRate}%`}
          icon={CheckCircle2}
          color="text-orange-600"
          subtitle={`${data.tasks.completed} of ${data.tasks.completed + data.tasks.pending} tasks`}
          progress={data.tasks.completionRate}
        />
      </div>

      {/* CARSI Integration Metrics (if available) */}
      {data.carsi && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-teal-600" />
              CARSI Education Metrics
            </h3>
            <Badge className="bg-teal-600 text-white">Powered by CARSI</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Memberships</p>
              <p className="text-2xl font-bold">{data.carsi.enrollments}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Courses In Progress</p>
              <p className="text-2xl font-bold">{data.carsi.courses}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Education Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(data.carsi.revenue)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
          <p className="text-xl font-bold">{data.deals.conversion}%</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Client Retention</p>
          <p className="text-xl font-bold">{data.clients.retention}%</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Deal Size</p>
          <p className="text-xl font-bold">{formatCurrency(data.deals.averageSize)}</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Pending</p>
          <p className="text-xl font-bold">{data.tasks.pending}</p>
        </div>
      </div>
    </div>
  );
}
