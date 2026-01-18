'use client';

/**
 * Client Welcome Pack Page
 * Phase 47: Complete onboarding experience for new clients
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnboardingChecklist } from '@/ui/components/OnboardingChecklist';
import { LaunchProgressGraph } from '@/ui/components/LaunchProgressGraph';
import { WelcomePackCard } from '@/ui/components/WelcomePackCard';
import {
  ArrowLeft,
  Download,
  FileText,
  Video,
  BarChart3,
  Image,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface LaunchKit {
  id: string;
  status: 'pending' | 'generating' | 'ready' | 'viewed' | 'completed';
  business_name: string | null;
  business_industry: string | null;
  website_url: string | null;
  welcome_pack_markdown: string | null;
  brand_positioning_report: string | null;
  intro_video_script: string | null;
  visual_inspiration_urls: string[];
  initial_seo_snapshot: any;
  generated_at: string | null;
  viewed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface OnboardingTask {
  id: string;
  task_key: string;
  title: string;
  description: string | null;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority: number;
  estimated_minutes: number;
  icon: string | null;
  action_url: string | null;
  voice_completable: boolean;
}

export default function WelcomePackPage() {
  const { user, currentOrganization } = useAuth();
  const [launchKit, setLaunchKit] = useState<LaunchKit | null>(null);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'checklist'>('overview');

  useEffect(() => {
    async function loadWelcomePack() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/client/welcome-pack?clientId=${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load welcome pack');
        }

        const data = await response.json();
        setLaunchKit(data.kit);
        setTasks(data.tasks || []);

        // Mark as viewed if ready
        if (data.kit?.status === 'ready') {
          await fetch('/api/client/welcome-pack', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kitId: data.kit.id, action: 'view' }),
          });
        }
      } catch (err) {
        console.error('Error loading welcome pack:', err);
        setError(err instanceof Error ? err.message : 'Failed to load welcome pack');
      } finally {
        setLoading(false);
      }
    }

    loadWelcomePack();
  }, [user]);

  const handleTaskClick = (task: OnboardingTask) => {
    if (task.action_url) {
      window.location.href = task.action_url;
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/client/welcome-pack', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          action: 'complete-task',
          clientId: user?.id
        }),
      });

      if (response.ok) {
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, status: 'completed' as const } : t
          )
        );
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const daysActive = launchKit?.created_at
    ? Math.floor((Date.now() - new Date(launchKit.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (!user) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">Please sign in to view your welcome pack.</p>
            </div>
          </div>
        </Section>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your welcome pack...</p>
            </div>
          </div>
        </Section>
      </PageContainer>
    );
  }

  if (error || !launchKit) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <h2 className="text-xl font-semibold mb-2 text-destructive">
                {error || 'Welcome Pack Not Found'}
              </h2>
              <p className="text-muted-foreground mb-4">
                Your welcome pack may still be generating. Please check back shortly.
              </p>
              <Link href="/client/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Section>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/client/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold">Welcome Pack</h1>
              <Badge variant={launchKit.status === 'completed' ? 'default' : 'secondary'}>
                {launchKit.status.charAt(0).toUpperCase() + launchKit.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {launchKit.business_name
                ? `Personalized for ${launchKit.business_name}`
                : 'Your personalized onboarding materials'}
            </p>
          </div>
          {launchKit.status !== 'pending' && launchKit.status !== 'generating' && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          )}
        </div>
      </Section>

      <Section>
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'materials'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Materials
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'checklist'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Checklist
          </button>
        </div>
      </Section>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Graph */}
            <LaunchProgressGraph
              progress={progress}
              tasksCompleted={completedTasks}
              totalTasks={tasks.length}
              daysActive={daysActive}
            />

            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col"
                    onClick={() => setActiveTab('materials')}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    <span>View Materials</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col"
                    onClick={() => setActiveTab('checklist')}
                  >
                    <CheckCircle className="h-6 w-6 mb-2" />
                    <span>Complete Tasks</span>
                  </Button>
                  {launchKit.intro_video_script && (
                    <Button variant="outline" className="h-auto py-4 flex-col">
                      <Video className="h-6 w-6 mb-2" />
                      <span>Video Script</span>
                    </Button>
                  )}
                  {launchKit.initial_seo_snapshot && (
                    <Button variant="outline" className="h-auto py-4 flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span>SEO Snapshot</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Message */}
          {launchKit.welcome_pack_markdown && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent-500" />
                  <CardTitle>Your Personalized Welcome Guide</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: launchKit.welcome_pack_markdown.replace(/\n/g, '<br />')
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </Section>
      )}

      {activeTab === 'materials' && (
        <Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Welcome Pack */}
            {launchKit.welcome_pack_markdown && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-info-500" />
                    <CardTitle className="text-base">Welcome Guide</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your complete 24-hour roadmap and getting started guide.
                  </p>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Brand Report */}
            {launchKit.brand_positioning_report && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-success-500" />
                    <CardTitle className="text-base">Brand Positioning Report</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Initial analysis of your brand positioning and recommendations.
                  </p>
                  <Button size="sm" variant="outline">
                    View Report
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Video Script */}
            {launchKit.intro_video_script && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-accent-500" />
                    <CardTitle className="text-base">Intro Video Script</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    60-90 second introduction script ready for voice generation.
                  </p>
                  <Button size="sm" variant="outline">
                    View Script
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* SEO Snapshot */}
            {launchKit.initial_seo_snapshot && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-warning-500" />
                    <CardTitle className="text-base">SEO Snapshot</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Initial SEO analysis and keyword opportunities.
                  </p>
                  <Button size="sm" variant="outline">
                    View Analysis
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Visual Inspiration */}
            {launchKit.visual_inspiration_urls && launchKit.visual_inspiration_urls.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-accent-400" />
                    <CardTitle className="text-base">Visual Inspiration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Curated visual references for your brand direction.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {launchKit.visual_inspiration_urls.slice(0, 8).map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-muted rounded-lg flex items-center justify-center"
                      >
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Section>
      )}

      {activeTab === 'checklist' && (
        <Section>
          <OnboardingChecklist
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onCompleteTask={handleCompleteTask}
            showProgress={true}
          />
        </Section>
      )}
    </PageContainer>
  );
}
