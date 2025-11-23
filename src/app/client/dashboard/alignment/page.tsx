'use client';

/**
 * Client Alignment Dashboard
 * Phase 73: Simplified narrative with actionable clarity
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Compass,
  Target,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlignmentScoreCard } from '@/ui/components/AlignmentScoreCard';
import { AlignmentOpportunitiesPanel } from '@/ui/components/AlignmentOpportunitiesPanel';
import { AlignmentBlockersPanel } from '@/ui/components/AlignmentBlockersPanel';
import { CalloutHint, NoDataPlaceholder } from '@/ui/components/CalloutHint';
import {
  generateAlignmentReport,
  AlignmentReport,
} from '@/lib/alignment/alignmentEngine';
import {
  generateClientNarrative,
  AlignmentNarrative,
} from '@/lib/alignment/alignmentNarrative';

export default function ClientAlignmentPage() {
  const router = useRouter();
  const [report, setReport] = useState<AlignmentReport | null>(null);
  const [narrative, setNarrative] = useState<AlignmentNarrative | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlignmentData();
  }, []);

  const loadAlignmentData = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from API
      // For now, simulate a client at Day 35
      const alignmentReport = generateAlignmentReport({
        workspaceId: 'ws_demo',
        clientName: 'Your Business',
        journeyDay: 35,
        journeyPhase: 'activation',

        // Momentum
        milestonesCompleted: 6,
        totalMilestones: 12,
        productionJobsCompleted: 4,

        // Clarity
        profileCompleted: true,
        brandKitUploaded: true,
        lastCommunicationDays: 3,

        // Workload
        pendingProduction: 2,
        completedProduction: 4,
        pendingApprovals: 1,

        // Quality
        successScore: 58,
        brandAlignmentScore: 72,
        revisionRate: 0.15,

        // Engagement
        engagementRate: 0.035,
        clientLoginDays: 2,
        feedbackCount: 3,
      });

      setReport(alignmentReport);
      setNarrative(generateClientNarrative(alignmentReport));
    } catch (error) {
      console.error('Failed to load alignment data:', error);
    } finally {
      setIsLoading(false);
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

  if (!report || !narrative) {
    return (
      <div className="p-6">
        <NoDataPlaceholder
          message="Unable to load alignment data"
          suggestion="Please try refreshing the page"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alignment</h1>
          <p className="text-muted-foreground">
            How your journey is progressing across all dimensions
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/client/dashboard/journey')}>
          <Compass className="h-4 w-4 mr-2" />
          View Journey
        </Button>
      </div>

      {/* Narrative summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{narrative.headline}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {narrative.summary}
          </p>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              {narrative.phase_context}
            </p>
          </div>

          {/* Data notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            {narrative.data_notice}
          </div>
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Score card */}
        <div className="lg:col-span-1">
          <AlignmentScoreCard report={report} showDetails={true} />
        </div>

        {/* Right column - Blockers and Opportunities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Blockers first if any critical */}
          {report.blockers.some(b => b.severity === 'critical' || b.severity === 'high') && (
            <AlignmentBlockersPanel blockers={report.blockers} />
          )}

          {/* Opportunities */}
          <AlignmentOpportunitiesPanel opportunities={report.opportunities} />

          {/* Blockers (non-critical) */}
          {!report.blockers.some(b => b.severity === 'critical' || b.severity === 'high') && report.blockers.length > 0 && (
            <AlignmentBlockersPanel blockers={report.blockers} />
          )}
        </div>
      </div>

      {/* Next steps */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Recommended Next Steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {narrative.next_steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recent wins */}
      {report.recent_wins.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <CardTitle className="text-sm">Recent Wins</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {report.recent_wins.map((win) => (
                <Badge key={win.win_id} variant="outline" className="text-green-500 border-green-500/30">
                  {win.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
