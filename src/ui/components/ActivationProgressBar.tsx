'use client';

/**
 * Activation Progress Bar Component
 * Phase 53: Visual progress indicator for 90-day activation
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp } from 'lucide-react';

interface ActivationProgressBarProps {
  currentDay: number;
  totalDays?: number;
  phase1Progress: number;
  phase2Progress: number;
  phase3Progress: number;
  overallProgress: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

export function ActivationProgressBar({
  currentDay,
  totalDays = 90,
  phase1Progress,
  phase2Progress,
  phase3Progress,
  overallProgress,
  status,
}: ActivationProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getPhaseFromDay = (day: number) => {
    if (day <= 14) return 1;
    if (day <= 45) return 2;
    return 3;
  };

  const currentPhase = getPhaseFromDay(currentDay);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            90-Day Activation Progress
          </CardTitle>
          <Badge className={getStatusColor()}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Day counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Day <span className="font-bold">{currentDay}</span> of {totalDays}
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{overallProgress}%</span>
            <span className="text-sm text-muted-foreground ml-1">complete</span>
          </div>
        </div>

        {/* Main progress bar with phase markers */}
        <div className="relative">
          {/* Background track */}
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            {/* Phase 1 segment (days 1-14 = ~15.5%) */}
            <div
              className="absolute h-full bg-blue-200 dark:bg-blue-900"
              style={{ left: 0, width: '15.5%' }}
            />
            <div
              className="absolute h-full bg-blue-500"
              style={{ left: 0, width: `${(phase1Progress / 100) * 15.5}%` }}
            />

            {/* Phase 2 segment (days 15-45 = ~34.4%) */}
            <div
              className="absolute h-full bg-green-200 dark:bg-green-900"
              style={{ left: '15.5%', width: '34.4%' }}
            />
            <div
              className="absolute h-full bg-green-500"
              style={{ left: '15.5%', width: `${(phase2Progress / 100) * 34.4}%` }}
            />

            {/* Phase 3 segment (days 46-90 = ~50.1%) */}
            <div
              className="absolute h-full bg-purple-200 dark:bg-purple-900"
              style={{ left: '49.9%', width: '50.1%' }}
            />
            <div
              className="absolute h-full bg-purple-500"
              style={{ left: '49.9%', width: `${(phase3Progress / 100) * 50.1}%` }}
            />
          </div>

          {/* Current day marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary"
            style={{ left: `${(currentDay / totalDays) * 100}%` }}
          >
            <div className="absolute -top-6 -translate-x-1/2 text-xs font-medium">
              Today
            </div>
          </div>

          {/* Phase markers */}
          <div
            className="absolute top-5 w-0.5 h-2 bg-muted-foreground"
            style={{ left: '15.5%' }}
          />
          <div
            className="absolute top-5 w-0.5 h-2 bg-muted-foreground"
            style={{ left: '49.9%' }}
          />
        </div>

        {/* Phase labels */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`text-center ${currentPhase === 1 ? 'font-bold' : ''}`}>
            <div className="text-xs text-muted-foreground">Phase 1</div>
            <div className="text-sm">Foundation</div>
            <div className="text-xs text-blue-500">{phase1Progress}%</div>
          </div>
          <div className={`text-center ${currentPhase === 2 ? 'font-bold' : ''}`}>
            <div className="text-xs text-muted-foreground">Phase 2</div>
            <div className="text-sm">Implementation</div>
            <div className="text-xs text-green-500">{phase2Progress}%</div>
          </div>
          <div className={`text-center ${currentPhase === 3 ? 'font-bold' : ''}`}>
            <div className="text-xs text-muted-foreground">Phase 3</div>
            <div className="text-sm">Momentum</div>
            <div className="text-xs text-purple-500">{phase3Progress}%</div>
          </div>
        </div>

        {/* Honest expectations reminder */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Real marketing results take consistent effort over 90+ days
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivationProgressBar;
