'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Calendar, 
  FolderOpen, 
  DollarSign,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: typeof Users;
  description?: string;
  color: string;
  bgColor: string;
  trend?: Array<{ month: string; value: number }>;
}

interface ActivityItem {
  id: string;
  type: 'consultation' | 'project' | 'payment' | 'user';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
}

const mockMetrics: MetricCard[] = [
  {
    title: 'Total Consultations',
    value: 127,
    previousValue: 98,
    change: 29.6,
    changeType: 'increase',
    icon: Calendar,
    description: 'This month',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    trend: [
      { month: 'Jan', value: 65 },
      { month: 'Feb', value: 78 },
      { month: 'Mar', value: 85 },
      { month: 'Apr', value: 98 },
      { month: 'May', value: 127 }
    ]
  },
  {
    title: 'Active Projects',
    value: 23,
    previousValue: 19,
    change: 21.1,
    changeType: 'increase',
    icon: FolderOpen,
    description: 'Currently running',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    trend: [
      { month: 'Jan', value: 12 },
      { month: 'Feb', value: 15 },
      { month: 'Mar', value: 17 },
      { month: 'Apr', value: 19 },
      { month: 'May', value: 23 }
    ]
  },
  {
    title: 'Revenue',
    value: '$45,230',
    previousValue: '$38,540',
    change: 17.4,
    changeType: 'increase',
    icon: DollarSign,
    description: 'This month',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    trend: [
      { month: 'Jan', value: 28500 },
      { month: 'Feb', value: 32100 },
      { month: 'Mar', value: 35800 },
      { month: 'Apr', value: 38540 },
      { month: 'May', value: 45230 }
    ]
  },
  {
    title: 'Client Satisfaction',
    value: '98.5%',
    previousValue: '96.2%',
    change: 2.3,
    changeType: 'increase',
    icon: Activity,
    description: 'Average rating',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    trend: [
      { month: 'Jan', value: 94.5 },
      { month: 'Feb', value: 95.1 },
      { month: 'Mar', value: 95.8 },
      { month: 'Apr', value: 96.2 },
      { month: 'May', value: 98.5 }
    ]
  }
];

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'consultation',
    title: 'New consultation booked',
    description: 'AI Infrastructure consultation with TechCorp',
    timestamp: '2 minutes ago',
    status: 'success',
    user: 'john.doe@techcorp.com'
  },
  {
    id: '2',
    type: 'project',
    title: 'Project milestone completed',
    description: 'SaaS Platform Development - Phase 2',
    timestamp: '15 minutes ago',
    status: 'success',
    user: 'Project Team'
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment received',
    description: '$12,500 from GlobalTech Solutions',
    timestamp: '1 hour ago',
    status: 'success',
    user: 'finance@globaltech.com'
  },
  {
    id: '4',
    type: 'user',
    title: 'New team member',
    description: 'Sarah Johnson joined as Senior Developer',
    timestamp: '2 hours ago',
    status: 'info',
    user: 'HR Team'
  },
  {
    id: '5',
    type: 'consultation',
    title: 'Consultation rescheduled',
    description: 'Security audit moved to next week',
    timestamp: '3 hours ago',
    status: 'warning',
    user: 'admin@securecorp.com'
  }
];

export function EnhancedDashboardCards() {
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    setAnimateCards(true);
  }, []);

  const formatChange = (change: number, type: 'increase' | 'decrease' | 'neutral') => {
    const sign = type === 'increase' ? '+' : type === 'decrease' ? '-' : '';
    return `${sign}${Math.abs(change)}%`;
  };

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockMetrics.map((metric, index) => (
          <Card 
            key={metric.title}
            className={`hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${
              animateCards ? 'animate-slide-in-left' : 'opacity-0'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {metric.value}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.description}
                </p>
                {metric.change && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    metric.changeType === 'increase' 
                      ? 'text-green-600' 
                      : metric.changeType === 'decrease' 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}>
                    {metric.changeType === 'increase' ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : metric.changeType === 'decrease' ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : null}
                    {formatChange(metric.change, metric.changeType!)}
                  </div>
                )}
              </div>
              {/* Mini trend indicator */}
              <div className="mt-3 h-12">
                <div className="flex items-end gap-1 h-full">
                  {metric.trend?.map((point) => (
                    <div
                      key={point.month}
                      className={`flex-1 rounded-t transition-all duration-300 ${metric.bgColor}`}
                      style={{
                        height: `${(point.value / Math.max(...metric.trend!.map(t => t.value))) * 100}%`,
                        minHeight: '4px'
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Book New Consultation
            </Button>
            <Button className="w-full justify-start bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border shadow-sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Create Project
            </Button>
            <Button className="w-full justify-start bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border shadow-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-300">
              Today&apos;s Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Consultations</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">3/5</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Project Tasks</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">12/18</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Goals</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">8/10</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-purple-700 dark:text-purple-300">
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Peak consultation time
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                2:00 PM - 4:00 PM
              </p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Most requested service
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                AI Infrastructure
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              <Eye className="h-4 w-4 mr-2" />
              View All Insights
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recent Activity
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Latest updates and notifications from your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivity.map((activity, index) => (
              <div 
                key={activity.id}
                className={`flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${
                  animateCards ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${(index + 4) * 0.1}s` }}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {activity.description}
                  </p>
                  {activity.user && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      by {activity.user}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" className="w-full md:w-auto">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
