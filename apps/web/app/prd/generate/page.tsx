'use client';

import { PRDGeneratorForm } from '@/components/prd-generator-form';
import { PRDGenerationProgress } from '@/components/prd-generation-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, Download, Eye } from 'lucide-react';
import {
  usePRDGenerationWithProgress,
  type PRDGenerationRequest,
} from '@/hooks/use-prd-generation';
import Link from 'next/link';

export default function PRDGeneratePage() {
  const { isGenerating, progress, currentStep, error, result, prdId, generatePRD, reset } =
    usePRDGenerationWithProgress();

  const handleGenerate = async (request: PRDGenerationRequest) => {
    await generatePRD(request);
  };

  // Success state - show results
  if (result && prdId) {
    return (
      <div className="container mx-auto max-w-5xl space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">PRD Generated Successfully!</h1>
            <p className="text-muted-foreground mt-1">
              Your comprehensive Product Requirements Document is ready.
            </p>
          </div>
          <Button variant="outline" onClick={reset}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Generate Another
          </Button>
        </div>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-green-600" />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Generation Complete</h3>
                  <p className="mt-1 text-sm text-green-700">
                    Your PRD includes {result.total_user_stories} user stories,{' '}
                    {result.total_api_endpoints} API endpoints, {result.total_test_scenarios} test
                    scenarios, and a {result.estimated_duration_weeks}-week implementation roadmap
                    with {result.total_sprints} sprints.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border bg-white p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {result.total_user_stories}
                    </div>
                    <div className="text-muted-foreground text-xs">User Stories</div>
                  </div>
                  <div className="rounded-lg border bg-white p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {result.total_api_endpoints}
                    </div>
                    <div className="text-muted-foreground text-xs">API Endpoints</div>
                  </div>
                  <div className="rounded-lg border bg-white p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {result.total_test_scenarios}
                    </div>
                    <div className="text-muted-foreground text-xs">Test Scenarios</div>
                  </div>
                  <div className="rounded-lg border bg-white p-3">
                    <div className="text-2xl font-bold text-green-600">{result.total_sprints}</div>
                    <div className="text-muted-foreground text-xs">Sprints</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href={`/prd/${prdId}`}>
                    <Button size="lg">
                      <Eye className="mr-2 h-4 w-4" />
                      View PRD
                    </Button>
                  </Link>
                  {result.documents_generated && result.documents_generated.length > 0 && (
                    <Button variant="outline" size="lg">
                      <Download className="mr-2 h-4 w-4" />
                      Download Documents ({result.documents_generated.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generating state - show progress
  if (isGenerating) {
    return (
      <div className="container mx-auto max-w-5xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Generating Your PRD</h1>
          <p className="text-muted-foreground mt-1">
            AI is analyzing your requirements using Claude Opus 4.5
          </p>
        </div>

        <PRDGenerationProgress progress={progress} currentStep={currentStep} />

        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Being Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">📄 PRD Document</h4>
                <p className="text-muted-foreground text-sm">
                  Executive summary, problem statement, requirements, constraints
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">📝 User Stories</h4>
                <p className="text-muted-foreground text-sm">
                  Epics, user stories, acceptance criteria, dependencies
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🏗️ Technical Spec</h4>
                <p className="text-muted-foreground text-sm">
                  Architecture, database schema, API endpoints, security
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🧪 Test Plan</h4>
                <p className="text-muted-foreground text-sm">
                  Unit, integration, E2E test scenarios with coverage strategy
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🗺️ Roadmap</h4>
                <p className="text-muted-foreground text-sm">
                  Sprint breakdown, milestones, timeline, risk mitigation
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">📦 Feature List JSON</h4>
                <p className="text-muted-foreground text-sm">
                  Ready for InitializerAgent to start implementation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initial state - show form
  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Generate Product Requirements Document</h1>
        <p className="text-muted-foreground mt-1">
          Transform your idea into comprehensive, production-ready documentation using AI
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PRDGeneratorForm onSubmit={handleGenerate} isGenerating={isGenerating} />

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                1
              </div>
              <h4 className="font-medium">Describe Your Project</h4>
              <p className="text-muted-foreground text-sm">
                Enter your requirements in plain English. The more detail you provide, the better
                the results.
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                2
              </div>
              <h4 className="font-medium">AI Analysis</h4>
              <p className="text-muted-foreground text-sm">
                Claude Opus 4.5 analyzes your requirements and generates comprehensive documentation
                in 1-2 minutes.
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                3
              </div>
              <h4 className="font-medium">Ready to Build</h4>
              <p className="text-muted-foreground text-sm">
                Get user stories, technical specs, test plans, and roadmaps ready for development.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
