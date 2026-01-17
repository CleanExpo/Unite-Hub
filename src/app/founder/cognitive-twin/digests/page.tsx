import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { cognitiveService } from '@/lib/cognitiveTwin/cognitiveService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type DigestType = 'daily' | 'weekly' | 'monthly';

function DigestCard({ digest }: { digest: any }) {
  const typeColors = {
    daily: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-100',
    weekly: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    monthly: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              {digest.type.charAt(0).toUpperCase() + digest.type.slice(1)} Digest
            </CardTitle>
          </div>
          <Badge className={typeColors[digest.type as DigestType] || typeColors.daily}>
            {digest.type}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          {new Date(digest.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{digest.executiveSummary}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-xs text-muted-foreground">
            {digest.keyMetrics && (
              <>
                <span>{digest.keyMetrics.totalSignals || 0} signals</span>
                <span>•</span>
                <span>{digest.keyMetrics.criticalIssues || 0} critical</span>
              </>
            )}
          </div>

          <Button asChild size="sm" variant="ghost">
            <Link href={`/founder/cognitive-twin/digests/${digest.id}`}>
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ type }: { type: DigestType }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No {type} digests yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {type === 'daily'
            ? 'Daily digests are generated automatically each day once signals are collected.'
            : type === 'weekly'
            ? 'Weekly digests provide a comprehensive overview every Monday.'
            : 'Monthly digests offer strategic insights at the end of each month.'}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function DigestsPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?redirectTo=/founder/cognitive-twin/digests');
  }

  const [dailyDigests, weeklyDigests, monthlyDigests] = await Promise.all([
    cognitiveService.getDigestsByType(user.id, 'daily'),
    cognitiveService.getDigestsByType(user.id, 'weekly'),
    cognitiveService.getDigestsByType(user.id, 'monthly'),
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digest History</h1>
          <p className="text-muted-foreground">
            AI-generated summaries of your business health and insights
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/founder/cognitive-twin">← Back to Dashboard</Link>
        </Button>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">
            Daily ({dailyDigests.length})
          </TabsTrigger>
          <TabsTrigger value="weekly">
            Weekly ({weeklyDigests.length})
          </TabsTrigger>
          <TabsTrigger value="monthly">
            Monthly ({monthlyDigests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4 mt-6">
          {dailyDigests.length === 0 ? (
            <EmptyState type="daily" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {dailyDigests.map((digest) => (
                <DigestCard key={digest.id} digest={digest} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-6">
          {weeklyDigests.length === 0 ? (
            <EmptyState type="weekly" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {weeklyDigests.map((digest) => (
                <DigestCard key={digest.id} digest={digest} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4 mt-6">
          {monthlyDigests.length === 0 ? (
            <EmptyState type="monthly" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {monthlyDigests.map((digest) => (
                <DigestCard key={digest.id} digest={digest} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
