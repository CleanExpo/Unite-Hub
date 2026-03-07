// Force dynamic
export const dynamic = 'force-dynamic';
/**
 * Staff Projects Page - Phase 2 Step 4
 *
 * Project management interface for staff users
 * Fully wired to /api/staff/projects
 */

import { Badge } from '@/components/ui/badge';
import StaffProgressRing from '@/components/staff/StaffProgressRing';
import { FolderKanban, Plus, Search, Calendar, Users } from 'lucide-react';
import { getStaffProjects } from '@/lib/services/staff/staffService';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

export default async function StaffProjectsPage() {
  const response = await getStaffProjects().catch(() => ({ data: [] }));
  const projects = response?.data || [];

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
    : 0;

  return (
    <PageContainer>
      <Section>
        <div className="min-h-screen bg-[#050505] space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-mono">Projects</h1>
              <p className="text-white/40 font-mono text-sm mt-1">
                Manage client projects and track progress
              </p>
            </div>
            <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-[#00F5FF]/90">
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>

          {/* Project stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-xs text-white/40 font-mono">Active Projects</p>
              <p className="text-2xl font-bold font-mono mt-1" style={{ color: '#00F5FF' }}>
                {activeProjects}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-xs text-white/40 font-mono">Completed</p>
              <p className="text-2xl font-bold font-mono mt-1" style={{ color: '#00FF88' }}>
                {completedProjects}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 font-mono">Avg Progress</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {avgProgress}%
                </p>
              </div>
              <StaffProgressRing percent={avgProgress} size={60} />
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                placeholder="Search projects..."
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-sm pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40"
              />
            </div>
            <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 hover:bg-white/[0.06]">
              All Projects
            </button>
            <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 hover:bg-white/[0.06]">
              Active Only
            </button>
          </div>

          {/* Projects grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6">
                {/* Project header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-sm">
                    <FolderKanban className="h-6 w-6" style={{ color: '#00F5FF' }} />
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                    project.status === 'active'
                      ? 'border-[#00F5FF]/30 text-[#00F5FF]'
                      : project.status === 'completed'
                      ? 'border-[#00FF88]/30 text-[#00FF88]'
                      : 'border-white/10 text-white/40'
                  }`}>
                    {project.status}
                  </span>
                </div>

                {/* Client info */}
                <h3 className="text-lg font-mono font-semibold text-white mb-1">
                  {project.name || project.client_users?.name || 'Unnamed Project'}
                </h3>
                <p className="text-sm text-white/40 font-mono mb-4">
                  {project.client_users?.email || project.description || 'No description'}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40 font-mono">Progress</span>
                    <span className="text-xs font-mono font-medium text-white">
                      {project.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${project.progress || 0}%`,
                        backgroundColor: '#00F5FF',
                      }}
                    />
                  </div>
                </div>

                {/* Project metadata */}
                {(project.deadline || project.team_size) && (
                  <div className="flex items-center justify-between text-xs text-white/30 font-mono mb-4">
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
                  <button
                    className="flex-1 bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 hover:bg-white/[0.06]"
                    onClick={() => console.log('View project:', project.id)}
                  >
                    View Details
                  </button>
                  <button
                    className="bg-white/[0.04] border border-white/[0.06] text-white/40 font-mono text-sm rounded-sm px-3 py-1.5 hover:bg-white/[0.06]"
                    onClick={() => console.log('More options:', project.id)}
                  >
                    •••
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {projects.length === 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-12 text-center">
              <FolderKanban className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 font-mono mb-4">
                No projects found. Create your first project to get started.
              </p>
              <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-[#00F5FF]/90 mx-auto">
                <Plus className="h-4 w-4" />
                Create Project
              </button>
            </div>
          )}
        </div>
      </Section>
    </PageContainer>
  );
}
