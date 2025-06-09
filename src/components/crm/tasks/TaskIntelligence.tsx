"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Target, AlertCircle, Loader2, Calendar, BarChart3, Users } from 'lucide-react';

interface TaskIntelligenceProps {
  projectId?: string;
}

interface TaskData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  created_at: string;
  clients: {
    name: string;
    company: string;
  };
}

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  recentTasks: number;
}

// REAL Task Intelligence Component - NO MOCK DATA, NO FAKE AI
export default function TaskIntelligence({ projectId }: TaskIntelligenceProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [metrics, setMetrics] = useState<TaskMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    statusBreakdown: {},
    priorityBreakdown: {},
    recentTasks: 0
  });

  // Fetch real task data from API
  useEffect(() => {
    const fetchRealTaskData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/crm/tasks');
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }

        const data = await response.json();
        const tasksData = data.data || [];
        setTasks(tasksData);

        // Calculate REAL metrics from actual data
        const realMetrics = calculateRealMetrics(tasksData);
        setMetrics(realMetrics);

      } catch (error) {
        console.error('Error fetching task data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load task data');
      } finally {
        setLoading(false);
      }
    };

    fetchRealTaskData();
  }, [projectId]);

  // Calculate real task metrics from actual database data
  const calculateRealMetrics = (tasksData: TaskData[]): TaskMetrics => {
    const totalTasks = tasksData.length;
    const completedTasks = tasksData.filter(task => 
      task.status === 'completed' || task.status === 'done'
    ).length;
    const inProgressTasks = tasksData.filter(task => 
      task.status === 'in_progress' || task.status === 'active'
    ).length;

    // Calculate overdue tasks (due_date passed and not completed)
    const now = new Date();
    const overdueTasks = tasksData.filter(task => {
      if (!task.due_date || task.status === 'completed' || task.status === 'done') return false;
      return new Date(task.due_date) < now;
    }).length;

    // Calculate status breakdown
    const statusBreakdown: Record<string, number> = {};
    tasksData.forEach(task => {
      const status = task.status || 'unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Calculate priority breakdown
    const priorityBreakdown: Record<string, number> = {};
    tasksData.forEach(task => {
      const priority = task.priority || 'medium';
      priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
    });

    // Calculate recent tasks (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTasks = tasksData.filter(task => 
      new Date(task.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      statusBreakdown,
      priorityBreakdown,
      recentTasks
    };
  };

  // Get tasks by status
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  // Get tasks by priority
  const getTasksByPriority = (priority: string) => {
    return tasks.filter(task => task.priority === priority);
  };

  // Get overdue tasks
  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.due_date || task.status === 'completed' || task.status === 'done') return false;
      return new Date(task.due_date) < now;
    }).slice(0, 10);
  };

  // Get recent tasks
  const getRecentTasks = () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return tasks
      .filter(task => new Date(task.created_at) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  };

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[priority as keyof typeof variants] || variants.medium}>
      {priority.toUpperCase()}
    </Badge>;
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      done: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      active: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real task data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real Task Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.inProgressTasks} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recentTasks}</div>
            <p className="text-xs text-muted-foreground">
              Added last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real Task Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="status">
            <CheckCircle className="w-4 h-4 mr-2" />
            Status Breakdown
          </TabsTrigger>
          <TabsTrigger value="priority">
            <Target className="w-4 h-4 mr-2" />
            Priority Analysis
          </TabsTrigger>
          <TabsTrigger value="attention">
            <AlertCircle className="w-4 h-4 mr-2" />
            Needs Attention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real breakdown of task statuses and priorities from database
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Status Distribution</h4>
                  {Object.entries(metrics.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h5 className="font-medium capitalize">{status.replace('_', ' ')}</h5>
                          <p className="text-sm text-muted-foreground">{count} tasks</p>
                        </div>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Priority Distribution</h4>
                  {Object.entries(metrics.priorityBreakdown).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h5 className="font-medium capitalize">{priority}</h5>
                          <p className="text-sm text-muted-foreground">{count} tasks</p>
                        </div>
                      </div>
                      {getPriorityBadge(priority)}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed view of tasks by status from actual data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="capitalize font-medium">{status.replace('_', ' ')}</span>
                      <span>{count} tasks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / metrics.totalTasks) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {Object.keys(metrics.statusBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No task status data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Priority Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real task priority distribution and analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.priorityBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium capitalize">{priority} Priority</h4>
                          <p className="text-sm text-muted-foreground">
                            {count} tasks ({Math.round((count / metrics.totalTasks) * 100)}% of total)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getPriorityBadge(priority)}
                        <div className="text-lg font-bold mt-1">{count}</div>
                      </div>
                    </div>
                  ))}
                {Object.keys(metrics.priorityBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No priority data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks Needing Attention</CardTitle>
              <p className="text-sm text-muted-foreground">
                Overdue tasks and recent activity requiring immediate attention
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics.overdueTasks > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-3">Overdue Tasks</h4>
                    <div className="space-y-3">
                      {getOverdueTasks().map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                          <div>
                            <h5 className="font-medium">{task.title}</h5>
                            <p className="text-sm text-muted-foreground">
                              {task.clients.name} • {task.clients.company}
                            </p>
                            <p className="text-xs text-red-600">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            {getPriorityBadge(task.priority)}
                            {getStatusBadge(task.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">Recent Task Activity</h4>
                  <div className="space-y-3">
                    {getRecentTasks().map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h5 className="font-medium">{task.title}</h5>
                          <p className="text-sm text-muted-foreground">
                            {task.clients.name} • {task.clients.company}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(task.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                    ))}
                    {getRecentTasks().length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent task activity
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
