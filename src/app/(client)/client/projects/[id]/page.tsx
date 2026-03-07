/**
 * Client Project Detail Page
 * Phase 3 Step 7 - Automatic Project Creation
 *
 * Displays detailed information about a specific project.
 * Shows tasks, timeline, client info, and assigned staff.
 *
 * Features:
 * - Project overview with tier and status
 * - Task list with status, priority, and dependencies
 * - Timeline with start/end dates
 * - Progress tracking
 * - Client information
 * - Assigned staff members
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Calendar, Clock, User, CheckCircle2, Circle, AlertCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
  order: number;
  dependencies?: string[];
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  tier: 'good' | 'better' | 'best';
  ideaId: string;
  proposalScopeId: string;
  clientId: string;
  organizationId: string;
  startDate: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  totalEstimatedHours?: number;
  tasks: ProjectTask[];
  metadata: {
    createdAt: string;
    createdBy: string;
    packageLabel: string;
    packageSummary: string;
    aiGenerated: boolean;
  };
  client: {
    id: string;
    name: string;
    email: string;
  };
  assignedStaff?: Array<{
    userId: string;
    userName: string;
    role: string;
    assignedAt: string;
  }>;
}

const tierConfig = {
  good: { colour: '#00FF88', label: 'Good' },
  better: { colour: '#00F5FF', label: 'Better' },
  best: { colour: '#FF00FF', label: 'Best' },
};

const statusConfig = {
  active: { bg: 'bg-[#00FF88]/10', colour: 'text-[#00FF88]', borderColour: 'border-[#00FF88]/20', label: 'Active' },
  on_hold: { bg: 'bg-[#FFB800]/10', colour: 'text-[#FFB800]', borderColour: 'border-[#FFB800]/20', label: 'On Hold' },
  completed: { bg: 'bg-[#00F5FF]/10', colour: 'text-[#00F5FF]', borderColour: 'border-[#00F5FF]/20', label: 'Completed' },
  cancelled: { bg: 'bg-[#FF4444]/10', colour: 'text-[#FF4444]', borderColour: 'border-[#FF4444]/20', label: 'Cancelled' },
};

const priorityConfig = {
  low: { colour: 'text-white/40', label: 'Low' },
  medium: { colour: 'text-[#FFB800]', label: 'Medium' },
  high: { colour: 'text-[#FF4444]', label: 'High' },
};

const taskStatusConfig = {
  pending: { icon: Circle, colour: 'text-white/40', label: 'Pending' },
  in_progress: { icon: AlertCircle, colour: 'text-[#00F5FF]', label: 'In Progress' },
  completed: { icon: CheckCircle2, colour: 'text-[#00FF88]', label: 'Completed' },
  blocked: { icon: AlertCircle, colour: 'text-[#FF4444]', label: 'Blocked' },
};

export default function ClientProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Please log in to view project details');
        return;
      }

      const response = await fetch(`/api/client/projects/get?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const data = await response.json();

      if (data.success) {
        setProject(data.project);
      } else {
        setError(data.error || 'Failed to load project');
      }
    } catch (err) {
      console.error('Error loading project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function calculateProgress() {
    if (!project || project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00F5FF]" />
          <p className="text-white/40 font-mono">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 bg-[#050505] min-h-screen">
        <div className="p-6 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-sm">
          <p className="text-[#FF4444] font-mono">{error || 'Project not found'}</p>
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => router.back()}
            className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={loadProject}
            className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tier = tierConfig[project.tier];
  const status = statusConfig[project.status];
  const progress = calculateProgress();

  return (
    <div className="space-y-6 bg-[#050505] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/client/projects')}
            className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold font-mono text-white mb-2">{project.name}</h1>
              <p className="text-white/40 font-mono text-sm">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm border"
                style={{
                  color: tier.colour,
                  borderColor: `${tier.colour}40`,
                  backgroundColor: `${tier.colour}10`,
                }}
              >
                {tier.label}
              </span>
              <div className={`px-3 py-1 rounded-sm text-sm font-mono border ${status.bg} ${status.colour} ${status.borderColour}`}>
                {status.label}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-mono text-white/40">Overall Progress</span>
              <span className="text-sm font-mono font-medium text-white">{progress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-sm h-2">
              <div
                className="bg-[#00F5FF] h-2 rounded-sm transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timeline & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-white/40">
              <Calendar className="w-4 h-4" />
              <div>
                <p className="text-xs text-white/30 font-mono">Start Date</p>
                <p className="text-white/60 font-mono">{formatDate(project.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Calendar className="w-4 h-4" />
              <div>
                <p className="text-xs text-white/30 font-mono">Est. End Date</p>
                <p className="text-white/60 font-mono">{formatDate(project.estimatedEndDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Clock className="w-4 h-4" />
              <div>
                <p className="text-xs text-white/30 font-mono">Estimated Hours</p>
                <p className="text-white/60 font-mono">{project.totalEstimatedHours || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold font-mono text-white mb-4">Project Tasks</h2>
          <div className="space-y-3">
            {project.tasks.length === 0 ? (
              <p className="text-white/40 font-mono text-center py-8">No tasks assigned yet</p>
            ) : (
              project.tasks.map((task) => {
                const TaskStatusIcon = taskStatusConfig[task.status].icon;
                const taskStatus = taskStatusConfig[task.status];
                const priority = priorityConfig[task.priority];

                return (
                  <div
                    key={task.id}
                    className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-sm hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <TaskStatusIcon className={`w-4 h-4 ${taskStatus.colour}`} />
                          <h3 className="font-mono font-semibold text-white">{task.title}</h3>
                        </div>
                        <p className="text-sm font-mono text-white/40">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${priority.colour}`}>{priority.label}</span>
                        <span className={`text-xs font-mono ${taskStatus.colour}`}>{taskStatus.label}</span>
                      </div>
                    </div>

                    {(task.estimatedHours || task.dueDate) && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/30 font-mono">
                        {task.estimatedHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedHours}h
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Client & Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Info */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-6">
            <h2 className="text-xl font-bold font-mono text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Client
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-mono text-white/30">Name</p>
                <p className="text-white/60 font-mono">{project.client.name}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-white/30">Email</p>
                <p className="text-white/60 font-mono">{project.client.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Info */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-6">
            <h2 className="text-xl font-bold font-mono text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assigned Team
            </h2>
            {project.assignedStaff && project.assignedStaff.length > 0 ? (
              <div className="space-y-2">
                {project.assignedStaff.map((staff) => (
                  <div key={staff.userId} className="flex items-center justify-between">
                    <p className="text-white/60 font-mono">{staff.userName}</p>
                    <span className="text-xs font-mono text-white/30">{staff.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 font-mono">No team members assigned yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold font-mono text-white mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-mono text-white/30">Package</p>
              <p className="text-white/60 font-mono">{project.metadata.packageLabel}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-white/30">Created</p>
              <p className="text-white/60 font-mono">{formatDate(project.metadata.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-white/30">AI Generated</p>
              <p className="text-white/60 font-mono">{project.metadata.aiGenerated ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
