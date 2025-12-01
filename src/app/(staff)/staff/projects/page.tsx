// Force dynamic
export const dynamic = 'force-dynamic';
/**
 * Staff Projects Page - Phase 2 Step 4
 *
 * Project management interface for staff users
 * Fully wired to /api/staff/projects
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StaffProgressRing from '@/components/staff/StaffProgressRing';
import { FolderKanban, Plus, Search, Calendar, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getStaffProjects } from '@/lib/services/staff/staffService';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

export default async function StaffProjectsPage() {
  // Fetch real projects from API
  const response = await getStaffProjects().catch(() => ({ data: [] }));
  const projects = response?.data || [];

  // Calculate stats
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
    : 0;

  return (
    <PageContainer>
      <Section>
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

          <Button icon={<Plus className="h-4 w-4" />}>
            New Project
          </Button>
        </div>
      </Section>

      <Section>
        {/* Project stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Active Projects</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {activeProjects}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {completedProjects}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {avgProgress}%
              </p>
            </div>
            <StaffProgressRing percent={avgProgress} size={60} />
          </div>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            icon={<Search className="h-4 w-4" />}
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
        {projects.map((project) => (
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
                {project.name || 'Unnamed Project'}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {project.description || 'No description'}
              </p>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm font-medium text-gray-100">
                    {project.progress || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Project metadata */}
              {(project.deadline || project.team_size) && (
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  {project.deadline && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {project.team_size && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{project.team_size} members</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => console.log('View project:', project.id)}
                >
                  View Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('More options:', project.id)}
                >
                  •••
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <FolderKanban className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No projects found. Create your first project to get started.
            </p>
            <Button icon={<Plus className="h-4 w-4" />}>
              Create Project
            </Button>
          </div>
        </Card>
      )}
      </Section>
    </PageContainer>
  );
}
