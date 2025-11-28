import { redirect, notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { cognitiveService } from '@/lib/cognitiveTwin/cognitiveService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Calendar, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { RecordOutcomeForm } from '@/components/cognitiveTwin/RecordOutcomeForm';

function DecisionHeader({ decision }: { decision: any }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    decided: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">Decision Scenario</h1>
          <Badge className={statusColors[decision.status]}>
            {decision.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Created {new Date(decision.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <Badge variant="outline">{decision.priority} priority</Badge>
          {decision.domains && decision.domains.length > 0 && (
            <div className="flex gap-1">
              {decision.domains.map((domain: string) => (
                <Badge key={domain} variant="outline" className="text-xs">
                  {domain}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioDetails({ decision }: { decision: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario</CardTitle>
        <CardDescription>The decision context and background</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{decision.scenario}</p>
      </CardContent>
    </Card>
  );
}

function OptionsAnalysis({ decision }: { decision: any }) {
  if (!decision.options || decision.options.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No options defined</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Options Analysis ({decision.options.length})</CardTitle>
        <CardDescription>Available choices and their evaluation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {decision.options.map((option: any, index: number) => (
            <div
              key={index}
              className={`p-4 border rounded-lg space-y-2 ${
                decision.selectedOption === option.name
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-medium flex items-center gap-2">
                  {option.name}
                  {decision.selectedOption === option.name && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </h4>
                {option.score && (
                  <Badge variant="outline">
                    Score: {option.score}/100
                  </Badge>
                )}
              </div>

              {option.description && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}

              {option.pros && option.pros.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-600 dark:text-green-500 mb-1">Pros:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {option.pros.map((pro: string, i: number) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {option.cons && option.cons.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-500 mb-1">Cons:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {option.cons.map((con: string, i: number) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}

              {option.estimatedImpact && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Estimated impact: {option.estimatedImpact}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConstraintsCard({ decision }: { decision: any }) {
  if (!decision.constraints || decision.constraints.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Constraints
        </CardTitle>
        <CardDescription>Limitations and requirements to consider</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {decision.constraints.map((constraint: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground">•</span>
              <span>{constraint}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AIRecommendation({ decision }: { decision: any }) {
  if (!decision.aiAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Analysis pending...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          AI Recommendation
        </CardTitle>
        <CardDescription>Based on your business context and constraints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {decision.aiAnalysis.recommendation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {decision.aiAnalysis.recommendation}
              </p>
            </div>
          )}

          {decision.aiAnalysis.reasoning && (
            <div>
              <h4 className="text-sm font-medium mb-2">Reasoning:</h4>
              <p className="text-sm text-muted-foreground">{decision.aiAnalysis.reasoning}</p>
            </div>
          )}

          {decision.aiAnalysis.risks && decision.aiAnalysis.risks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-red-600 dark:text-red-500">Key Risks:</h4>
              <ul className="space-y-1">
                {decision.aiAnalysis.risks.map((risk: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {decision.aiAnalysis.confidence && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Confidence:</span>
              <Badge variant="outline">
                {(decision.aiAnalysis.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OutcomeDisplay({ decision }: { decision: any }) {
  if (!decision.outcome) {
    return null;
  }

  const successColors = {
    success: 'border-green-500 bg-green-50 dark:bg-green-950',
    partial: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    failure: 'border-red-500 bg-red-50 dark:bg-red-950',
  };

  return (
    <Card className={successColors[decision.outcome.result]}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Outcome Recorded
        </CardTitle>
        <CardDescription>
          Recorded on {new Date(decision.outcome.recordedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-sm font-medium">Result: </span>
          <Badge variant="outline">
            {decision.outcome.result}
          </Badge>
        </div>

        {decision.outcome.actualImpact && (
          <div>
            <p className="text-sm font-medium mb-1">Actual Impact:</p>
            <p className="text-sm text-muted-foreground">{decision.outcome.actualImpact}</p>
          </div>
        )}

        {decision.outcome.lessons && (
          <div>
            <p className="text-sm font-medium mb-1">Lessons Learned:</p>
            <p className="text-sm text-muted-foreground">{decision.outcome.lessons}</p>
          </div>
        )}

        {decision.outcome.notes && (
          <div>
            <p className="text-sm font-medium mb-1">Additional Notes:</p>
            <p className="text-sm text-muted-foreground">{decision.outcome.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DecisionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?redirectTo=/founder/cognitive-twin/decisions/${params.id}`);
  }

  const decision = await cognitiveService.getDecisionById(user.id, params.id);

  if (!decision) {
    notFound();
  }

  const isPending = decision.status === 'pending';
  const hasOutcome = decision.outcome && Object.keys(decision.outcome).length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/founder/cognitive-twin/decisions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Decisions
        </Link>
      </Button>

      <DecisionHeader decision={decision} />

      <ScenarioDetails decision={decision} />

      <OptionsAnalysis decision={decision} />

      <div className="grid gap-6 md:grid-cols-2">
        <ConstraintsCard decision={decision} />
        <AIRecommendation decision={decision} />
      </div>

      {isPending && !hasOutcome && (
        <Card>
          <CardHeader>
            <CardTitle>Record Your Decision</CardTitle>
            <CardDescription>
              Select the option you chose and provide details about the outcome
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecordOutcomeForm
              decisionId={decision.id}
              options={decision.options?.map((opt: any) => opt.name) || []}
            />
          </CardContent>
        </Card>
      )}

      {hasOutcome && <OutcomeDisplay decision={decision} />}
    </div>
  );
}
