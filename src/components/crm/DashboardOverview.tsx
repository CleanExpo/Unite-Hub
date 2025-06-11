import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Mail, FileText, PlusCircle, Calendar, Users } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  description: string;
  timestamp: Date;
  client?: string;
}

interface DashboardOverviewProps {
  data: any;
  timeframe: 'mtd' | 'ytd';
  onRefresh: () => void;
  pipelineData: { stage: string; value: number }[];
  recentActivities?: ActivityItem[]; // Made optional
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  timeframe,
  onRefresh,
  pipelineData,
  recentActivities = []
}) => {
  const quickActions = [
    { icon: Users, label: 'Add Client', action: () => console.log('Add client') },
    { icon: FileText, label: 'Create Deal', action: () => console.log('Create deal') },
    { icon: Calendar, label: 'Schedule Meeting', action: () => console.log('Schedule meeting') },
    { icon: Mail, label: 'Send Email', action: () => console.log('Send email') },
    { icon: PlusCircle, label: 'Add Task', action: () => console.log('Add task') },
    { icon: Activity, label: 'View Reports', action: () => console.log('View reports') },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="flex flex-col h-24 justify-center items-center gap-2"
                onClick={action.action}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-xs text-center">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'call' && <Activity className="h-4 w-4 text-blue-500" />}
                      {activity.type === 'email' && <Mail className="h-4 w-4 text-green-500" />}
                      {activity.type === 'meeting' && <Calendar className="h-4 w-4 text-purple-500" />}
                      {activity.type === 'task' && <FileText className="h-4 w-4 text-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activity.description}
                      </p>
                      {activity.client && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.client}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {activity.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent activities
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data?.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {timeframe === 'mtd' ? 'This month' : 'This year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.activeClients || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.openDeals || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              In pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.pendingTasks || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
