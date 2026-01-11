'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Plus, AlertCircle, Sparkles, FileText, CalendarClock } from 'lucide-react';
import type { SynthexProject, SynthexProjectStage } from '@/lib/synthex/projectsService';

const STAGE_COLUMNS: Array<{ stage: SynthexProjectStage; label: string }> = [
  { stage: 'brief', label: 'Brief' },
  { stage: 'strategy', label: 'Strategy' },
  { stage: 'production', label: 'Production' },
  { stage: 'client_review', label: 'Client Review' },
  { stage: 'scheduled', label: 'Scheduled' },
  { stage: 'live', label: 'Live' },
  { stage: 'optimize', label: 'Optimize' },
];

export function SynthexProjectsBoard({ tenantId }: { tenantId: string }) {
  const [projects, setProjects] = useState<SynthexProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const fetchProjects = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/synthex/projects?tenantId=${tenantId}`);
      const json = (await res.json()) as { projects?: SynthexProject[]; error?: string };

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load projects');
      }

      setProjects(json.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [tenantId]);

  const grouped = useMemo(() => {
    const byStage: Record<SynthexProjectStage, SynthexProject[]> = {
      brief: [],
      strategy: [],
      production: [],
      client_review: [],
      scheduled: [],
      live: [],
      optimize: [],
      archived: [],
    };

    for (const project of projects) {
      byStage[project.stage]?.push(project);
    }

    return byStage;
  }, [projects]);

  const handleCreateProject = async (): Promise<void> => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/synthex/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: newName.trim(),
          goal: newGoal.trim() || null,
          channels: ['email', 'social'],
        }),
      });

      const json = (await res.json()) as { project?: SynthexProject; error?: string };
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create project');
      }

      setNewName('');
      setNewGoal('');
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-bg-card border-border-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-500" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-bg-card border-border-subtle">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-500" />
            Projects
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name (e.g., January Lead Nurture)"
            />
            <Input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Goal (optional)"
            />
            <Button onClick={handleCreateProject} disabled={creating || !newName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {creating ? 'Creating…' : 'New Project'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {STAGE_COLUMNS.map((col) => (
          <Card key={col.stage} className="bg-bg-card border-border-subtle flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{col.label}</CardTitle>
                <Badge variant="outline">{grouped[col.stage]?.length ?? 0}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              {(grouped[col.stage] ?? []).map((project) => (
                <ProjectCard key={project.id} tenantId={tenantId} project={project} onChanged={fetchProjects} />
              ))}
              {(grouped[col.stage]?.length ?? 0) === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">No items</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProjectCard(props: {
  tenantId: string;
  project: SynthexProject;
  onChanged: () => Promise<void>;
}) {
  const { tenantId, project, onChanged } = props;
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const canGenerateDrafts = ['brief', 'strategy', 'production', 'optimize'].includes(project.stage);
  const needsApproval = project.stage === 'client_review';

  const generateDrafts = async (): Promise<void> => {
    setBusy(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/synthex/projects/${project.id}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Failed to generate drafts');
      await onChanged();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border-subtle hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-sm leading-tight line-clamp-2">{project.name}</div>
          {needsApproval ? (
            <Badge className="bg-yellow-600 text-white">Needs approval</Badge>
          ) : (
            <Badge variant="secondary">{project.stage.replace('_', ' ')}</Badge>
          )}
        </div>

        {project.goal && <div className="text-xs text-muted-foreground line-clamp-2">{project.goal}</div>}

        <div className="flex flex-wrap gap-1">
          {(project.channels ?? []).slice(0, 3).map((c) => (
            <Badge key={c} variant="outline" className="text-xs">
              {c}
            </Badge>
          ))}
        </div>

        {localError && <div className="text-xs text-red-600">{localError}</div>}

        <div className="flex items-center gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="h-7 px-2">
            <Link href={`/synthex/projects/${project.id}`}>
              <FileText className="h-3 w-3 mr-1" />
              Review
            </Link>
          </Button>

          {canGenerateDrafts && (
            <Button onClick={generateDrafts} size="sm" className="h-7 px-2" disabled={busy}>
              <CalendarClock className="h-3 w-3 mr-1" />
              {busy ? 'Working…' : 'Generate'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

