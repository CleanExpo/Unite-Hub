/**
 * Linear Project List Component
 *
 * Displays all Linear projects with their status and progress.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';

interface LinearProject {
  id: string;
  name: string;
  description?: string;
  state: string;
  progress: number;
  url: string;
  teams: {
    id: string;
    name: string;
  }[];
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export function LinearProjectList() {
  const [projects, setProjects] = useState<LinearProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/integrations/linear/projects');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to fetch Linear projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'started':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchProjects} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>No projects found in Linear workspace.</p>
          <p className="text-sm mt-2">
            Visit{' '}
            <a
              href="https://linear.app/unite-hub/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Linear.app
            </a>{' '}
            to create projects.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <Badge className={getStateColor(project.state)}>
                  {project.state}
                </Badge>
              </div>

              {project.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div>
                  Progress:{' '}
                  <span className="font-medium text-foreground">
                    {Math.round(project.progress * 100)}%
                  </span>
                </div>

                {project.teams.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span>Teams:</span>
                    {project.teams.slice(0, 3).map((team) => (
                      <Badge key={team.id} variant="outline">
                        {team.name}
                      </Badge>
                    ))}
                    {project.teams.length > 3 && (
                      <span className="text-xs">+{project.teams.length - 3}</span>
                    )}
                  </div>
                )}

                {project.targetDate && (
                  <div>
                    Target:{' '}
                    <span className="font-medium text-foreground">
                      {new Date(project.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${project.progress * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4"
            >
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}
