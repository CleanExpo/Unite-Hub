"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Filter,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface TaskData {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  client?: string;
  project?: string;
}

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  completionRate: number;
  averageCompletionTime: number;
}

interface TaskIntelligenceProps {
  data: TaskData[];
  timeframe: 'mtd' | 'ytd';
}

export default function TaskIntelligence({ data, timeframe }: TaskIntelligenceProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [metrics, setMetrics] = useState<TaskMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    inProgressTasks: 0,
    completionRate: 0,
    averageCompletionTime: 0
  });

  useEffect(() => {
    // Process the data prop
    setTasks(data || []);
    
    // Calculate metrics
    if (data && data.length > 0) {
      const completed = data.filter(task => task.status === 'completed').length;
      const overdue = data.filter(task => task.status === 'overdue').length;
      const inProgress = data.filter(task => task.status === 'in-progress').length;
      
      setMetrics({
        totalTasks: data.length,
        completedTasks: completed,
        overdueTasks: overdue,
        inProgressTasks: inProgress,
        completionRate: data.length > 0 ? (completed / data.length) * 100 : 0,
        averageCompletionTime: 5 // Mock data - days
      });
    }
  }, [data, timeframe]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'todo':
        return <Badge className="bg-gray-100 text-gray-800">To Do</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getOverdueTasks = () => {
    return tasks.filter(task => task.status === 'overdue');
  };

  const getHighPriorityTasks = () => {
    return tasks.filter(task => ['urgent', 'high'].includes(task.priority) && task.status !== 'completed');
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Task Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              All tasks in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
            <Progress value={metrics.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCompletionTime} days</div>
            <p className="text-xs text-muted-foreground">
              Average time to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="priority">High Priority</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Completed</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{metrics.completedTasks}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {metrics.totalTasks > 0 ? ((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(1) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>In Progress</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{metrics.inProgressTasks}</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {metrics.totalTasks > 0 ? ((metrics.inProgressTasks / metrics.totalTasks) * 100).toFixed(1) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Overdue</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-red-600">{metrics.overdueTasks}</span>
                    <Badge className="bg-red-100 text-red-800">
                      {metrics.totalTasks > 0 ? ((metrics.overdueTasks / metrics.totalTasks) * 100).toFixed(1) : 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{task.title}</h3>
                        <p className="text-xs text-muted-foreground">{task.assignee}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No tasks found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Overdue Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getOverdueTasks().map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span>Assignee: {task.assignee}</span>
                        <span>Due: {task.dueDate.toLocaleDateString()}</span>
                        {task.client && <span>Client: {task.client}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(task.priority)}
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {getOverdueTasks().length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No overdue tasks!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                High Priority Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighPriorityTasks().map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span>Assignee: {task.assignee}</span>
                        <span>Due: {task.dueDate.toLocaleDateString()}</span>
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(task.priority)}
                      <Button size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {getHighPriorityTasks().length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No high priority tasks pending
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Completion Rate</span>
                  <span className="font-medium">{metrics.completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.completionRate} />
                
                <div className="flex justify-between items-center">
                  <span>Average Completion Time</span>
                  <span className="font-medium">{metrics.averageCompletionTime} days</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>On-time Completion</span>
                  <span className="font-medium text-green-600">
                    {((metrics.completedTasks - metrics.overdueTasks) / Math.max(metrics.completedTasks, 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.overdueTasks > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Attention Required</strong> - {metrics.overdueTasks} tasks are overdue
                    </p>
                  </div>
                )}
                {metrics.completionRate >= 80 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Great Performance</strong> - {metrics.completionRate.toFixed(1)}% completion rate
                    </p>
                  </div>
                )}
                {getHighPriorityTasks().length > 0 && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Priority Focus</strong> - {getHighPriorityTasks().length} high priority tasks pending
                    </p>
                  </div>
                )}
                {metrics.averageCompletionTime <= 3 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Efficient Workflow</strong> - Tasks completed in {metrics.averageCompletionTime} days on average
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
