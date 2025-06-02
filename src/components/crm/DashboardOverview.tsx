import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardOverviewProps {
  dealsCount: number;
  revenue: number;
  tasksCount: number;
  activitiesCount: number;
  pipelineData: { stage: string; value: number }[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  dealsCount,
  revenue,
  tasksCount,
  activitiesCount,
  pipelineData
}) => {
  const revenueFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(revenue);

  return (
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

      {/* Pipeline Visualization */}
      <Card className="bg-slate-800 border-slate-700 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg text-white">Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
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
