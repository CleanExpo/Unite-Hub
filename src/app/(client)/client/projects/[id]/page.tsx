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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  good: { badge: 'bg-green-600 text-white', label: 'Good' },
  better: { badge: 'bg-blue-600 text-white', label: 'Better' },
  best: { badge: 'bg-purple-600 text-white', label: 'Best' },
};

const statusConfig = {
  active: { bgColor: 'bg-green-500/10', color: 'text-green-400', label: 'Active' },
  on_hold: { bgColor: 'bg-yellow-500/10', color: 'text-yellow-400', label: 'On Hold' },
  completed: { bgColor: 'bg-blue-500/10', color: 'text-blue-400', label: 'Completed' },
  cancelled: { bgColor: 'bg-red-500/10', color: 'text-red-400', label: 'Cancelled' },
};

const priorityConfig = {
  low: { color: 'text-gray-400', label: 'Low' },
  medium: { color: 'text-yellow-400', label: 'Medium' },
  high: { color: 'text-red-400', label: 'High' },
};

const taskStatusConfig = {
  pending: { icon: Circle, color: 'text-gray-400', label: 'Pending' },
  in_progress: { icon: AlertCircle, color: 'text-blue-400', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-green-400', label: 'Completed' },
  blocked: { icon: AlertCircle, color: 'text-red-400', label: 'Blocked' },
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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function calculateProgress() {
    if (!project || project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card variant="glass">
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-red-400">{error || 'Project not found'}</p>
          </div>
        </Card>
        <div className="flex gap-4 mt-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={loadProject} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const tier = tierConfig[project.tier];
  const status = statusConfig[project.status];
  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/client/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">{project.name}</h1>
              <p className="text-gray-400">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={tier.badge}>{tier.label}</Badge>
              <div className={`px-3 py-1 rounded text-sm ${status.bgColor} ${status.color}`}>
                {status.label}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Overall Progress</span>
              <span className="text-sm font-medium text-gray-100">{progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timeline & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-gray-300">{formatDate(project.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <div>
                <p className="text-xs text-gray-500">Est. End Date</p>
                <p className="text-gray-300">{formatDate(project.estimatedEndDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <div>
                <p className="text-xs text-gray-500">Estimated Hours</p>
                <p className="text-gray-300">{project.totalEstimatedHours || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tasks */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Project Tasks</h2>
          <div className="space-y-3">
            {project.tasks.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No tasks assigned yet</p>
            ) : (
              project.tasks.map((task) => {
                const TaskStatusIcon = taskStatusConfig[task.status].icon;
                const taskStatus = taskStatusConfig[task.status];
                const priority = priorityConfig[task.priority];

                return (
                  <div
                    key={task.id}
                    className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <TaskStatusIcon className={`w-4 h-4 ${taskStatus.color}`} />
                          <h3 className="font-semibold text-gray-100">{task.title}</h3>
                        </div>
                        <p className="text-sm text-gray-400">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${priority.color}`}>{priority.label}</span>
                        <span className={`text-xs ${taskStatus.color}`}>{taskStatus.label}</span>
                      </div>
                    </div>

                    {(task.estimatedHours || task.dueDate) && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
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
      </Card>

      {/* Client & Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Info */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Client
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-gray-300">{project.client.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-gray-300">{project.client.email}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Team Info */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assigned Team
            </h2>
            {project.assignedStaff && project.assignedStaff.length > 0 ? (
              <div className="space-y-2">
                {project.assignedStaff.map((staff) => (
                  <div key={staff.userId} className="flex items-center justify-between">
                    <p className="text-gray-300">{staff.userName}</p>
                    <span className="text-xs text-gray-500">{staff.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No team members assigned yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Package</p>
              <p className="text-gray-300">{project.metadata.packageLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-gray-300">{formatDate(project.metadata.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">AI Generated</p>
              <p className="text-gray-300">{project.metadata.aiGenerated ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
