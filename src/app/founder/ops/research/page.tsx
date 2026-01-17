'use client';

/**
 * Research Fabric Tab
 * Phase D03: Research Fabric v1
 *
 * AI-powered research workflows with project management,
 * query execution, and findings review.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Search,
  Lightbulb,
  Star,
  StarOff,
  Play,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ResearchProject {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  status: string;
  findings_count: number;
  created_at: string;
}

interface ResearchFinding {
  id: string;
  title: string;
  summary: string | null;
  finding_type: string;
  relevance_score: number;
  is_starred: boolean;
  created_at: string;
}

interface ResearchStats {
  totalProjects: number;
  activeProjects: number;
  totalFindings: number;
  starredFindings: number;
  totalKnowledge: number;
}

export default function ResearchFabricPage() {
  const { currentOrganization } = useAuth();
  const tenantId = currentOrganization?.org_id;

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [findings, setFindings] = useState<ResearchFinding[]>([]);
  const [stats, setStats] = useState<ResearchStats | null>(null);
  const [activeTab, setActiveTab] = useState('projects');

  // Quick query state
  const [quickQuery, setQuickQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  // New project dialog
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectObjective, setNewProjectObjective] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const fetchData = async () => {
    if (!tenantId) {
return;
}

    try {
      setLoading(true);

      const [projectsRes, findingsRes, statsRes] = await Promise.all([
        fetch(`/api/research/projects?tenantId=${tenantId}`),
        fetch(`/api/research/findings?tenantId=${tenantId}&limit=20`),
        fetch(`/api/research/stats?tenantId=${tenantId}`),
      ]);

      const projectsData = await projectsRes.json();
      const findingsData = await findingsRes.json();
      const statsData = await statsRes.json();

      setProjects(projectsData.projects || []);
      setFindings(findingsData.findings || []);
      setStats(statsData.stats || null);
    } catch (error) {
      console.error('Error fetching research data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeQuickQuery = async () => {
    if (!tenantId || !quickQuery.trim()) {
return;
}

    try {
      setQueryLoading(true);

      const response = await fetch('/api/research/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          query: quickQuery,
          query_type: 'general',
        }),
      });

      if (response.ok) {
        setQuickQuery('');
        await fetchData(); // Refresh findings
      }
    } catch (error) {
      console.error('Error executing query:', error);
    } finally {
      setQueryLoading(false);
    }
  };

  const createProject = async () => {
    if (!tenantId || !newProjectName.trim()) {
return;
}

    try {
      setCreating(true);

      const response = await fetch('/api/research/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: newProjectName,
          objective: newProjectObjective || undefined,
        }),
      });

      if (response.ok) {
        setShowNewProject(false);
        setNewProjectName('');
        setNewProjectObjective('');
        await fetchData();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const runProject = async (projectId: string) => {
    if (!tenantId) {
return;
}

    try {
      const response = await fetch(
        `/api/research/projects/${projectId}/run?tenantId=${tenantId}`,
        { method: 'POST' }
      );

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error running project:', error);
    }
  };

  const toggleStarFinding = async (findingId: string, currentStarred: boolean) => {
    try {
      const response = await fetch(`/api/research/findings/${findingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !currentStarred }),
      });

      if (response.ok) {
        setFindings(findings.map((f) =>
          f.id === findingId ? { ...f, is_starred: !currentStarred } : f
        ));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success-500">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getFindingTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      insight: 'bg-info-500',
      trend: 'bg-purple-500',
      opportunity: 'bg-success-500',
      threat: 'bg-error-500',
      recommendation: 'bg-warning-500',
    };
    return <Badge className={colors[type] || 'bg-bg-hover0'}>{type}</Badge>;
  };

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Please select an organization to continue.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeProjects || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Findings</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFindings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.starredFindings || 0} starred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKnowledge || 0}</div>
            <p className="text-xs text-muted-foreground">items synthesized</p>
          </CardContent>
        </Card>

        <Card className="border-accent-500/20 bg-accent-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-success-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-500">Ready</div>
            <p className="text-xs text-muted-foreground">Claude Sonnet 4.5</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Research */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Research
          </CardTitle>
          <CardDescription>
            Run a quick AI-powered research query without creating a project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="What do you want to research?"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeQuickQuery()}
              disabled={queryLoading}
            />
            <Button onClick={executeQuickQuery} disabled={queryLoading || !quickQuery.trim()}>
              {queryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Research
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Research Projects</h3>
            <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Research Project</DialogTitle>
                  <DialogDescription>
                    Define a research initiative with specific objectives
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g., Competitor Analysis Q1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-objective">Research Objective</Label>
                    <Textarea
                      id="project-objective"
                      value={newProjectObjective}
                      onChange={(e) => setNewProjectObjective(e.target.value)}
                      placeholder="What do you want to learn from this research?"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewProject(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createProject} disabled={creating || !newProjectName.trim()}>
                    {creating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No research projects yet. Create your first project to get started.
                </p>
                <Button onClick={() => setShowNewProject(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        {project.objective && (
                          <CardDescription className="mt-1">{project.objective}</CardDescription>
                        )}
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {project.findings_count} findings
                      </span>
                      <Button size="sm" onClick={() => runProject(project.id)}>
                        <Play className="mr-2 h-3 w-3" />
                        Run
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          <h3 className="text-lg font-medium">Recent Findings</h3>

          {findings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No findings yet. Run a research query to generate insights.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {findings.map((finding) => (
                <Card key={finding.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{finding.title}</span>
                          {getFindingTypeBadge(finding.finding_type)}
                          <Badge variant="outline" className="text-xs">
                            {Math.round(finding.relevance_score * 100)}% relevant
                          </Badge>
                        </div>
                        {finding.summary && (
                          <p className="text-sm text-muted-foreground">{finding.summary}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStarFinding(finding.id, finding.is_starred)}
                      >
                        {finding.is_starred ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-warning-500" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
