/**
 * Client Projects List Page
 * Phase 3 Step 7 - Automatic Project Creation
 *
 * Displays all projects for the authenticated client.
 * Shows project status, progress, timeline, and action buttons.
 *
 * Features:
 * - Project cards with tier badges
 * - Progress indicators
 * - Timeline information
 * - Status badges
 * - Click-through to project details
 * - Empty state for no projects
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles, Calendar, Clock, CheckCircle2, XCircle, Pause, ArrowRight, Package, FolderKanban } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  tier: 'good' | 'better' | 'best';
  clientId: string;
  startDate: string;
  estimatedEndDate?: string;
  totalEstimatedHours?: number;
  taskCount: number;
  completedTaskCount: number;
  progress: number;
  createdAt: string;
}

const tierConfig = {
  good: {
    badge: 'bg-green-600 text-white',
    color: 'text-green-600',
    label: 'Good',
  },
  better: {
    badge: 'bg-blue-600 text-white',
    color: 'text-blue-600',
    label: 'Better',
  },
  best: {
    badge: 'bg-purple-600 text-white',
    color: 'text-purple-600',
    label: 'Best',
  },
};

const statusConfig = {
  active: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    label: 'Active',
  },
  on_hold: {
    icon: Pause,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    label: 'On Hold',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    label: 'Completed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    label: 'Cancelled',
  },
};

export default function ClientProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';
  const tierParam = searchParams.get('tier');

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();

    // Show notification for newly created projects
    if (isNew && tierParam) {
      const config = tierConfig[tierParam as keyof typeof tierConfig];
      console.log(`Project created! Your ${config?.label || tierParam} package project has been created.`);
    }
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);

      // Get authenticated user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Please log in to view your projects');
        return;
      }

      // Fetch projects from API
      const response = await fetch('/api/client/projects/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();

      if (data.success) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to load projects');
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getTimeRemaining(estimatedEndDate?: string) {
    if (!estimatedEndDate) return null;

    const now = new Date();
    const end = new Date(estimatedEndDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-yellow-600' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: 'text-yellow-600' };
    } else {
      return { text: `${diffDays} days left`, color: 'text-gray-400' };
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card variant="glass">
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-red-400">{error}</p>
          </div>
        </Card>
        <Button onClick={loadProjects} className="mt-4" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Card>
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-100 mb-2">No Projects Yet</h2>
            <p className="text-gray-400 text-lg mb-6">
              You don't have any projects yet. Submit an idea and choose a proposal package to get started!
            </p>
            <Button onClick={() => router.push('/client/ideas/submit')} size="lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Submit an Idea
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PageContainer>
      <Section>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Projects</h1>
          <p className="text-gray-400 mt-2">
            Manage and track your project progress
          </p>
        </div>
      </Section>

      <Section>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Active Projects</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {projects.filter((p) => p.status === 'active').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">On Hold</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {projects.filter((p) => p.status === 'on_hold').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Avg. Progress</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {Math.round(
                projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
              )}%
            </p>
          </div>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {projects.map((project) => {
          const tier = tierConfig[project.tier];
          const status = statusConfig[project.status];
          const StatusIcon = status.icon;
          const timeRemaining = getTimeRemaining(project.estimatedEndDate);

          return (
            <Card key={project.id}>
              <div className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <FolderKanban className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-100 mb-2">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={tier.badge}>
                          {tier.label}
                        </Badge>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${status.bgColor} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/client/projects/${project.id}`)}
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Description */}
                <p className="text-gray-400 mb-6">{project.description}</p>

                {/* Progress Bar */}
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
                  <p className="text-xs text-gray-500 mt-1">
                    {project.completedTaskCount} of {project.taskCount} tasks completed
                  </p>
                </div>

                {/* Timeline Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Started {formatDate(project.startDate)}</span>
                  </div>
                  {project.estimatedEndDate && timeRemaining && (
                    <div className={`flex items-center gap-2 ${timeRemaining.color}`}>
                      <Clock className="w-4 h-4" />
                      <span>{timeRemaining.text}</span>
                    </div>
                  )}
                  {project.totalEstimatedHours && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{project.totalEstimatedHours} hours estimated</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      </Section>
    </PageContainer>
  );
}
