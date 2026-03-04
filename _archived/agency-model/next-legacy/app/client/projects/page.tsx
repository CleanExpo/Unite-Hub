/**
 * Client Projects Page - Phase 2 Step 3
 *
 * Project tracking interface for clients
 * Will be wired to APIs in Phase 2 Step 4
 */

import { Card } from '@/next/components/ui/Card';
import { Button } from '@/next/components/ui/Button';
import { Badge } from '@/next/components/ui/Badge';
import { FolderKanban, Calendar, TrendingUp } from 'lucide-react';

export default function ClientProjectsPage() {
  // TODO: Fetch real projects from API in Phase 2 Step 4
  const mockProjects = [
    {
      id: '1',
      title: 'Restaurant Management App',
      status: 'in_progress',
      progress: 45,
      start_date: '2025-11-01',
      estimated_completion: '2025-12-15',
      milestones: [
        { title: 'Design Phase', completed: true },
        { title: 'Backend Development', completed: false },
        { title: 'Frontend Development', completed: false },
        { title: 'Testing', completed: false },
      ],
    },
    {
      id: '2',
      title: 'E-commerce Platform',
      status: 'planning',
      progress: 10,
      start_date: '2025-11-15',
      estimated_completion: '2026-02-01',
      milestones: [
        { title: 'Requirements Gathering', completed: true },
        { title: 'Architecture Design', completed: false },
        { title: 'Development', completed: false },
        { title: 'Launch', completed: false },
      ],
    },
  ];

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      planning: 'warning',
      in_progress: 'info',
      completed: 'success',
      on_hold: 'default',
    };
    return variants[status] || 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">
          My Projects
        </h1>
        <p className="text-gray-400 mt-2">
          Track your project progress and milestones
        </p>
      </div>

      {/* Project stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Active Projects</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {mockProjects.filter((p) => p.status === 'in_progress').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Planning</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {mockProjects.filter((p) => p.status === 'planning').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Avg. Progress</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {Math.round(
                mockProjects.reduce((sum, p) => sum + p.progress, 0) /
                  mockProjects.length
              )}
              %
            </p>
          </div>
        </Card>
      </div>

      {/* Projects list */}
      <div className="space-y-6">
        {mockProjects.map((project) => (
          <Card key={project.id}>
            <div className="p-6">
              {/* Project header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <FolderKanban className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-100">
                      {project.title}
                    </h3>
                    <Badge
                      variant={getStatusVariant(project.status)}
                      className="mt-2"
                    >
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Overall Progress</span>
                  <span className="text-sm font-medium text-gray-100">
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center space-x-6 mb-6 text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {formatDate(project.start_date)}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>Est. Completion: {formatDate(project.estimated_completion)}</span>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">
                  Milestones
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {project.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        milestone.completed
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            milestone.completed ? 'bg-green-400' : 'bg-gray-600'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            milestone.completed ? 'text-gray-100' : 'text-gray-400'
                          }`}
                        >
                          {milestone.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {mockProjects.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <FolderKanban className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No active projects yet. Submit an idea to start your first project.
            </p>
            <Button>
              Submit an Idea
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
