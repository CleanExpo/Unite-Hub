'use client';

/**
 * Activation Phase Timeline
 * Phase 59: Visual timeline for 90-day activation
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  Target,
  AlertTriangle,
} from 'lucide-react';

type ActivationPhase = 'trial' | 'phase_1' | 'phase_2' | 'phase_3' | 'graduated';

interface PhaseInfo {
  phase: ActivationPhase;
  name: string;
  days: string;
  goals: string[];
}

interface ActivationPhaseTimelineProps {
  currentPhase: ActivationPhase;
  currentDay: number;
  healthScore: number;
  atRisk: boolean;
}

const PHASES: PhaseInfo[] = [
  {
    phase: 'trial',
    name: '14-Day Trial',
    days: '1-14',
    goals: ['Platform setup', 'First strategy pack', 'Understand timeline'],
  },
  {
    phase: 'phase_1',
    name: 'Foundation',
    days: '15-44',
    goals: ['Build content library', 'Complete training', 'Establish rhythm'],
  },
  {
    phase: 'phase_2',
    name: 'Momentum',
    days: '45-74',
    goals: ['Repurpose content', 'Refine brand voice', 'See early traction'],
  },
  {
    phase: 'phase_3',
    name: 'Transformation',
    days: '75-90',
    goals: ['Self-sufficient', 'Measurable presence', 'Platform mastery'],
  },
];

export function ActivationPhaseTimeline({
  currentPhase,
  currentDay,
  healthScore,
  atRisk,
}: ActivationPhaseTimelineProps) {
  const getPhaseIndex = (phase: ActivationPhase) => {
    if (phase === 'graduated') {
return 4;
}
    return PHASES.findIndex((p) => p.phase === phase);
  };

  const currentIndex = getPhaseIndex(currentPhase);

  const getPhaseStatus = (index: number) => {
    if (index < currentIndex) {
return 'completed';
}
    if (index === currentIndex) {
return 'current';
}
    return 'upcoming';
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) {
return 'text-green-500';
}
    if (score >= 60) {
return 'text-yellow-500';
}
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            90-Day Activation Progress
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={atRisk ? 'destructive' : 'secondary'}>
              Day {currentDay}
            </Badge>
            {atRisk && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">Health Score</span>
          <span className={`text-xl font-bold ${getHealthColor(healthScore)}`}>
            {healthScore}
          </span>
        </div>

        {/* Timeline */}
        <div className="relative">
          {PHASES.map((phase, index) => {
            const status = getPhaseStatus(index);

            return (
              <div key={phase.phase} className="flex gap-3 pb-4 last:pb-0">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`
                    flex items-center justify-center w-6 h-6 rounded-full
                    ${status === 'completed' ? 'bg-green-500' : ''}
                    ${status === 'current' ? 'bg-blue-500' : ''}
                    ${status === 'upcoming' ? 'bg-muted' : ''}
                  `}>
                    {status === 'completed' && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                    {status === 'current' && (
                      <Clock className="h-4 w-4 text-white" />
                    )}
                    {status === 'upcoming' && (
                      <Circle className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  {index < PHASES.length - 1 && (
                    <div className={`w-0.5 flex-1 mt-1 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>

                {/* Phase content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${
                      status === 'current' ? 'text-blue-500' : ''
                    }`}>
                      {phase.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Days {phase.days}
                    </span>
                  </div>

                  {status === 'current' && (
                    <div className="mt-2 space-y-1">
                      {phase.goals.map((goal, i) => (
                        <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                          {goal}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Graduated state */}
        {currentPhase === 'graduated' && (
          <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Activation Complete
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Client has completed the 90-day program
            </p>
          </div>
        )}

        {/* Honest expectation reminder */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Progress based on real engagement metrics. Results vary by effort and consistency.
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivationPhaseTimeline;
