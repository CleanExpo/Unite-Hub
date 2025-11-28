import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { cognitiveService } from '@/lib/cognitiveTwin/cognitiveService';
import { HealthTrendChart } from '@/components/cognitiveTwin/HealthTrendChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, TrendingDown, Lightbulb, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const VALID_DOMAINS = [
  'financial',
  'customer',
  'operational',
  'product',
  'team',
  'technology',
  'market',
  'compliance',
  'brand',
  'strategic',
  'risk',
  'innovation',
  'sustainability',
] as const;

type Domain = (typeof VALID_DOMAINS)[number];

function isDomain(domain: string): domain is Domain {
  return VALID_DOMAINS.includes(domain as Domain);
}

function getHealthColor(score: number): string {
  if (score >= 70) return 'text-green-600 dark:text-green-500';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-500';
  return 'text-red-600 dark:text-red-500';
}

function getHealthStatus(score: number): string {
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'Warning';
  return 'Critical';
}

function DomainHeader({ domain, score }: { domain: string; score: number }) {
  const formattedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{formattedDomain} Domain</h1>
        <p className="text-muted-foreground">Health monitoring and insights</p>
      </div>
      <div className="text-right">
        <div className={`text-4xl font-bold ${getHealthColor(score)}`}>{score.toFixed(1)}%</div>
        <Badge variant={score >= 70 ? 'default' : score >= 40 ? 'secondary' : 'destructive'}>
          {getHealthStatus(score)}
        </Badge>
      </div>
    </div>
  );
}

function RisksList({ risks }: { risks: Array<{ id: string; description: string; severity: string; impact: string }> }) {
  if (risks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No significant risks identified</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Risks ({risks.length})
        </CardTitle>
        <CardDescription>Potential issues requiring attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {risks.map((risk) => (
            <div key={risk.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <AlertTriangle
                className={`h-5 w-5 mt-0.5 ${
                  risk.severity === 'high'
                    ? 'text-red-500'
                    : risk.severity === 'medium'
                    ? 'text-yellow-500'
                    : 'text-blue-500'
                }`}
              />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{risk.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {risk.severity} severity
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {risk.impact} impact
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OpportunitiesList({
  opportunities,
}: {
  opportunities: Array<{ id: string; description: string; priority: string; potentialImpact: string }>;
}) {
  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No opportunities identified yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Opportunities ({opportunities.length})
        </CardTitle>
        <CardDescription>Growth and improvement areas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <Lightbulb className="h-5 w-5 mt-0.5 text-green-500" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{opp.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {opp.priority} priority
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {opp.potentialImpact} impact
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SignalsList({
  signals,
}: {
  signals: Array<{
    id: string;
    type: string;
    content: string;
    confidence: number;
    createdAt: string;
  }>;
}) {
  if (signals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contributing Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No signals collected yet for this domain</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributing Signals ({signals.length})</CardTitle>
        <CardDescription>Data points affecting this domain's health</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signals.slice(0, 10).map((signal) => (
            <div key={signal.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {signal.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(signal.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{signal.content}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <Progress value={signal.confidence * 100} className="w-16 h-2" />
              </div>
            </div>
          ))}
          {signals.length > 10 && (
            <p className="text-xs text-center text-muted-foreground">
              and {signals.length - 10} more signals...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsList({
  recommendations,
}: {
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    estimatedImpact: string;
  }>;
}) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recommendations ({recommendations.length})
        </CardTitle>
        <CardDescription>AI-suggested actions to improve this domain</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-medium">{rec.title}</h4>
                <Badge variant={rec.priority === 'high' ? 'default' : 'secondary'}>
                  {rec.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  Estimated impact: {rec.estimatedImpact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DomainDetailPage({ params }: { params: { domain: string } }) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?redirectTo=/founder/cognitive-twin/domains/${params.domain}`);
  }

  if (!isDomain(params.domain)) {
    notFound();
  }

  const [domainHealth, signals, risks, opportunities, recommendations] = await Promise.all([
    cognitiveService.getDomainHealth(user.id, params.domain),
    cognitiveService.getSignalsByDomain(user.id, params.domain),
    cognitiveService.getRisksByDomain(user.id, params.domain),
    cognitiveService.getOpportunitiesByDomain(user.id, params.domain),
    cognitiveService.getRecommendationsByDomain(user.id, params.domain),
  ]);

  if (!domainHealth) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/founder/cognitive-twin">← Back to Overview</Link>
      </Button>

      <DomainHeader domain={params.domain} score={domainHealth.healthScore} />

      <Card>
        <CardHeader>
          <CardTitle>Health Trend</CardTitle>
          <CardDescription>Performance over time for {params.domain} domain</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
            <HealthTrendChart userId={user.id} domain={params.domain} />
          </Suspense>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <RisksList risks={risks} />
        <OpportunitiesList opportunities={opportunities} />
      </div>

      <RecommendationsList recommendations={recommendations} />

      <SignalsList signals={signals} />
    </div>
  );
}
