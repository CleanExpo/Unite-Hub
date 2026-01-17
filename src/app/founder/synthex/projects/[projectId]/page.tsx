'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createClientLogger } from '@/lib/logger-client';

const logger = createClientLogger({ context: 'ManagedServiceProjectDetail' });

interface ProjectDetail {
  id: string;
  project_name: string;
  service_type: string;
  service_tier: string;
  status: string;
  monthly_hours: number;
  monthly_cost_cents: number;
  start_date: string;
  client_name: string;
  client_email: string;
  client_website?: string;
}

interface Timeline {
  id: string;
  phase_number: number;
  phase_name: string;
  start_date: string;
  planned_end_date: string;
  actual_end_date?: string;
  status: string;
  completion_percentage: number;
  description: string;
}

interface Task {
  id: string;
  task_name: string;
  task_type: string;
  status: string;
  priority: string;
  due_date: string;
  description: string;
}

interface Report {
  id: string;
  report_number: number;
  report_type: string;
  period_start_date: string;
  period_end_date: string;
  status: string;
  created_at: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'tasks' | 'reports'>('overview');

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  async function loadProjectData() {
    try {
      setLoading(true);
      setError(null);

      // Verify user owns this project
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

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('managed_service_projects')
        .select('*')
        .eq('id', projectId)
        .eq('tenant_id', tenantId)
        .single();

      if (projectError || !projectData) {
        logger.error('Failed to load project', { error: projectError });
        setError('Project not found');
        return;
      }

      setProject(projectData);

      // Fetch timelines
      const { data: timelineData, error: timelineError } = await supabase
        .from('managed_service_timelines')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_number', { ascending: true });

      if (!timelineError) {
        setTimelines(timelineData || []);
      }

      // Fetch tasks
      const { data: taskData, error: taskError } = await supabase
        .from('managed_service_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });

      if (!taskError) {
        setTasks(taskData || []);
      }

      // Fetch reports
      const { data: reportData, error: reportError } = await supabase
        .from('managed_service_reports')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!reportError) {
        setReports(reportData || []);
      }
    } catch (err) {
      logger.error('Error loading project data', { error: err });
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300';
      case 'pending':
        return 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300';
      case 'paused':
        return 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300';
      case 'completed':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'in_progress':
        return 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300';
      default:
        return 'bg-bg-hover text-text-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-text-secondary">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-info-600 dark:text-info-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
          <p className="text-sm text-error-700 dark:text-error-300">{error || 'Project not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{project.project_name}</h1>
            <p className="text-text-secondary mt-1">{project.client_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProjectData}
            className="flex items-center gap-2 px-4 py-2 text-text-secondary bg-bg-hover rounded-lg hover:bg-bg-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-info-600 hover:bg-info-700 text-white rounded-lg font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            Send Report
          </button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <p className="text-sm text-text-secondary">Status</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded mt-2 text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status === 'active' && <CheckCircle className="w-3 h-3" />}
            {project.status !== 'active' && <AlertCircle className="w-3 h-3" />}
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </div>
        </div>

        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <p className="text-sm text-text-secondary">Service Tier</p>
          <p className="text-lg font-semibold text-text-primary mt-2">
            {project.service_tier.charAt(0).toUpperCase() + project.service_tier.slice(1)}
          </p>
        </div>

        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <p className="text-sm text-text-secondary">Monthly Hours</p>
          <p className="text-lg font-semibold text-text-primary mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {project.monthly_hours}h
          </p>
        </div>

        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <p className="text-sm text-text-secondary">Monthly Cost</p>
          <p className="text-lg font-semibold text-text-primary mt-2">
            {formatCurrency(project.monthly_cost_cents)}
          </p>
        </div>

        <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
          <p className="text-sm text-text-secondary">Start Date</p>
          <p className="text-lg font-semibold text-text-primary mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(project.start_date)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-bg-card rounded-lg border border-border-subtle">
        <div className="flex border-b border-border-subtle">
          {(['overview', 'timeline', 'tasks', 'reports'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-info-600 text-info-600 dark:text-info-400'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Project Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Service Type</p>
                    <p className="font-medium text-text-primary mt-1">
                      {project.service_type.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Client Email</p>
                    <p className="font-medium text-text-primary mt-1">{project.client_email}</p>
                  </div>
                  {project.client_website && (
                    <div>
                      <p className="text-text-secondary">Website</p>
                      <p className="font-medium text-text-primary mt-1">
                        <a
                          href={project.client_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-info-600 dark:text-info-400 hover:underline"
                        >
                          {project.client_website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Quick Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Total Timelines</p>
                    <p className="text-2xl font-bold text-text-primary">{timelines.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Pending Tasks</p>
                    <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                      {tasks.filter((t) => t.status === 'pending').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">In Progress</p>
                    <p className="text-2xl font-bold text-info-600 dark:text-info-400">
                      {tasks.filter((t) => t.status === 'in_progress').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Reports Generated</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{reports.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {timelines.length === 0 ? (
                <p className="text-text-secondary">No timelines yet</p>
              ) : (
                timelines.map((timeline, index) => (
                  <div key={timeline.id} className="border border-border-subtle rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-text-primary">
                          Phase {timeline.phase_number}: {timeline.phase_name}
                        </h4>
                        <p className="text-sm text-text-secondary mt-1">{timeline.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(timeline.status)}`}>
                        {timeline.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-text-secondary">Start Date</p>
                        <p className="font-medium text-text-primary">{formatDate(timeline.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Planned End</p>
                        <p className="font-medium text-text-primary">
                          {formatDate(timeline.planned_end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Progress</p>
                        <p className="font-medium text-text-primary">{timeline.completion_percentage}%</p>
                      </div>
                    </div>

                    <div className="w-full bg-bg-hover rounded-full h-2">
                      <div
                        className="bg-info-600 h-2 rounded-full transition-all"
                        style={{ width: `${timeline.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-text-secondary">No tasks yet</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="border border-border-subtle rounded-lg p-4 hover:bg-bg-hover">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-text-primary">{task.task_name}</h4>
                        <p className="text-sm text-text-secondary mt-1">{task.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                          <span className="bg-bg-hover px-2 py-1 rounded">
                            {task.task_type.replace(/_/g, ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <p className="text-xs text-text-secondary mt-2">
                          {task.priority.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-text-secondary">No reports yet</p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="border border-border-subtle rounded-lg p-4 hover:bg-bg-hover cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-text-primary">
                          {report.report_type === 'weekly' ? 'Weekly' : report.report_type === 'monthly' ? 'Monthly' : 'Milestone'} Report #{report.report_number}
                        </h4>
                        <p className="text-sm text-text-secondary mt-1">
                          {formatDate(report.period_start_date)} - {formatDate(report.period_end_date)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
