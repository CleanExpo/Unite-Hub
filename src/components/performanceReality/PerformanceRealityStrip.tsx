'use client';

/**
 * Performance Reality Strip
 * Phase 81: Compact reality display for Founder Intel
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { RealityStripData, RealityScope } from '@/lib/performanceReality';

interface PerformanceRealityStripProps {
  scope?: RealityScope;
  clientId?: string;
  className?: string;
}

export function PerformanceRealityStrip({
  scope = 'global',
  clientId,
  className = '',
}: PerformanceRealityStripProps) {
  const [data, setData] = useState<RealityStripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStripData();
  }, [scope, clientId]);

  const loadStripData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ scope });
      if (clientId) {
params.set('client_id', clientId);
}

      const res = await fetch(`/api/performance-reality/strip?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load reality strip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardContent className="p-3">
          <div className="h-12 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const DeltaIcon = data.delta_direction === 'up'
    ? TrendingUp
    : data.delta_direction === 'down'
    ? TrendingDown
    : Minus;

  const deltaColor = data.delta_direction === 'up'
    ? 'text-green-500'
    : data.delta_direction === 'down'
    ? 'text-red-500'
    : 'text-muted-foreground';

  const reliabilityBg = {
    green: 'bg-green-500/10 border-green-500/30',
    yellow: 'bg-yellow-500/10 border-yellow-500/30',
    red: 'bg-red-500/10 border-red-500/30',
  }[data.reliability_color];

  return (
    <TooltipProvider>
      <Card className={`${reliabilityBg} ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-4">
            {/* Scores */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Perceived</p>
                <p className="text-lg font-bold">{data.perceived_score}</p>
              </div>

              <div className="flex items-center gap-1">
                <DeltaIcon className={`h-4 w-4 ${deltaColor}`} />
                <span className={`text-sm font-medium ${deltaColor}`}>
                  {data.score_delta > 0 ? '+' : ''}{data.score_delta}
                </span>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">True</p>
                <p className="text-lg font-bold">{data.true_score}</p>
              </div>
            </div>

            {/* Confidence band */}
            <Tooltip>
              <TooltipTrigger>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-sm font-medium">
                    {data.confidence_low}-{data.confidence_high}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>True score likely between {data.confidence_low} and {data.confidence_high}</p>
              </TooltipContent>
            </Tooltip>

            {/* Primary driver */}
            <div className="hidden sm:block text-center">
              <p className="text-xs text-muted-foreground">Primary Driver</p>
              <Badge variant="outline" className="text-xs capitalize">
                {data.primary_driver}
              </Badge>
            </div>

            {/* Warning */}
            {data.has_warning && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{data.warning_text}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Data quality */}
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    data.data_quality === 'Excellent' || data.data_quality === 'Good'
                      ? 'text-green-500'
                      : data.data_quality === 'Moderate'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}
                >
                  {data.data_quality}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Data quality: {data.data_quality}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
