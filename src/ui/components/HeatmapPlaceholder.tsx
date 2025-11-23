'use client';

/**
 * Heatmap Placeholder Component
 * Phase 52: Visual representation of page engagement
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, MousePointer } from 'lucide-react';

interface HeatmapZone {
  id: string;
  name: string;
  clicks: number;
  views: number;
  intensity: 'low' | 'medium' | 'high' | 'very_high';
}

interface HeatmapPlaceholderProps {
  page: string;
  zones: HeatmapZone[];
  dateRange?: string;
}

export function HeatmapPlaceholder({
  page,
  zones,
  dateRange = 'Last 7 days',
}: HeatmapPlaceholderProps) {
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'very_high':
        return 'bg-red-500/30 border-red-500';
      case 'high':
        return 'bg-orange-500/30 border-orange-500';
      case 'medium':
        return 'bg-yellow-500/30 border-yellow-500';
      default:
        return 'bg-blue-500/30 border-blue-500';
    }
  };

  const totalClicks = zones.reduce((sum, z) => sum + z.clicks, 0);
  const totalViews = zones.reduce((sum, z) => sum + z.views, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Page Engagement Heatmap
          </CardTitle>
          <Badge variant="outline">{dateRange}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Engagement zones for {page}
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span>{totalViews.toLocaleString()} views</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MousePointer className="h-4 w-4 text-muted-foreground" />
            <span>{totalClicks.toLocaleString()} clicks</span>
          </div>
        </div>

        {/* Zone Grid */}
        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`p-4 rounded-lg border ${getIntensityColor(zone.intensity)}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{zone.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {zone.clicks} clicks • {zone.views} views
                  </div>
                </div>
                <Badge
                  variant={zone.intensity === 'very_high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {zone.intensity.replace('_', ' ')}
                </Badge>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    zone.intensity === 'very_high'
                      ? 'bg-red-500'
                      : zone.intensity === 'high'
                      ? 'bg-orange-500'
                      : zone.intensity === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${(zone.clicks / Math.max(...zones.map((z) => z.clicks))) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-xs text-muted-foreground mb-2">Intensity Legend</div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Very High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default HeatmapPlaceholder;
