'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import type { SynthexProject, SynthexProjectRun } from '@/lib/synthex/projectsService';

export default function SynthexProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { user, loading: authLoading } = useAuth();
  const { tenantId, loading: tenantLoading } = useSynthexTenant();

  const [project, setProject] = useState<SynthexProject | null>(null);
  const [latestRun, setLatestRun] = useState<SynthexProjectRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async (): Promise<void> => {
    if (!tenantId) {
return;
}
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/synthex/projects/${projectId}?tenantId=${tenantId}`);
      const json = (await res.json()) as {
        project?: SynthexProject;
        latestRun?: SynthexProjectRun | null;
        error?: string;
      };
      if (!res.ok) {
throw new Error(json.error || 'Failed to load project');
}

      setProject(json.project ?? null);
      setLatestRun(json.latestRun ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !tenantLoading && user && tenantId) {
      fetchDetail();
    }
  }, [authLoading, tenantLoading, user, tenantId, projectId]);

  const prettyArtifact = useMemo(() => {
    if (!latestRun?.artifact_json) {
return '';
}
    try {
      return JSON.stringify(latestRun.artifact_json, null, 2);
    } catch {
      return String(latestRun.artifact_json);
    }
  }, [latestRun]);

  const generateDrafts = async (): Promise<void> => {
    if (!tenantId) {
return;
}
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/synthex/projects/${projectId}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
throw new Error(json.error || 'Failed to generate drafts');
}
      await fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const approve = async (): Promise<void> => {
    if (!tenantId) {
return;
}
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/synthex/projects/${projectId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, approvalType: 'schedule' }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
throw new Error(json.error || 'Approval failed');
}
      await fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || tenantLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-bg-card border-border-subtle">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-error-600">
              <AlertCircle className="h-4 w-4" />
              <span>Sign in required</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-bg-card border-border-subtle">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-warning-600">
              <AlertCircle className="h-4 w-4" />
              <span>Select a tenant in Projects first</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-bg-card border-border-subtle">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-error-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error || 'Project not found'}</span>
            </div>
            <Button onClick={() => router.push('/synthex/projects')} variant="outline">
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canApprove = latestRun?.status === 'awaiting_approval';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950">
      <div className="border-b border-border-subtle bg-bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button asChild variant="ghost" className="text-white">
            <Link href="/synthex/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button onClick={fetchDetail} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Card className="bg-bg-card border-border-subtle">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <CardTitle className="text-white">{project.name}</CardTitle>
                {project.goal && <div className="text-sm text-text-secondary">{project.goal}</div>}
                <div className="flex flex-wrap gap-1">
                  {project.channels.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
              <Badge className="bg-bg-hover text-text-primary">{project.stage.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button onClick={generateDrafts} disabled={busy}>
              {busy ? 'Working…' : 'Generate Draft Pack'}
            </Button>
            <Button onClick={approve} disabled={!canApprove || busy} variant={canApprove ? 'default' : 'outline'}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve & Schedule
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-subtle">
          <CardHeader>
            <CardTitle className="text-white">Latest Run</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestRun ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{latestRun.status}</Badge>
                  {latestRun.artifact_bundle_hash && (
                    <span className="text-xs text-muted-foreground">
                      bundle: {latestRun.artifact_bundle_hash.slice(0, 12)}…
                    </span>
                  )}
                </div>
                <pre className="text-xs whitespace-pre-wrap rounded-md bg-bg-base/30 border border-border-subtle p-4 text-text-primary">
                  {prettyArtifact || 'No artifacts'}
                </pre>
              </>
            ) : (
              <div className="text-sm text-text-secondary">No runs yet. Generate drafts to start.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

