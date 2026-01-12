import { redirect, notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { cognitiveService } from '@/lib/cognitiveTwin/cognitiveService';
import { DigestViewer } from '@/components/cognitiveTwin/DigestViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Download, Calendar, FileText, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

function DigestHeader({ digest }: { digest: any }) {
  const typeColors = {
    daily: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-100',
    weekly: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    monthly: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100',
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            {digest.type.charAt(0).toUpperCase() + digest.type.slice(1)} Digest
          </h1>
          <Badge className={typeColors[digest.type] || typeColors.daily}>
            {digest.type}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(digest.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
}

function ActionItemsTracker({ digest }: { digest: any }) {
  if (!digest.actionItems || digest.actionItems.length === 0) {
    return null;
  }

  const completedCount = digest.actionItems.filter((item: any) => item.completed).length;
  const progress = (completedCount / digest.actionItems.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Action Items</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount} of {digest.actionItems.length} completed
          </span>
        </CardTitle>
        <CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {digest.actionItems.map((item: any, index: number) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 border rounded-lg ${
                item.completed ? 'bg-muted/50' : ''
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-success-500 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {item.priority} priority
                  </Badge>
                  {item.domain && (
                    <Badge variant="outline" className="text-xs">
                      {item.domain}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KeyMetrics({ digest }: { digest: any }) {
  if (!digest.keyMetrics) {
    return null;
  }

  const metrics = [
    {
      label: 'Total Signals',
      value: digest.keyMetrics.totalSignals || 0,
      icon: FileText,
    },
    {
      label: 'Critical Issues',
      value: digest.keyMetrics.criticalIssues || 0,
      icon: Circle,
      color: 'text-error-500',
    },
    {
      label: 'Opportunities',
      value: digest.keyMetrics.opportunities || 0,
      icon: Circle,
      color: 'text-success-500',
    },
    {
      label: 'Avg Health',
      value: digest.keyMetrics.avgHealth ? `${digest.keyMetrics.avgHealth.toFixed(1)}%` : 'N/A',
      icon: Circle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color || 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DigestDetailPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?redirectTo=/founder/cognitive-twin/digests/${params.id}`);
  }

  const digest = await cognitiveService.getDigestById(user.id, params.id);

  if (!digest) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/founder/cognitive-twin/digests">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Digests
        </Link>
      </Button>

      <DigestHeader digest={digest} />

      <KeyMetrics digest={digest} />

      <ActionItemsTracker digest={digest} />

      <Card>
        <CardHeader>
          <CardTitle>Full Digest</CardTitle>
          <CardDescription>Comprehensive analysis and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <DigestViewer digest={digest} />
        </CardContent>
      </Card>
    </div>
  );
}
