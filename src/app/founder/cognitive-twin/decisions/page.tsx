import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { cognitiveService } from '@/lib/cognitiveTwin/cognitiveService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Plus, ArrowRight, CheckCircle2, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';

function DecisionCard({ decision }: { decision: any }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    decided: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  };

  const priorityColors = {
    high: 'border-red-500',
    medium: 'border-yellow-500',
    low: 'border-blue-500',
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${priorityColors[decision.priority] || ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{decision.scenario}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {new Date(decision.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={statusColors[decision.status]}>
              {decision.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {decision.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {decision.options && decision.options.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {decision.options.length} option{decision.options.length > 1 ? 's' : ''} analyzed
            </div>
          )}

          {decision.status === 'decided' && decision.selectedOption && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Decided: {decision.selectedOption}
            </div>
          )}

          {decision.status === 'pending' && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
              <Clock className="h-4 w-4" />
              Awaiting decision
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2 text-xs">
              {decision.domains && decision.domains.map((domain: string) => (
                <Badge key={domain} variant="outline" className="text-xs">
                  {domain}
                </Badge>
              ))}
            </div>

            <Button asChild size="sm" variant="ghost">
              <Link href={`/founder/cognitive-twin/decisions/${decision.id}`}>
                {decision.status === 'pending' ? 'Make Decision' : 'View Details'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ status }: { status: 'pending' | 'decided' | 'archived' }) {
  const messages = {
    pending: {
      title: 'No pending decisions',
      description: 'Create a new decision scenario to get AI-powered analysis and recommendations.',
    },
    decided: {
      title: 'No past decisions',
      description: 'Decisions you make will appear here for future reference.',
    },
    archived: {
      title: 'No archived decisions',
      description: 'Archive old decisions to keep your decision log organized.',
    },
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{messages[status].title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {messages[status].description}
        </p>
        {status === 'pending' && (
          <Button asChild>
            <Link href="/founder/cognitive-twin/decisions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Decision
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function DecisionStats({
  pending,
  decided,
  archived,
}: {
  pending: number;
  decided: number;
  archived: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pending}</div>
          <p className="text-xs text-muted-foreground">Awaiting your decision</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Decided</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{decided}</div>
          <p className="text-xs text-muted-foreground">Completed decisions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pending + decided + archived}</div>
          <p className="text-xs text-muted-foreground">All time decisions</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DecisionsPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?redirectTo=/founder/cognitive-twin/decisions');
  }

  const [pendingDecisions, decidedDecisions, archivedDecisions] = await Promise.all([
    cognitiveService.getDecisionsByStatus(user.id, 'pending'),
    cognitiveService.getDecisionsByStatus(user.id, 'decided'),
    cognitiveService.getDecisionsByStatus(user.id, 'archived'),
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Decision Log</h1>
          <p className="text-muted-foreground">
            AI-powered decision analysis and outcome tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/founder/cognitive-twin">← Back to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/founder/cognitive-twin/decisions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Decision
            </Link>
          </Button>
        </div>
      </div>

      <DecisionStats
        pending={pendingDecisions.length}
        decided={decidedDecisions.length}
        archived={archivedDecisions.length}
      />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingDecisions.length})
          </TabsTrigger>
          <TabsTrigger value="decided">
            Decided ({decidedDecisions.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedDecisions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingDecisions.length === 0 ? (
            <EmptyState status="pending" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingDecisions.map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="decided" className="space-y-4 mt-6">
          {decidedDecisions.length === 0 ? (
            <EmptyState status="decided" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {decidedDecisions.map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4 mt-6">
          {archivedDecisions.length === 0 ? (
            <EmptyState status="archived" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {archivedDecisions.map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
