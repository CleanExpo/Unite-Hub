'use client';

/**
 * Client Journey Dashboard
 * Phase 72: Simplified 90-day timeline view for clients
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Target,
  Lightbulb,
  BookOpen,
  PlayCircle,
} from 'lucide-react';
import { JourneyTimeline } from '@/ui/components/JourneyTimeline';
import { CalloutHint, DemoBanner, NoDataPlaceholder } from '@/ui/components/CalloutHint';
import { GuidedTourStepper, useGuidedTour } from '@/ui/components/GuidedTourStepper';
import {
  calculateJourneyState,
  getPhaseConfig,
  getMilestoneDisplayName,
  getNextStepDescription,
  JOURNEY_PHASES,
  JourneyState,
} from '@/lib/guides/firstClientJourneyConfig';
import { CLIENT_GUIDED_TOUR } from '@/lib/guides/roleGuidedTourConfig';
import { getDemoClientData, isDemoModeEnabled } from '@/lib/guides/demoClientScenario';

export default function ClientJourneyPage() {
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const tour = useGuidedTour(CLIENT_GUIDED_TOUR);

  useEffect(() => {
    loadJourneyData();
  }, []);

  const loadJourneyData = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from API based on workspace
      // For now, use demo or calculate from available data
      const featureFlags = { demo_mode: false }; // Would come from settings

      if (isDemoModeEnabled(featureFlags)) {
        setIsDemoMode(true);
        const demoData = getDemoClientData();
        setJourneyState(calculateJourneyState({
          createdAt: new Date(Date.now() - demoData.dayInJourney * 24 * 60 * 60 * 1000).toISOString(),
          profileCompleted: true,
          brandKitUploaded: true,
          vifGenerated: true,
          productionJobs: 5,
          contentDelivered: 12,
          performanceReports: 3,
          reactiveEngineActive: true,
          optimizationCycles: 2,
          successScore: 72,
        }));
      } else {
        // Simulate a client at day 15 for demonstration
        setJourneyState(calculateJourneyState({
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          profileCompleted: true,
          brandKitUploaded: true,
          vifGenerated: true,
          productionJobs: 1,
        }));
      }
    } catch (error) {
      console.error('Failed to load journey data:', error);
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

  if (!journeyState) {
    return (
      <div className="p-6">
        <NoDataPlaceholder
          message="Unable to load journey data"
          suggestion="Please try refreshing the page"
        />
      </div>
    );
  }

  const currentPhase = getPhaseConfig(journeyState.currentPhase);

  return (
    <div className="p-6 space-y-6">
      {/* Demo mode banner */}
      {isDemoMode && <DemoBanner onExit={() => setIsDemoMode(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Journey</h1>
          <p className="text-muted-foreground">
            Track your progress through the 90-day onboarding and activation process
          </p>
        </div>
        <Button variant="outline" onClick={tour.startTour}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Start Tour
        </Button>
      </div>

      {/* Current status card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Phase: {currentPhase.name}</CardTitle>
              <CardDescription>
                Day {journeyState.currentDay} of 90
              </CardDescription>
            </div>
            <Badge className="text-lg px-3 py-1">
              {journeyState.progressPercent}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {currentPhase.description}
          </p>

          {/* Current phase capabilities */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Capabilities</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentPhase.capabilities.map((capability, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {capability}
                </li>
              ))}
            </ul>
          </div>

          {/* Linked features */}
          <div className="flex flex-wrap gap-2">
            {currentPhase.linkedFeatures.map((feature) => (
              <Badge key={feature} variant="outline">
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="next">What's Next</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <JourneyTimeline journeyState={journeyState} showDetails={true} />
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Completed Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {journeyState.completedMilestones.map((milestone) => (
                <div
                  key={milestone}
                  className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {getMilestoneDisplayName(milestone)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Upcoming milestones */}
              {JOURNEY_PHASES.flatMap(p => p.milestones)
                .filter(m => !journeyState.completedMilestones.includes(m))
                .slice(0, 3)
                .map((milestone) => (
                  <div
                    key={milestone}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Circle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {getMilestoneDisplayName(milestone)}
                      </p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="next">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {journeyState.nextMilestone ? (
                <>
                  <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {getMilestoneDisplayName(journeyState.nextMilestone)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getNextStepDescription(journeyState.nextMilestone)}
                      </p>
                    </div>
                  </div>

                  <CalloutHint
                    variant="tip"
                    title="Helpful Information"
                    description="Progress is tracked based on actual completed actions, not time elapsed. Take your time to ensure each step is done correctly."
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="font-medium">Journey Complete</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {getNextStepDescription(null)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help section */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Need help understanding the process?</p>
                <p className="text-xs text-muted-foreground">
                  Take the guided tour or reach out to your team
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={tour.startTour}>
              Take Tour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guided tour overlay */}
      {tour.isActive && (
        <GuidedTourStepper
          tour={CLIENT_GUIDED_TOUR}
          currentStepIndex={tour.currentStepIndex}
          onNext={tour.nextStep}
          onBack={tour.prevStep}
          onSkip={tour.skipTour}
          onComplete={tour.completeTour}
        />
      )}
    </div>
  );
}
