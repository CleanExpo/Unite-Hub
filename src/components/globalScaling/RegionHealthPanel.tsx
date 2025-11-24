'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  Gauge,
  DollarSign,
  Thermometer
} from 'lucide-react';
import type { RegionHealthSummary, ScalingMode } from '@/lib/globalScaling';

interface RegionHealthPanelProps {
  regions: RegionHealthSummary[];
  onSelectRegion?: (regionId: string) => void;
}

const modeColors: Record<ScalingMode, string> = {
  normal: 'bg-green-500',
  cautious: 'bg-yellow-500',
  throttled: 'bg-orange-500',
  frozen: 'bg-red-500',
};

const modeLabels: Record<ScalingMode, string> = {
  normal: 'Normal',
  cautious: 'Cautious',
  throttled: 'Throttled',
  frozen: 'Frozen',
};

export function RegionHealthPanel({ regions, onSelectRegion }: RegionHealthPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {regions.map((region) => (
        <Card
          key={region.regionId}
          className={`cursor-pointer hover:bg-accent transition-colors ${
            region.scalingMode === 'frozen' ? 'border-red-500' : ''
          }`}
          onClick={() => onSelectRegion?.(region.regionId)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{region.regionName}</CardTitle>
              <Badge
                variant="outline"
                className={`${modeColors[region.scalingMode]} text-white`}
              >
                {modeLabels[region.scalingMode]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Capacity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span>Capacity</span>
                </div>
                <span className="font-medium">{region.capacityScore.toFixed(0)}%</span>
              </div>
              <Progress
                value={region.capacityScore}
                className={`h-2 ${
                  region.capacityScore < 30
                    ? '[&>div]:bg-red-500'
                    : region.capacityScore < 50
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-green-500'
                }`}
              />
            </div>

            {/* Pressure */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <span>Pressure</span>
                </div>
                <span className="font-medium">{region.overallPressure.toFixed(0)}%</span>
              </div>
              <Progress
                value={region.overallPressure}
                className={`h-2 ${
                  region.overallPressure > 75
                    ? '[&>div]:bg-red-500'
                    : region.overallPressure > 50
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-green-500'
                }`}
              />
            </div>

            {/* Budget */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Budget</span>
                </div>
                <span className="font-medium">{region.budgetPercentRemaining.toFixed(0)}%</span>
              </div>
              <Progress
                value={region.budgetPercentRemaining}
                className={`h-2 ${
                  region.budgetPercentRemaining < 25
                    ? '[&>div]:bg-red-500'
                    : region.budgetPercentRemaining < 50
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-green-500'
                }`}
              />
            </div>

            {/* Warning */}
            {region.warningIndex > 0 && (
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Warning index: {region.warningIndex.toFixed(1)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {regions.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Regions</h3>
            <p className="text-muted-foreground">
              No regions have been configured yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
