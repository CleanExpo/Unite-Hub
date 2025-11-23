'use client';

/**
 * Creative Ops Card
 * Phase 71: Condensed client overview for ops grid
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap,
  Activity,
} from 'lucide-react';
import { OpsGridState, GridZone } from '@/lib/operations/creativeOpsGridEngine';

interface CreativeOpsCardProps {
  clientName: string;
  gridState: OpsGridState;
  criticalCount?: number;
  opportunityCount?: number;
  onClick?: () => void;
}

export function CreativeOpsCard({
  clientName,
  gridState,
  criticalCount = 0,
  opportunityCount = 0,
  onClick,
}: CreativeOpsCardProps) {
  const getZoneConfig = (zone: GridZone) => {
    switch (zone) {
      case 'stability':
        return { icon: Shield, color: 'bg-blue-500', text: 'Stable', textColor: 'text-blue-500' };
      case 'pressure':
        return { icon: AlertTriangle, color: 'bg-red-500', text: 'Pressure', textColor: 'text-red-500' };
      case 'opportunity':
        return { icon: TrendingUp, color: 'bg-green-500', text: 'Opportunity', textColor: 'text-green-500' };
      case 'expansion':
        return { icon: Zap, color: 'bg-purple-500', text: 'Expansion', textColor: 'text-purple-500' };
    }
  };

  const config = getZoneConfig(gridState.zone);
  const Icon = config.icon;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">
            {clientName}
          </CardTitle>
          <Badge className={`${config.color} gap-1`}>
            <Icon className="h-3 w-3" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Zone score */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Zone Score</span>
            <span className={`font-bold ${config.textColor}`}>
              {gridState.zone_score.toFixed(0)}
            </span>
          </div>
          <Progress
            value={gridState.zone_score}
            className={`h-1.5 ${config.color}`}
          />
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Health</span>
            <span className={getScoreColor(gridState.health_score)}>
              {gridState.health_score.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pressure</span>
            <span className={getPressureColor(gridState.pressure_score)}>
              {gridState.pressure_score.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Opportunity</span>
            <span className="text-green-500">
              {gridState.opportunity_score.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coord</span>
            <span className={getScoreColor(gridState.coordination_score)}>
              {gridState.coordination_score.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Alerts */}
        <div className="flex items-center justify-between pt-2 border-t">
          {criticalCount > 0 ? (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} critical
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              No alerts
            </div>
          )}
          {opportunityCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              {opportunityCount} opp
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-500 font-medium';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

function getPressureColor(score: number): string {
  if (score <= 30) return 'text-green-500 font-medium';
  if (score <= 50) return 'text-yellow-500';
  return 'text-red-500';
}

export default CreativeOpsCard;
