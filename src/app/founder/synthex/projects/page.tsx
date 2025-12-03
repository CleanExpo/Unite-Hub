'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createClientLogger } from '@/lib/logger-client';

const logger = createClientLogger({ context: 'ManagedServiceProjects' });

interface ManagedServiceProject {
  id: string;
  project_name: string;
  service_type: string;
  service_tier: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  monthly_hours: number;
  start_date: string;
  client_name: string;
  client_email: string;
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalHoursAllocated: number;
}

export default function ManagedServiceProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ManagedServiceProject[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalHoursAllocated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Not authenticated');
        return;
      }

      // Get user's organization
      const { data: orgData, error: orgError } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single();

      if (orgError || !orgData) {
        setError('No organization found');
        return;
      }

      const tenantId = orgData.organization_id;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('managed_service_projects')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (projectsError) {
        logger.error('Failed to load projects', { error: projectsError });
        setError('Failed to load projects');
        return;
      }

      setProjects(projectsData || []);

      // Calculate stats
      const projectsList = projectsData || [];
      const statsData: ProjectStats = {
        totalProjects: projectsList.length,
        activeProjects: projectsList.filter((p) => p.status === 'active').length,
        completedProjects: projectsList.filter((p) => p.status === 'completed').length,
        totalHoursAllocated: projectsList.reduce((sum, p) => sum + (p.monthly_hours || 0), 0),
      };
      setStats(statsData);
    } catch (err) {
      logger.error('Error loading projects', { error: err });
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'paused':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'completed':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-bg-hover text-text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-text-secondary">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Managed Service Projects</h1>
          <p className="text-text-secondary mt-1">Track and manage all your active service projects</p>
        </div>
        <button
          onClick={() => router.push('/founder/synthex/projects/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Projects</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{stats.totalProjects}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Active Projects</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.activeProjects}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Completed Projects</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.completedProjects}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Hours/Month</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.totalHoursAllocated}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Projects List */}
      <div className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-text-secondary mb-4">No projects yet</p>
            <button
              onClick={() => router.push('/founder/synthex/projects/new')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/founder/synthex/projects/${project.id}`)}
                className="p-4 hover:bg-bg-hover cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {project.project_name}
                      </h3>
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {getStatusIcon(project.status)}
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm text-text-secondary">
                      <div>
                        <p className="text-xs text-text-muted">Client</p>
                        <p className="font-medium text-text-primary">{project.client_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Service Type</p>
                        <p className="font-medium text-text-primary">
                          {project.service_type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Tier</p>
                        <p className="font-medium text-text-primary">
                          {project.service_tier.charAt(0).toUpperCase() + project.service_tier.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Start Date</p>
                        <p className="font-medium text-text-primary flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(project.start_date)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-text-secondary">
                      <p>{project.monthly_hours} hours/month allocated</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-text-muted mb-1">Hours/Month</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{project.monthly_hours}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
