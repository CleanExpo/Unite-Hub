'use client';

import { usePRDResult } from '@/hooks/use-prd-generation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Users, Code, TestTube, Map, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Epic, UserStory, DatabaseTable, APIEndpoint, Sprint, Milestone } from '@/types/prd';

export default function PRDViewPage({ params }: { params: { id: string } }) {
  const { result, loading, error } = usePRDResult(params.id);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl space-y-6 py-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'PRD not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { prd_analysis, feature_decomposition, technical_spec, test_plan, roadmap } = result;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/prd/generate">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Product Requirements Document</h1>
          <p className="text-muted-foreground">
            Generated {new Date(result.generated_at).toLocaleString()}
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{result.total_user_stories}</div>
            <div className="text-muted-foreground text-xs">User Stories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{result.total_api_endpoints}</div>
            <div className="text-muted-foreground text-xs">API Endpoints</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{result.total_test_scenarios}</div>
            <div className="text-muted-foreground text-xs">Test Scenarios</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{result.total_sprints}</div>
            <div className="text-muted-foreground text-xs">Sprints</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{result.estimated_duration_weeks}w</div>
            <div className="text-muted-foreground text-xs">Timeline</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="prd" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prd">
            <FileText className="mr-2 h-4 w-4" />
            PRD
          </TabsTrigger>
          <TabsTrigger value="stories">
            <Users className="mr-2 h-4 w-4" />
            User Stories
          </TabsTrigger>
          <TabsTrigger value="tech">
            <Code className="mr-2 h-4 w-4" />
            Tech Spec
          </TabsTrigger>
          <TabsTrigger value="tests">
            <TestTube className="mr-2 h-4 w-4" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="roadmap">
            <Map className="mr-2 h-4 w-4" />
            Roadmap
          </TabsTrigger>
        </TabsList>

        {/* PRD Tab */}
        <TabsContent value="prd" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{prd_analysis.executive_summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Problem Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{prd_analysis.problem_statement}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1">
                {prd_analysis.target_users.map((user: string, i: number) => (
                  <li key={i} className="text-sm">
                    {user}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1">
                {prd_analysis.success_metrics.map((metric: string, i: number) => (
                  <li key={i} className="text-sm">
                    {metric}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Functional Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-inside list-decimal space-y-1">
                {prd_analysis.functional_requirements.map((req: string, i: number) => (
                  <li key={i} className="text-sm">
                    {req}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Stories Tab */}
        <TabsContent value="stories" className="space-y-4">
          {feature_decomposition.epics.map((epic: Epic) => {
            const epicStories = feature_decomposition.user_stories.filter(
              (s: UserStory) => s.epic === epic.id
            );

            return (
              <Card key={epic.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{epic.name}</CardTitle>
                      <CardDescription>{epic.description}</CardDescription>
                    </div>
                    <Badge variant={epic.priority === 'Critical' ? 'destructive' : 'secondary'}>
                      {epic.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {epicStories.map((story: UserStory) => (
                    <div key={story.id} className="border-primary space-y-2 border-l-2 pl-4">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium">{story.title}</h4>
                        <Badge variant="outline">{story.effort_estimate}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm italic">{story.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Acceptance Criteria:</p>
                        <ul className="text-muted-foreground space-y-0.5 text-xs">
                          {story.acceptance_criteria.map((criteria: string, i: number) => (
                            <li key={i}>• {criteria}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tech Spec Tab */}
        <TabsContent value="tech" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Architecture Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{technical_spec.architecture_overview}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Database Schema ({technical_spec.database_schema.length} tables)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {technical_spec.database_schema.slice(0, 5).map((table: DatabaseTable) => (
                <div key={table.name} className="space-y-2">
                  <h4 className="font-mono text-sm font-medium">{table.name}</h4>
                  <p className="text-muted-foreground text-xs">{table.description}</p>
                  <div className="text-xs">
                    {table.columns.length} columns, {table.indexes?.length ?? 0} indexes
                  </div>
                </div>
              ))}
              {technical_spec.database_schema.length > 5 && (
                <p className="text-muted-foreground text-sm">
                  + {technical_spec.database_schema.length - 5} more tables...
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Endpoints ({technical_spec.api_endpoints.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {technical_spec.api_endpoints.slice(0, 10).map((endpoint: APIEndpoint, i: number) => (
                <div key={i} className="flex items-center gap-2 font-mono text-sm">
                  <Badge variant="outline">{endpoint.method}</Badge>
                  <span>{endpoint.path}</span>
                </div>
              ))}
              {technical_spec.api_endpoints.length > 10 && (
                <p className="text-muted-foreground text-sm">
                  + {technical_spec.api_endpoints.length - 10} more endpoints...
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Coverage Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-2xl font-bold">{test_plan.unit_tests.length}</div>
                <div className="text-muted-foreground text-sm">Unit Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{test_plan.integration_tests.length}</div>
                <div className="text-muted-foreground text-sm">Integration Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{test_plan.e2e_tests.length}</div>
                <div className="text-muted-foreground text-sm">E2E Tests</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coverage Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{test_plan.coverage_strategy}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Timeline</CardTitle>
              <CardDescription>
                {roadmap.total_duration_weeks} weeks • {roadmap.sprints.length} sprints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roadmap.sprints.map((sprint: Sprint) => (
                <div
                  key={sprint.sprint_number}
                  className="border-primary space-y-2 border-l-4 pl-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Sprint {sprint.sprint_number}</h4>
                    <Badge variant="outline">{sprint.duration_weeks} weeks</Badge>
                  </div>
                  <p className="text-sm font-medium">{sprint.sprint_goal}</p>
                  <div className="text-muted-foreground text-sm">
                    {sprint.user_stories.length} user stories
                  </div>
                  {sprint.deliverables && sprint.deliverables.length > 0 && (
                    <div className="space-y-0.5 text-xs">
                      <p className="font-medium">Deliverables:</p>
                      <ul className="text-muted-foreground">
                        {sprint.deliverables.slice(0, 3).map((d: string, i: number) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roadmap.milestones.map((milestone: Milestone) => (
                <div key={milestone.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{milestone.name}</h4>
                    <span className="text-muted-foreground text-sm">
                      Sprint {milestone.target_sprint}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{milestone.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
