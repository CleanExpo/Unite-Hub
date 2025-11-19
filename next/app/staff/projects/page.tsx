/**
 * Staff Projects Page - Phase 2 Step 3
 *
 * Project management interface for staff users
 * Will be wired to /api/staff/projects in Phase 2 Step 4
 */

import { Card } from '@/next/components/ui/Card';
import { Button } from '@/next/components/ui/Button';
import { Badge } from '@/next/components/ui/Badge';
import { FolderKanban, Plus, Search } from 'lucide-react';
import { Input } from '@/next/components/ui/Input';

export default function StaffProjectsPage() {
  // TODO: Fetch real projects from /api/staff/projects in Phase 2 Step 4
  const mockProjects = [
    {
      id: '1',
      status: 'active',
      progress: 65,
      client_users: {
        id: 'c1',
        name: 'Acme Corp',
        email: 'contact@acme.com',
      },
    },
    {
      id: '2',
      status: 'active',
      progress: 30,
      client_users: {
        id: 'c2',
        name: 'TechStart Inc',
        email: 'hello@techstart.io',
      },
    },
    {
      id: '3',
      status: 'completed',
      progress: 100,
      client_users: {
        id: 'c3',
        name: 'Design Studio',
        email: 'team@designstudio.com',
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            Projects
          </h1>
          <p className="text-gray-400 mt-2">
            Manage client projects and track progress
          </p>
        </div>

        <Button leftIcon={<Plus className="h-4 w-4" />}>
          New Project
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button variant="outline">
          All Projects
        </Button>
        <Button variant="outline">
          Active Only
        </Button>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <Card key={project.id} variant="glass">
            <div className="p-6">
              {/* Project header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FolderKanban className="h-6 w-6 text-blue-400" />
                </div>
                <Badge
                  variant={
                    project.status === 'active'
                      ? 'info'
                      : project.status === 'completed'
                      ? 'success'
                      : 'default'
                  }
                >
                  {project.status}
                </Badge>
              </div>

              {/* Client info */}
              <h3 className="text-lg font-semibold text-gray-100 mb-1">
                {project.client_users.name}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {project.client_users.email}
              </p>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
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

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="ghost" size="sm">
                  •••
                </Button>
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
              No projects found. Create your first project to get started.
            </p>
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Create Project
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
