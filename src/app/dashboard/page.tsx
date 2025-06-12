"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Target,
  Activity,
  Plus,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalClients: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  revenueGrowth: number;
  clientGrowth: number;
}

interface Project {
  id: string;
  name: string;
  client: string;
  progress: number;
  status: 'active' | 'completed' | 'on-hold';
  dueDate: string;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'completed' | 'overdue';
  dueDate: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalClients: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    revenueGrowth: 0,
    clientGrowth: 0
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Mock data loading
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Mock user data
        setUser({
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Admin'
        });

        // Mock stats
        setStats({
          totalRevenue: 125000,
          totalClients: 45,
          activeProjects: 12,
          completedTasks: 89,
          pendingTasks: 23,
          revenueGrowth: 12.5,
          clientGrowth: 8.3
        });

        // Mock recent projects
        setRecentProjects([
          {
            id: '1',
            name: 'Website Redesign',
            client: 'Tech Corp',
            progress: 75,
            status: 'active',
            dueDate: '2024-03-15'
          },
          {
            id: '2',
            name: 'Mobile App Development',
            client: 'StartupXYZ',
            progress: 45,
            status: 'active',
            dueDate: '2024-04-20'
          },
          {
            id: '3',
            name: 'Database Migration',
            client: 'Enterprise Ltd',
            progress: 100,
            status: 'completed',
            dueDate: '2024-02-01'
          }
        ]);

        // Mock recent tasks
        setRecentTasks([
          {
            id: '1',
            title: 'Update homepage design',
            assignee: 'Jane Smith',
            priority: 'high',
            status: 'in-progress',
            dueDate: '2024-02-15'
          },
          {
            id: '2',
            title: 'Client meeting preparation',
            assignee: 'Bob Johnson',
            priority: 'medium',
            status: 'todo',
            dueDate: '2024-02-18'
          },
          {
            id: '3',
            title: 'Security audit',
            assignee: 'Alice Wilson',
            priority: 'urgent',
            status: 'overdue',
            dueDate: '2024-02-10'
          }
        ]);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'on-hold':
        return <Badge className="bg-yellow-100 text-yellow-800">On Hold</Badge>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/crm">
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              View CRM
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">+{stats.revenueGrowth}%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">+{stats.clientGrowth}%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedTasks}/{stats.completedTasks + stats.pendingTasks}
            </div>
            <Progress 
              value={(stats.completedTasks / (stats.completedTasks + stats.pendingTasks)) * 100} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Projects</CardTitle>
              <Link href="/dashboard/crm/projects">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-gray-600">{project.client}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Progress value={project.progress} className="flex-1 h-2" />
                      <span className="text-xs text-gray-500">{project.progress}%</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Tasks</CardTitle>
              <Link href="/dashboard/crm/tasks">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-600">Assigned to: {task.assignee}</p>
                    <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/crm/clients">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Users className="h-6 w-6 mb-2" />
                <span className="text-sm">Add Client</span>
              </Button>
            </Link>
            <Link href="/dashboard/crm/projects">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Target className="h-6 w-6 mb-2" />
                <span className="text-sm">New Project</span>
              </Button>
            </Link>
            <Link href="/dashboard/crm/tasks">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <CheckCircle className="h-6 w-6 mb-2" />
                <span className="text-sm">Add Task</span>
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-sm">Create Invoice</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
