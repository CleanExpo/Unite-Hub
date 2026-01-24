'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '@/hooks/useWorkspace';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface Project {
  id: string;
  title: string;
  client_name: string;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  due_date: string | null;
  start_date: string | null;
  created_at: string;
  workspace_id: string | null;
  assignees?: { team_member: { id: string; name: string; avatar_url?: string; role?: string } }[];
}

interface ProjectStats {
  total: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
  completed: number;
  avgProgress: number;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG = {
  'on-track': { label: 'On Track', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'at-risk': { label: 'At Risk', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  'delayed': { label: 'Delayed', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  'completed': { label: 'Completed', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  'on-hold': { label: 'On Hold', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'text-red-600' },
  high: { label: 'High', color: 'text-orange-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  low: { label: 'Low', color: 'text-gray-500' },
};

// ============================================================================
// Hooks
// ============================================================================

function useProjects() {
  const { workspaceId, orgId } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    onTrack: 0,
    atRisk: 0,
    delayed: 0,
    completed: 0,
    avgProgress: 0,
  });

  const fetchProjects = useCallback(async (filters?: { status?: string; priority?: string; search?: string }) => {
    if (!orgId) {
return;
}

    try {
      setLoading(true);
      const url = new URL('/api/projects', window.location.origin);
      url.searchParams.set('orgId', orgId);
      url.searchParams.set('pageSize', '100');

      if (filters?.status) {
url.searchParams.set('status', filters.status);
}
      if (filters?.priority) {
url.searchParams.set('priority', filters.priority);
}
      if (filters?.search) {
url.searchParams.set('title', filters.search);
}

      const res = await fetch(url.toString());
      if (!res.ok) {
throw new Error('Failed to fetch projects');
}

      const json = await res.json();
      const projectList = json.data?.projects || [];
      setProjects(projectList);

      // Calculate stats
      const newStats: ProjectStats = {
        total: projectList.length,
        onTrack: projectList.filter((p: Project) => p.status === 'on-track').length,
        atRisk: projectList.filter((p: Project) => p.status === 'at-risk').length,
        delayed: projectList.filter((p: Project) => p.status === 'delayed').length,
        completed: projectList.filter((p: Project) => p.status === 'completed').length,
        avgProgress: projectList.length > 0
          ? Math.round(projectList.reduce((sum: number, p: Project) => sum + (p.progress || 0), 0) / projectList.length)
          : 0,
      };
      setStats(newStats);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, stats, refetch: fetchProjects };
}

// ============================================================================
// Components
// ============================================================================

function StatCard({
  title,
  value,
  subtitle,
  color = 'text-gray-900',
  icon,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-semibold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG['on-track'];
  const priorityConfig = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;

  const dueDate = project.due_date
    ? new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'No due date';

  const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
          <p className="text-sm text-gray-500">{project.client_name}</p>
        </div>
        <span className={`ml-2 px-2 py-1 text-xs rounded-full flex items-center gap-1 ${statusConfig.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className={`${priorityConfig.color} font-medium`}>
            {priorityConfig.label}
          </span>
          <span className={`${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            {dueDate}
          </span>
        </div>

        {project.assignees && project.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {project.assignees.slice(0, 3).map((a, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                title={a.team_member.name}
              >
                {a.team_member.avatar_url ? (
                  <img src={a.team_member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  a.team_member.name?.slice(0, 2).toUpperCase()
                )}
              </div>
            ))}
            {project.assignees.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                +{project.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
      <p className="text-gray-500 mb-4">Create your first project to get started</p>
      <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
        Create Project
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
          <div className="h-2 bg-gray-100 rounded w-full mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function ProjectsDashboard() {
  const { projects, loading, error, stats, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleFilter = useCallback(() => {
    refetch({
      status: statusFilter || undefined,
      search: searchQuery || undefined,
    });
  }, [refetch, statusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || statusFilter) {
        handleFilter();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, handleFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
              <p className="text-sm text-gray-500">Unified view of all your projects</p>
            </div>
            <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <StatCard title="Total Projects" value={stats.total} />
          <StatCard title="On Track" value={stats.onTrack} color="text-emerald-600" />
          <StatCard title="At Risk" value={stats.atRisk} color="text-amber-600" />
          <StatCard title="Delayed" value={stats.delayed} color="text-red-600" />
          <StatCard title="Completed" value={stats.completed} color="text-blue-600" />
          <StatCard title="Avg Progress" value={`${stats.avgProgress}%`} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="">All Status</option>
              <option value="on-track">On Track</option>
              <option value="at-risk">At Risk</option>
              <option value="delayed">Delayed</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>

            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => refetch()} className="ml-2 underline">Retry</button>
          </div>
        )}

        {/* Projects Grid/List */}
        {loading ? (
          <LoadingSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }>
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
