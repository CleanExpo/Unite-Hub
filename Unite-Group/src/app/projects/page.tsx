'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, DollarSign, Users, BarChart3, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'on-hold';
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  client: string;
  team: string[];
  tasks: {
    id: string;
    name: string;
    status: 'todo' | 'in-progress' | 'completed';
    assignee: string;
    dueDate: string;
  }[];
  timeline: {
    phase: string;
    startDate: string;
    endDate: string;
    status: 'completed' | 'current' | 'upcoming';
  }[];
}

const statusColors = {
  planning: 'bg-blue-500',
  'in-progress': 'bg-yellow-500',
  review: 'bg-purple-500',
  completed: 'bg-green-500',
  'on-hold': 'bg-red-500'
};

const statusIcons = {
  planning: Clock,
  'in-progress': BarChart3,
  review: AlertCircle,
  completed: CheckCircle,
  'on-hold': XCircle
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedProject(null)}
              className="mb-4 border-teal-600 text-teal-400 hover:bg-teal-600 hover:text-white"
            >
              ← Back to Projects
            </Button>
            <h1 className="text-4xl font-bold mb-2">{selectedProject.name}</h1>
            <p className="text-slate-300 text-lg">{selectedProject.description}</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Progress</CardTitle>
                    <BarChart3 className="h-4 w-4 text-teal-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{selectedProject.progress}%</div>
                    <Progress value={selectedProject.progress} className="mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Budget</CardTitle>
                    <DollarSign className="h-4 w-4 text-teal-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      ${selectedProject.spent.toLocaleString()} / ${selectedProject.budget.toLocaleString()}
                    </div>
                    <Progress 
                      value={(selectedProject.spent / selectedProject.budget) * 100} 
                      className="mt-2" 
                    />
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Status</CardTitle>
                    {(() => {
                      const StatusIcon = statusIcons[selectedProject.status];
                      return <StatusIcon className="h-4 w-4 text-teal-400" />;
                    })()}
                  </CardHeader>
                  <CardContent>
                    <Badge className={`${statusColors[selectedProject.status]} text-white`}>
                      {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Client</p>
                      <p className="text-white">{selectedProject.client}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Duration</p>
                      <p className="text-white">
                        {new Date(selectedProject.startDate).toLocaleDateString()} - {new Date(selectedProject.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              {selectedProject.timeline.map((phase, index) => (
                <Card key={index} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${
                        phase.status === 'completed' ? 'bg-green-500' :
                        phase.status === 'current' ? 'bg-yellow-500' :
                        'bg-slate-500'
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{phase.phase}</h3>
                        <p className="text-sm text-slate-400">
                          {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                        {phase.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              {selectedProject.tasks.map((task) => (
                <Card key={task.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{task.name}</h3>
                        <p className="text-sm text-slate-400">Assigned to: {task.assignee}</p>
                        <p className="text-sm text-slate-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                      <Badge className={
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in-progress' ? 'bg-yellow-500' :
                        'bg-slate-500'
                      }>
                        {task.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProject.team.map((member, index) => (
                  <Card key={index} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-white">{member}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Projects</h1>
          <p className="text-slate-300 text-lg">
            Manage and track all your projects in one place
          </p>
        </div>

        {projects.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
              <p className="text-slate-400 mb-4">
                You don&apos;t have any projects yet. Contact us to get started!
              </p>
              <Button className="bg-teal-600 hover:bg-teal-700">
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const StatusIcon = statusIcons[project.status];
              return (
                <Card 
                  key={project.id} 
                  className="bg-slate-800 border-slate-700 hover:border-teal-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{project.name}</CardTitle>
                      <StatusIcon className="h-5 w-5 text-teal-400" />
                    </div>
                    <CardDescription className="text-slate-400">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Badge className={`${statusColors[project.status]} text-white`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-slate-400">{project.client}</span>
                      </div>

                      <div className="flex justify-between text-sm text-slate-400">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          {new Date(project.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${project.budget.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
