'use client';

/**
 * Journey Timeline
 * Phase 72: Visual 90-day journey timeline component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Rocket,
  Layers,
  Zap,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  JourneyPhaseConfig,
  JourneyState,
  JourneyMilestone,
  getMilestoneDisplayName,
  JOURNEY_PHASES,
} from '@/lib/guides/firstClientJourneyConfig';

interface JourneyTimelineProps {
  journeyState: JourneyState;
  showDetails?: boolean;
  className?: string;
}

export function JourneyTimeline({
  journeyState,
  showDetails = true,
  className = '',
}: JourneyTimelineProps) {
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'onboarding':
        return Rocket;
      case 'foundation':
        return Layers;
      case 'activation':
        return Zap;
      case 'optimization':
        return TrendingUp;
      case 'evolution':
        return Sparkles;
      default:
        return Circle;
    }
  };

  const getPhaseStatus = (phase: JourneyPhaseConfig) => {
    const phaseIndex = JOURNEY_PHASES.findIndex(p => p.phase === phase.phase);
    const currentPhaseIndex = JOURNEY_PHASES.findIndex(p => p.phase === journeyState.currentPhase);

    if (phaseIndex < currentPhaseIndex) return 'completed';
    if (phaseIndex === currentPhaseIndex) return 'current';
    return 'upcoming';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">90-Day Journey</CardTitle>
          <Badge variant="outline">
            Day {journeyState.currentDay}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{journeyState.progressPercent}%</span>
          </div>
          <Progress value={journeyState.progressPercent} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Phase timeline */}
        <div className="space-y-3">
          {JOURNEY_PHASES.map((phase, index) => {
            const status = getPhaseStatus(phase);
            const Icon = getPhaseIcon(phase.phase);
            const isLast = index === JOURNEY_PHASES.length - 1;

            return (
              <div key={phase.phase} className="relative">
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${status === 'completed' ? 'bg-green-500 text-white' : ''}
                        ${status === 'current' ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : ''}
                        ${status === 'upcoming' ? 'bg-muted text-muted-foreground' : ''}
                      `}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-8 ${
                          status === 'completed' ? 'bg-green-500' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>

                  {/* Phase content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          status === 'current' ? 'text-primary' : ''
                        }`}
                      >
                        {phase.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Days {phase.dayRange[0]}-{phase.dayRange[1]}
                      </span>
                    </div>

                    {showDetails && status === 'current' && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {phase.description}
                      </p>
                    )}

                    {/* Milestone indicators */}
                    {showDetails && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {phase.milestones.map((milestone) => {
                          const isCompleted = journeyState.completedMilestones.includes(milestone);
                          return (
                            <Badge
                              key={milestone}
                              variant={isCompleted ? 'default' : 'outline'}
                              className={`text-[10px] ${
                                isCompleted ? 'bg-green-500' : ''
                              }`}
                            >
                              {isCompleted && <CheckCircle2 className="h-2 w-2 mr-1" />}
                              {getMilestoneDisplayName(milestone).split(' ').slice(0, 2).join(' ')}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next milestone */}
        {journeyState.nextMilestone && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium">
              <ArrowRight className="h-3 w-3 text-primary" />
              Next Milestone
            </div>
            <p className="text-sm">
              {getMilestoneDisplayName(journeyState.nextMilestone)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact journey indicator for overview pages
 */
export function JourneyIndicator({
  journeyState,
  onClick,
}: {
  journeyState: JourneyState;
  onClick?: () => void;
}) {
  const currentPhase = JOURNEY_PHASES.find(p => p.phase === journeyState.currentPhase);

  return (
    <div
      className={`
        flex items-center gap-3 p-3 bg-muted/50 rounded-lg
        ${onClick ? 'cursor-pointer hover:bg-muted transition-colors' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Day {journeyState.currentDay}</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {currentPhase?.name}
        </span>
        <Badge variant="outline" className="text-xs">
          {journeyState.progressPercent}%
        </Badge>
      </div>
      {onClick && (
        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
      )}
    </div>
  );
}

export default JourneyTimeline;
