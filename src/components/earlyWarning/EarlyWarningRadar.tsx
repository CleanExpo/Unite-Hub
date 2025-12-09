'use client';

/**
 * Early Warning Radar
 * Phase 82: Radar plot showing cross-engine risk intensities
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radar } from 'lucide-react';
import { SignalJson } from '@/lib/signalMatrix';

interface EarlyWarningRadarProps {
  signalJson: SignalJson;
  className?: string;
}

export function EarlyWarningRadar({
  signalJson,
  className = '',
}: EarlyWarningRadarProps) {
  // Extract scores for radar display
  const categories = [
    { key: 'creative', label: 'Creative', score: signalJson.creative.score },
    { key: 'performance', label: 'Performance', score: signalJson.performance.score },
    { key: 'reality', label: 'Reality', score: signalJson.reality.score },
    { key: 'orm', label: 'ORM', score: signalJson.orm.score },
    { key: 'alignment', label: 'Alignment', score: signalJson.alignment.score },
    { key: 'scaling', label: 'Scaling', score: signalJson.scaling.score },
    { key: 'campaign', label: 'Campaign', score: signalJson.campaign.score },
    { key: 'vif', label: 'VIF', score: signalJson.vif.score },
    { key: 'story', label: 'Story', score: signalJson.story.score },
    { key: 'external', label: 'External', score: signalJson.external.score },
  ];

  // Sort by score descending to show strongest signals first
  const sorted = [...categories].sort((a, b) => b.score - a.score);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Radar className="h-4 w-4" />
          Signal Intensity Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Simple bar representation of radar */}
        <div className="space-y-2">
          {sorted.map(({ key, label, score }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs w-20 truncate">{label}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(score)}`}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
              <Badge variant="outline" className={`text-[10px] w-12 justify-center ${getScoreColor(score)}`}>
                {Math.round(score * 100)}
              </Badge>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Good (70+)
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            Moderate (40-69)
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Low (&lt;40)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getBarColor(score: number): string {
  if (score >= 0.7) {
return 'bg-green-500';
}
  if (score >= 0.4) {
return 'bg-yellow-500';
}
  return 'bg-red-500';
}

function getScoreColor(score: number): string {
  if (score >= 0.7) {
return 'text-green-500';
}
  if (score >= 0.4) {
return 'text-yellow-500';
}
  return 'text-red-500';
}
