import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { cognitiveService } from '@/lib/cognitiveTwin/cognitiveService';
import { DomainHealthGrid } from '@/components/cognitiveTwin/DomainHealthGrid';
import { HealthTrendChart } from '@/components/cognitiveTwin/HealthTrendChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Brain, TrendingUp, FileText, Target } from 'lucide-react';
import Link from 'next/link';

async function getCognitiveTwinData(userId: string) {
  const [portfolio, recentDigest, pendingDecisions] = await Promise.all([
    cognitiveService.getPortfolioHealth(userId),
    cognitiveService.getLatestDigest(userId),
    cognitiveService.getPendingDecisions(userId),
  ]);

  return { portfolio, recentDigest, pendingDecisions };
}

function PortfolioSummary({ portfolio }: { portfolio: Awaited<ReturnType<typeof cognitiveService.getPortfolioHealth>> }) {
  const criticalCount = portfolio.domains.filter((d) => d.healthScore < 40).length;
  const warningCount = portfolio.domains.filter((d) => d.healthScore >= 40 && d.healthScore < 70).length;
  const healthyCount = portfolio.domains.filter((d) => d.healthScore >= 70).length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Health</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{portfolio.avgHealth.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Across 13 domains</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
          <p className="text-xs text-muted-foreground">Needs attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warning</CardTitle>
          <TrendingUp className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{warningCount}</div>
          <p className="text-xs text-muted-foreground">Monitor closely</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Healthy</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-500">{healthyCount}</div>
          <p className="text-xs text-muted-foreground">Performing well</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PendingDecisionsAlert({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
          <AlertCircle className="h-5 w-5" />
          {count} Pending Decision{count > 1 ? 's' : ''}
        </CardTitle>
        <CardDescription className="text-yellow-800 dark:text-yellow-200">
          You have decisions awaiting your input
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/founder/cognitive-twin/decisions">
            <Target className="mr-2 h-4 w-4" />
            View Decisions
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentDigestPreview({ digest }: { digest: any }) {
  if (!digest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Digest</CardTitle>
          <CardDescription>No digests available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Digests will appear here once signals are collected and analyzed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Digest
          </span>
          <Badge variant="outline">{digest.type}</Badge>
        </CardTitle>
        <CardDescription>
          {new Date(digest.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground line-clamp-3">{digest.executiveSummary}</p>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/founder/cognitive-twin/digests/${digest.id}`}>View Full Digest</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/founder/cognitive-twin/digests">All Digests</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button asChild variant="outline" className="justify-start">
          <Link href="/founder/cognitive-twin/decisions/new">
            <Target className="mr-2 h-4 w-4" />
            Simulate Decision
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/founder/cognitive-twin/digests">
            <FileText className="mr-2 h-4 w-4" />
            View All Digests
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/founder/cognitive-twin/decisions">
            <AlertCircle className="mr-2 h-4 w-4" />
            Manage Decisions
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function CognitiveTwinPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?redirectTo=/founder/cognitive-twin');
  }

  const { portfolio, recentDigest, pendingDecisions } = await getCognitiveTwinData(user.id);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cognitive Twin</h1>
          <p className="text-muted-foreground">
            AI-powered business health monitoring and decision support
          </p>
        </div>
      </div>

      <PortfolioSummary portfolio={portfolio} />

      <PendingDecisionsAlert count={pendingDecisions.length} />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Domain Health</CardTitle>
              <CardDescription>Health scores across all 13 business domains</CardDescription>
            </CardHeader>
            <CardContent>
              <DomainHealthGrid domains={portfolio.domains} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <RecentDigestPreview digest={recentDigest} />
          <QuickActions />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Health Trend</CardTitle>
          <CardDescription>Average health score over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
            <HealthTrendChart userId={user.id} domain="overall" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
