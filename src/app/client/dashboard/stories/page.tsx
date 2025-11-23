'use client';

/**
 * Client Stories Dashboard
 * Phase 74: View personalized stories about journey progress
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Zap,
  Target,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StorySummaryCard, StoryIndicator } from '@/ui/components/StorySummaryCard';
import { MilestoneStoryList, MilestoneSummary } from '@/ui/components/MilestoneStoryRow';
import { StoryExportPanel, StoryExportButtons } from '@/ui/components/StoryExportPanel';
import { CalloutHint, NoDataPlaceholder } from '@/ui/components/CalloutHint';
import {
  generateClientStory,
  generateWeeklySummary,
  generateMonthlySummary,
  getAvailableStoryPeriods,
  getStoryHealth,
  GeneratedStory,
  StoryTimeRange,
} from '@/lib/storytelling/storytellingEngine';

export default function ClientStoriesPage() {
  const router = useRouter();
  const [currentStory, setCurrentStory] = useState<GeneratedStory | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<StoryTimeRange>('last_30_days');
  const [isLoading, setIsLoading] = useState(true);
  const [availablePeriods, setAvailablePeriods] = useState<StoryTimeRange[]>([]);

  useEffect(() => {
    loadStory();
  }, [selectedPeriod]);

  const loadStory = async () => {
    setIsLoading(true);
    try {
      // In production, pass real workspaceId and contactId
      const periods = getAvailableStoryPeriods('ws_demo');
      setAvailablePeriods(periods);

      const story = generateClientStory('ws_demo', 'contact_demo', selectedPeriod);
      setCurrentStory(story);
    } catch (error) {
      console.error('Failed to load story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodLabel = (period: StoryTimeRange) => {
    switch (period) {
      case 'last_7_days':
        return 'Last 7 Days';
      case 'last_30_days':
        return 'Last 30 Days';
      case 'last_90_days':
        return 'Last 90 Days';
      case 'all_time':
        return 'All Time';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const storyHealth = getStoryHealth('ws_demo');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Story</h1>
          <p className="text-muted-foreground">
            See how your journey is progressing over time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/client/dashboard/touchpoints')}>
            <Clock className="h-4 w-4 mr-2" />
            Touchpoints
          </Button>
          <Button variant="outline" onClick={() => router.push('/client/dashboard/alignment')}>
            <Target className="h-4 w-4 mr-2" />
            View Alignment
          </Button>
        </div>
      </div>

      {/* Story health indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Story Completeness</p>
                <p className="text-sm text-muted-foreground">
                  {storyHealth >= 75
                    ? 'Enough data for a complete story'
                    : storyHealth >= 40
                    ? 'Partial data available - story may be limited'
                    : 'Limited data - continue your journey to build your story'}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                storyHealth >= 75
                  ? 'text-green-500 border-green-500/30'
                  : storyHealth >= 40
                  ? 'text-yellow-500 border-yellow-500/30'
                  : 'text-orange-500 border-orange-500/30'
              }
            >
              {storyHealth}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Period selector */}
      <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as StoryTimeRange)}>
        <TabsList>
          {availablePeriods.map((period) => (
            <TabsTrigger key={period} value={period}>
              {getPeriodLabel(period)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Story content */}
        {currentStory ? (
          <div className="mt-6 space-y-6">
            {/* Narrative card */}
            <Card>
              <CardHeader>
                <CardTitle>{currentStory.narrative.title}</CardTitle>
                <CardDescription>{currentStory.narrative.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Executive summary */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentStory.narrative.executive_summary}
                  </p>
                </div>

                {/* Journey context */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    {currentStory.narrative.journey_context}
                  </p>
                </div>

                {/* KPI highlights */}
                {currentStory.narrative.kpi_highlights.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Key Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {currentStory.narrative.kpi_highlights.map((kpi, i) => (
                        <div
                          key={i}
                          className="text-center p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="font-medium text-sm">{kpi.value}</div>
                          <div className="text-xs text-muted-foreground">{kpi.name}</div>
                          <div className="text-[10px] text-muted-foreground">{kpi.trend}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key wins */}
                {currentStory.narrative.key_wins.length > 0 &&
                  currentStory.narrative.key_wins[0] !== 'Journey is progressing - wins will be highlighted as milestones are achieved' && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Key Wins</h3>
                      <ul className="space-y-1">
                        {currentStory.narrative.key_wins.map((win, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Star className="h-3 w-3 text-yellow-500 mt-1 flex-shrink-0" />
                            <span>{win}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Challenges */}
                {currentStory.narrative.challenges.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Areas for Attention</h3>
                    <ul className="space-y-1">
                      {currentStory.narrative.challenges.map((challenge, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Info className="h-3 w-3 mt-1 flex-shrink-0" />
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next steps */}
                {currentStory.narrative.next_steps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Next Steps</h3>
                    <ul className="space-y-2">
                      {currentStory.narrative.next_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {i + 1}
                          </div>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Data notice */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Info className="h-3 w-3" />
                  {currentStory.narrative.data_notice}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            {currentStory.data.milestones.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Milestones</CardTitle>
                    <MilestoneSummary milestones={currentStory.data.milestones} />
                  </div>
                </CardHeader>
                <CardContent>
                  <MilestoneStoryList
                    milestones={currentStory.data.milestones}
                    maxItems={5}
                  />
                </CardContent>
              </Card>
            )}

            {/* Export options */}
            <StoryExportPanel
              narrative={currentStory.narrative}
              videoScript={currentStory.videoScript}
              voiceScript={currentStory.voiceScript}
            />
          </div>
        ) : (
          <div className="mt-6">
            <NoDataPlaceholder
              message="No story data available"
              suggestion="Continue your journey to build your story"
            />
          </div>
        )}
      </Tabs>

      {/* Link to journey */}
      <CalloutHint
        variant="explore"
        title="View Your Full Journey"
        description="See where you are on the 90-day map and what milestones are coming next"
        actionLabel="Open Journey"
        onAction={() => router.push('/client/dashboard/journey')}
      />
    </div>
  );
}
