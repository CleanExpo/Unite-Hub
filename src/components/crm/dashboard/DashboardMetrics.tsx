import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Users, 
  Target, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  LucideIcon
} from 'lucide-react';

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
    open: number;
    won: number;
    pipeline: number;
  };
  tasks: {
    pending: number;
    completed: number;
    overdue: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: string;
  progress?: number;
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color,
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
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">from last period</span>
          </div>
        )}
        {progress !== undefined && (
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{progress}% of target</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  data: DashboardMetricsData;
  timeframe: 'mtd' | 'ytd';
}

export default function DashboardMetrics({ data, timeframe }: DashboardMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const revenueValue = timeframe === 'mtd' ? data.revenue.mtd : data.revenue.ytd;
  const revenueTarget = timeframe === 'mtd' ? 50000 : 500000; // Example targets
  const revenueProgress = Math.min((revenueValue / revenueTarget) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title={`Revenue (${timeframe.toUpperCase()})`}
        value={formatCurrency(revenueValue)}
        change={data.revenue.growth}
        icon={DollarSign}
        color="text-green-600"
        progress={revenueProgress}
      />
      
      <MetricCard
        title="Active Clients"
        value={data.clients.active}
        change={data.clients.new > 0 ? ((data.clients.new / data.clients.active) * 100) : 0}
        icon={Users}
        color="text-blue-600"
      />
      
      <MetricCard
        title="Open Deals"
        value={data.deals.open}
        change={data.deals.won > 0 ? ((data.deals.won / data.deals.open) * 100) : 0}
        icon={Target}
        color="text-purple-600"
        progress={data.deals.pipeline > 0 ? Math.min((data.deals.pipeline / 100000) * 100, 100) : 0}
      />
      
      <MetricCard
        title="Task Completion"
        value={`${data.tasks.completed}/${data.tasks.pending + data.tasks.completed}`}
        change={data.tasks.overdue > 0 ? -((data.tasks.overdue / data.tasks.pending) * 100) : 5}
        icon={CheckCircle}
        color="text-orange-600"
        progress={data.tasks.pending + data.tasks.completed > 0 
          ? (data.tasks.completed / (data.tasks.pending + data.tasks.completed)) * 100 
          : 0}
      />
    </div>
  );
}
