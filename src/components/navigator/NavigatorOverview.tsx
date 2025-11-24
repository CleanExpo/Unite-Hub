'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Compass,
  AlertTriangle,
  TrendingUp,
  Shield,
  Activity
} from 'lucide-react';
import type { NavigatorSnapshot } from '@/lib/navigator';

interface NavigatorOverviewProps {
  snapshot: NavigatorSnapshot;
}

const healthColors = {
  excellent: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  attention: 'bg-amber-100 text-amber-800 border-amber-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export function NavigatorOverview({ snapshot }: NavigatorOverviewProps) {
  const { summary } = snapshot;

  return (
    <div className="space-y-4">
      {/* Health Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              System Health
            </span>
            <Badge className={healthColors[summary.overallHealth]}>
              {summary.overallHealth.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Confidence</span>
              <span>{Math.round(snapshot.confidence * 100)}%</span>
            </div>
            <Progress value={snapshot.confidence * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Opportunities</span>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.keyMetrics.opportunities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Warnings</span>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.keyMetrics.warnings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Performance</span>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.keyMetrics.performance}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Compliance</span>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.keyMetrics.compliance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Priority */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{summary.topPriority}</p>
        </CardContent>
      </Card>

      {/* Quick Wins & Watch Items */}
      <div className="grid gap-4 md:grid-cols-2">
        {summary.quickWins.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-600">Quick Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {summary.quickWins.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {summary.watchItems.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-600">Watch Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {summary.watchItems.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
