import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Mail, FileText, PlusCircle, Calendar, Users } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  user: string;
  time: string;
}

interface DashboardOverviewProps {
  dealsCount: number;
  revenue: number;
  tasksCount: number;
  activitiesCount: number;
  pipelineData: { stage: string; value: number }[];
  recentActivities?: ActivityItem[]; // Made optional
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  dealsCount,
  revenue,
  tasksCount,
  activitiesCount,
  pipelineData,
  recentActivities = []
}) => {
  const revenueFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(revenue);

  // Default recent activities if none provided
  const defaultActivities: ActivityItem[] = [
    { id: '1', type: 'email', title: 'Sent proposal to Acme Inc', user: 'You', time: '10 min ago' },
    { id: '2', type: 'note', title: 'Added notes to project', user: 'Alex Johnson', time: '1 hour ago' },
    { id: '3', type: 'call', title: 'Scheduled client meeting', user: 'You', time: '2 hours ago' },
  ];

  const activitiesToShow = recentActivities.length > 0 ? recentActivities : defaultActivities;

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Button className="flex flex-col h-24 justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700">
          <PlusCircle className="h-6 w-6 text-teal-400" />
          <span className="text-sm">New Deal</span>
        </Button>
        <Button className="flex flex-col h-24 justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700">
          <Mail className="h-6 w-6 text-teal-400" />
          <span className="text-sm">Send Email</span>
        </Button>
        <Button className="flex flex-col h-24 justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700">
          <Calendar className="h-6 w-6 text-teal-400" />
          <span className="text-sm">Schedule</span>
        </Button>
        <Button className="flex flex-col h-24 justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700">
          <FileText className="h-6 w-6 text-teal-400" />
          <span className="text-sm">Add Note</span>
        </Button>
        <Button className="flex flex-col h-24 justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700">
          <Activity className="h-6 w-6 text-teal-400" />
          <span className="text-sm">Log Activity</span>
        </Button>
        <Button className="flex flex-col h-24 justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700">
          <Users className="h-6 w-6 text-teal-400" />
          <span className="text-sm">Add Client</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Deals Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-400">{dealsCount}</div>
            <p className="text-slate-400 text-sm mt-2">Active deals in pipeline</p>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-400">{revenueFormatted}</div>
            <p className="text-slate-400 text-sm mt-2">Projected this quarter</p>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-400">{tasksCount}</div>
            <p className="text-slate-400 text-sm mt-2">Active tasks</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-slate-400 mb-1">
                <span>Completion</span>
                <span>42%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-400">{activitiesCount}</div>
            <p className="text-slate-400 text-sm mt-2">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activitiesToShow.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {activity.type === 'email' && <Mail className="h-5 w-5 text-teal-400" />}
                  {activity.type === 'note' && <FileText className="h-5 w-5 text-teal-400" />}
                  {activity.type === 'call' && <Activity className="h-5 w-5 text-teal-400" />}
                </div>
                <div>
                  <div className="font-medium text-white">{activity.title}</div>
                  <div className="text-sm text-slate-400">
                    <span>{activity.user}</span> â€¢ <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="link" className="text-teal-400 mt-4 p-0">
            View all activity
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline Visualization */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%"> {/* Fixed width value */}
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="stage" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="value" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
