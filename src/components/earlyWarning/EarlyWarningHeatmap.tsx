'use client';

/**
 * Early Warning Heatmap
 * Phase 82: Heatmap of signal strengths across categories
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Grid3X3 } from 'lucide-react';
import { SignalJson, SignalCategory } from '@/lib/signalMatrix';

interface EarlyWarningHeatmapProps {
  signalJson: SignalJson;
  className?: string;
}

export function EarlyWarningHeatmap({
  signalJson,
  className = '',
}: EarlyWarningHeatmapProps) {
  const categories: { key: keyof Omit<SignalJson, 'errors'>; label: string }[] = [
    { key: 'creative', label: 'Creative' },
    { key: 'performance', label: 'Performance' },
    { key: 'reality', label: 'Reality' },
    { key: 'orm', label: 'ORM' },
    { key: 'alignment', label: 'Alignment' },
    { key: 'scaling', label: 'Scaling' },
    { key: 'campaign', label: 'Campaign' },
    { key: 'vif', label: 'VIF' },
    { key: 'story', label: 'Story' },
    { key: 'external', label: 'External' },
  ];

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Signal Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {categories.map(({ key, label }) => {
              const category = signalJson[key] as SignalCategory;
              return (
                <HeatmapCell
                  key={key}
                  label={label}
                  score={category.score}
                  confidence={category.confidence}
                  trend={category.trend}
                  signalCount={category.signals.length}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
            <span>Score:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500/80 rounded" />
              High
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500/80 rounded" />
              Medium
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500/80 rounded" />
              Low
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded" />
              No data
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function HeatmapCell({
  label,
  score,
  confidence,
  trend,
  signalCount,
}: {
  label: string;
  score: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  signalCount: number;
}) {
  const bgColor = signalCount === 0
    ? 'bg-muted'
    : score >= 0.7
    ? 'bg-green-500/80'
    : score >= 0.4
    ? 'bg-yellow-500/80'
    : 'bg-red-500/80';

  const trendEmoji = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer hover:opacity-80 transition-opacity ${bgColor}`}
        >
          <span className="text-[10px] font-medium text-white truncate w-full text-center">
            {label}
          </span>
          {signalCount > 0 && (
            <span className="text-xs font-bold text-white">
              {Math.round(score * 100)}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <p className="font-medium">{label}</p>
          <p>Score: {Math.round(score * 100)}%</p>
          <p>Confidence: {Math.round(confidence * 100)}%</p>
          <p>Trend: {trendEmoji} {trend}</p>
          <p>Signals: {signalCount}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
