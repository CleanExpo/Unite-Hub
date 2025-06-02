'use client';

import { DashboardOverview } from '@/components/crm/DashboardOverview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useState, useEffect } from 'react';

interface DashboardData {
  dealsCount: number;
  revenue: number;
  tasksCount: number;
  activitiesCount: number;
  pipelineData: { stage: string; value: number }[];
  recentActivities: Array<{
    id: string;
    description: string;
    timestamp: string;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    due_date: string;
  }>;
}

export default function CRMDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('crm/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
            <p className="mt-4 text-slate-300">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-400">Error loading dashboard</h3>
            <p className="text-slate-300 mt-2">{error}</p>
            <Button 
              onClick={fetchDashboardData}
              className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">CRM Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={fetchDashboardData}
            >
              Refresh Data
            </Button>
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
              Create New Deal
            </Button>
          </div>
        </div>

        {dashboardData && (
          <>
            <DashboardOverview 
              dealsCount={dashboardData.dealsCount}
              revenue={dashboardData.revenue}
              tasksCount={dashboardData.tasksCount}
              activitiesCount={dashboardData.activitiesCount}
              pipelineData={dashboardData.pipelineData}
              recentActivities={dashboardData.recentActivities.map(act => ({
                id: act.id,
                type: 'note',
                title: act.description,
                user: 'System',
                time: new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }))}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Upcoming Tasks */}

              {/* Upcoming Tasks */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Upcoming Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-start">
                        <div className="bg-slate-700 rounded-full p-2 mr-3">
                          <CheckCircle className="h-4 w-4 text-teal-400" />
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium">{task.title}</p>
                          <p className="text-slate-500 text-sm">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {dashboardData.upcomingTasks.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No upcoming tasks</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Conversion Rate</span>
                      <span className="text-teal-400 font-medium">
                        {dashboardData.pipelineData.length > 0 
                          ? `${Math.round((dashboardData.pipelineData[dashboardData.pipelineData.length-1].value / dashboardData.dealsCount) * 100)}%` 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Avg. Deal Size</span>
                      <span className="text-teal-400 font-medium">
                        {dashboardData.dealsCount > 0 
                          ? `$${Math.round(dashboardData.revenue / dashboardData.dealsCount).toLocaleString()}` 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Sales Cycle</span>
                      <span className="text-teal-400 font-medium">Calculating...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
