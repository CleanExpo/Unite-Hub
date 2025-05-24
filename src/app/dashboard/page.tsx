"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderOpen, CheckSquare, Settings, LogOut, Home, BarChart3, Plus, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        await loadDashboardData(user.id);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const loadDashboardData = async (userId: string) => {
    try {
      // Load projects
      const { data: projectsData } = await supabaseClient
        .from('research_projects')
        .select('*')
        .limit(5);
      
      if (projectsData) {
        setProjects(projectsData);
      }

      // Load tasks (if tasks table exists)
      const { data: tasksData } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .limit(5);
      
      if (tasksData) {
        setTasks(tasksData);
      }
    } catch (error) {
      console.log('Error loading dashboard data:', error);
    }
  };

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-lg">UG</span>
                </div>
                <h1 className="text-xl font-bold text-white">UNITE Group</h1>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center gap-2 text-teal-400 font-medium">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/projects" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <FolderOpen className="h-4 w-4" />
                  Projects
                </Link>
                <Link href="/tasks" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </Link>
                <Link href="/organizations" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <Users className="h-4 w-4" />
                  Organizations
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-300 text-sm">Welcome, {user?.email?.split('@')[0]}</span>
              <Link href="/profile" className="text-slate-300 hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
              </Link>
              <Button 
                onClick={handleSignOut}
                variant="ghost" 
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-slate-300 text-lg">
            Here's what's happening with your projects and tasks today.
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold text-white">{projects.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Pending Tasks</p>
                  <p className="text-3xl font-bold text-white">{tasks.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Team Members</p>
                  <p className="text-3xl font-bold text-white">1</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-white">85%</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Recent Projects
                <Button asChild size="sm" variant="ghost" className="text-teal-400 hover:text-teal-300">
                  <Link href="/projects">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project: any) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-white">{project.title}</h4>
                        <p className="text-sm text-slate-400">{project.description}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-teal-400 hover:text-teal-300">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No projects yet</p>
                  <Button asChild className="bg-teal-500 hover:bg-teal-600">
                    <Link href="/projects">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Project
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <Button asChild className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white justify-start h-12">
                  <Link href="/projects">
                    <FolderOpen className="mr-3 h-5 w-5" />
                    Create New Project
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 justify-start h-12">
                  <Link href="/tasks">
                    <CheckSquare className="mr-3 h-5 w-5" />
                    Add Task
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 justify-start h-12">
                  <Link href="/organizations">
                    <Users className="mr-3 h-5 w-5" />
                    Manage Organizations
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 justify-start h-12">
                  <Link href="/profile">
                    <Settings className="mr-3 h-5 w-5" />
                    Account Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Information */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Email Address</p>
                <p className="text-white font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">User ID</p>
                <p className="text-white font-mono text-sm">{user?.id}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Account Created</p>
                <p className="text-white font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Last Sign In</p>
                <p className="text-white font-medium">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
