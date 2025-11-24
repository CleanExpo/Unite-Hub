'use client';

/**
 * Scaling Mode Overview
 * Phase 86: Display current mode, capacity, and utilisation
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, Users, Server, TrendingUp } from 'lucide-react';

interface ScalingModeOverviewProps {
  currentMode: string;
  activeClients: number;
  safeCapacity: number;
  utilisationPercent: number;
  recommendation: string;
  className?: string;
}

const modeColors: Record<string, string> = {
  lab: 'bg-purple-500',
  pilot: 'bg-blue-500',
  growth: 'bg-green-500',
  scale: 'bg-orange-500',
};

const modeLabels: Record<string, string> = {
  lab: 'Lab',
  pilot: 'Pilot',
  growth: 'Growth',
  scale: 'Scale',
};

const recommendationColors: Record<string, string> = {
  hold: 'text-blue-500',
  increase_mode: 'text-green-500',
  decrease_mode: 'text-yellow-500',
  freeze: 'text-red-500',
};

const recommendationLabels: Record<string, string> = {
  hold: 'Maintain',
  increase_mode: 'Scale Up',
  decrease_mode: 'Scale Down',
  freeze: 'Freeze',
};

export function ScalingModeOverview({
  currentMode,
  activeClients,
  safeCapacity,
  utilisationPercent,
  recommendation,
  className = '',
}: ScalingModeOverviewProps) {
  const getUtilisationColor = (percent: number) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Scaling Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Mode</span>
          <Badge className={`${modeColors[currentMode] || 'bg-gray-500'}`}>
            {modeLabels[currentMode] || currentMode}
          </Badge>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Capacity
            </span>
            <span className="font-medium">
              {activeClients} / {safeCapacity}
            </span>
          </div>
          <Progress value={utilisationPercent} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Utilisation</span>
            <span className={getUtilisationColor(utilisationPercent)}>
              {utilisationPercent}%
            </span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Recommendation
            </span>
            <span className={`text-sm font-medium ${recommendationColors[recommendation] || ''}`}>
              {recommendationLabels[recommendation] || recommendation}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
