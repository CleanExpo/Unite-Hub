'use client';

/**
 * Client Success Dashboard Page
 * Phase 48: Client-facing success metrics and insights
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { SuccessScoreCard } from '@/ui/components/SuccessScoreCard';
import { EngagementHeatmap } from '@/ui/components/EngagementHeatmap';
import { WeeklyInsightsCard } from '@/ui/components/WeeklyInsightsCard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SuccessScore {
  id: string;
  overall_score: number;
  engagement_score: number;
  activation_score: number;
  progress_score: number;
  satisfaction_score: number;
  momentum_score: number;
  trend: 'rising' | 'stable' | 'declining';
  score_change: number;
  calculated_at: string;
}

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  status: 'unread' | 'read' | 'dismissed' | 'acted_on';
  created_at: string;
}

interface HeatmapData {
  date: string;
  count: number;
}

export default function ClientSuccessPage() {
  const { user, currentOrganization } = useAuth();
  const [score, setScore] = useState<SuccessScore | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuccessData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/client/success?clientId=${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load success data');
        }

        const data = await response.json();
        setScore(data.score);
        setInsights(data.insights || []);
        setHeatmapData(data.heatmap || []);
      } catch (err) {
        console.error('Error loading success data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadSuccessData();
  }, [user]);

  const handleMarkRead = async (insightId: string) => {
    try {
      await fetch('/api/client/success', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-read',
          insightId,
          clientId: user?.id,
        }),
      });

      setInsights(prev =>
        prev.map(i =>
          i.id === insightId ? { ...i, status: 'read' as const } : i
        )
      );
    } catch (err) {
      console.error('Error marking insight read:', err);
    }
  };

  const handleDismiss = async (insightId: string) => {
    try {
      await fetch('/api/client/success', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dismiss',
          insightId,
          clientId: user?.id,
        }),
      });

      setInsights(prev => prev.filter(i => i.id !== insightId));
    } catch (err) {
      console.error('Error dismissing insight:', err);
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">Please sign in to view your success dashboard.</p>
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
              <p className="text-muted-foreground">Loading your success metrics...</p>
            </div>
          </div>
        </Section>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
              <p className="text-muted-foreground">{error}</p>
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
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/client/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Your Success Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Track your progress and see how you're doing with Unite-Hub
          </p>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Success Score */}
          {score ? (
            <SuccessScoreCard
              overallScore={score.overall_score}
              engagementScore={score.engagement_score}
              activationScore={score.activation_score}
              progressScore={score.progress_score}
              satisfactionScore={score.satisfaction_score}
              momentumScore={score.momentum_score}
              trend={score.trend}
              scoreChange={score.score_change}
              calculatedAt={score.calculated_at}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">
              <p>No success score calculated yet.</p>
              <p className="text-sm mt-1">Use the platform to generate your score!</p>
            </div>
          )}

          {/* Weekly Insights */}
          <WeeklyInsightsCard
            insights={insights}
            onMarkRead={handleMarkRead}
            onDismiss={handleDismiss}
            showAll={false}
          />
        </div>
      </Section>

      <Section>
        {/* Engagement Heatmap */}
        <EngagementHeatmap data={heatmapData} daysToShow={30} />
      </Section>

      <Section>
        {/* Tips for improving score */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Ways to improve your success score</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Log in regularly to stay engaged with your marketing</li>
            <li>• Complete your onboarding tasks to boost activation</li>
            <li>• Generate content and visuals to show progress</li>
            <li>• Review and act on your weekly insights</li>
            <li>• Use voice commands for faster task completion</li>
          </ul>
        </div>
      </Section>
    </PageContainer>
  );
}
