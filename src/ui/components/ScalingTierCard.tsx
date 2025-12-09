'use client';

/**
 * Scaling Tier Card
 * Phase 66: Display tier status and capacity overview
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Layers,
  Users,
  ArrowUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface ScalingTierCardProps {
  tier_id: string;
  tier_label: string;
  current_clients: number;
  max_clients: number;
  utilization_percent: number;
  headroom_clients: number;
  status: 'green' | 'amber' | 'red';
  can_onboard: boolean;
  next_milestone: string;
  onUpgrade?: () => void;
}

export function ScalingTierCard({
  tier_id,
  tier_label,
  current_clients,
  max_clients,
  utilization_percent,
  headroom_clients,
  status,
  can_onboard,
  next_milestone,
  onUpgrade,
}: ScalingTierCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'green':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-500',
          icon: <CheckCircle2 className="h-4 w-4" />,
          label: 'Healthy',
        };
      case 'amber':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-500',
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Warning',
        };
      case 'red':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-500',
          icon: <XCircle className="h-4 w-4" />,
          label: 'Critical',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const getProgressColor = () => {
    if (utilization_percent >= 90) {
return '[&>div]:bg-red-500';
}
    if (utilization_percent >= 75) {
return '[&>div]:bg-yellow-500';
}
    return '[&>div]:bg-green-500';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">{tier_label}</CardTitle>
          </div>
          <Badge className={`${statusConfig.color} gap-1`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Active Clients</span>
          </div>
          <span className="text-lg font-bold">
            {current_clients} / {max_clients}
          </span>
        </div>

        {/* Utilization bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Capacity</span>
            <span className={statusConfig.textColor}>{utilization_percent}%</span>
          </div>
          <Progress value={utilization_percent} className={`h-2 ${getProgressColor()}`} />
        </div>

        {/* Headroom */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Headroom</span>
          <span className={headroom_clients <= 2 ? 'text-orange-500 font-medium' : ''}>
            {headroom_clients} client{headroom_clients !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Next milestone */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          {next_milestone}
        </div>

        {/* Onboarding status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs">
            {can_onboard ? (
              <span className="text-green-500">✓ Can onboard new clients</span>
            ) : (
              <span className="text-red-500">✗ Capacity at limit</span>
            )}
          </div>
          {onUpgrade && tier_id !== 'growth_phase' && (
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
              <ArrowUp className="h-3 w-3" />
              Upgrade
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ScalingTierCard;
