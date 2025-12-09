'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Send,
  Cpu,
  Palette,
  BarChart3
} from 'lucide-react';

interface PressureData {
  posting: number;
  orchestration: number;
  creative: number;
  intel: number;
}

interface RegionPressureChartProps {
  pressures: PressureData;
  regionName?: string;
}

const pressureConfig = [
  {
    key: 'posting' as const,
    label: 'Posting',
    icon: Send,
    description: 'Social media and content posting',
  },
  {
    key: 'orchestration' as const,
    label: 'Orchestration',
    icon: Cpu,
    description: 'Workflow coordination',
  },
  {
    key: 'creative' as const,
    label: 'Creative',
    icon: Palette,
    description: 'Content generation',
  },
  {
    key: 'intel' as const,
    label: 'Intel',
    icon: BarChart3,
    description: 'Analytics and insights',
  },
];

function getPressureColor(value: number): string {
  if (value > 75) {
return '[&>div]:bg-red-500';
}
  if (value > 50) {
return '[&>div]:bg-orange-500';
}
  if (value > 25) {
return '[&>div]:bg-yellow-500';
}
  return '[&>div]:bg-green-500';
}

export function RegionPressureChart({ pressures, regionName }: RegionPressureChartProps) {
  const overallPressure = (
    pressures.posting * 0.3 +
    pressures.orchestration * 0.25 +
    pressures.creative * 0.25 +
    pressures.intel * 0.2
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pressure Metrics{regionName ? ` - ${regionName}` : ''}</span>
          <span className="text-sm font-normal text-muted-foreground">
            Overall: {overallPressure.toFixed(1)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {pressureConfig.map(({ key, label, icon: Icon, description }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">{label}</span>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <span className="font-mono text-sm">{pressures[key].toFixed(1)}%</span>
            </div>
            <Progress
              value={pressures[key]}
              className={`h-3 ${getPressureColor(pressures[key])}`}
            />
          </div>
        ))}

        {/* Visual bar comparison */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Comparison</h4>
          <div className="flex items-end gap-2 h-24">
            {pressureConfig.map(({ key, label }) => (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${getPressureColor(pressures[key]).replace('[&>div]:', '')}`}
                  style={{ height: `${pressures[key]}%` }}
                />
                <span className="text-xs text-muted-foreground">{label.slice(0, 4)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
