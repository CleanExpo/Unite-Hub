'use client';

/**
 * Orchestration Channel Health
 * Phase 84: Shows fatigue, momentum, visibility per channel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  TrendingUp,
  Eye,
  Zap,
  Clock,
} from 'lucide-react';

interface ChannelHealth {
  channel: string;
  health_score: number;
  fatigue: number;
  momentum: number;
  visibility: number;
  engagement: number;
  last_post?: string;
  recommended_wait_hours: number;
}

interface ChannelSummary {
  channel: string;
  schedules_pending: number;
  schedules_completed: number;
  health: ChannelHealth;
}

interface OrchestrationChannelHealthProps {
  channels: ChannelSummary[];
  className?: string;
}

export function OrchestrationChannelHealth({
  channels,
  className = '',
}: OrchestrationChannelHealthProps) {
  const getHealthColor = (score: number) => {
    if (score >= 0.7) {
return 'text-green-500';
}
    if (score >= 0.4) {
return 'text-yellow-500';
}
    return 'text-red-500';
  };

  const getFatigueColor = (score: number) => {
    if (score <= 0.3) {
return 'text-green-500';
}
    if (score <= 0.6) {
return 'text-yellow-500';
}
    return 'text-red-500';
  };

  const formatLastPost = (timestamp?: string) => {
    if (!timestamp) {
return 'Never';
}
    const date = new Date(timestamp);
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) {
return 'Just now';
}
    if (hours < 24) {
return `${hours}h ago`;
}
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (channels.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Channel Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-4">
            No channel data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Channel Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map(({ channel, schedules_pending, schedules_completed, health }) => (
          <div key={channel} className="space-y-2 pb-3 border-b last:border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{channel.toUpperCase()}</Badge>
                <span className={`text-sm font-medium ${getHealthColor(health.health_score)}`}>
                  {Math.round(health.health_score * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{schedules_pending} pending</span>
                <span>{schedules_completed} done</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              {/* Fatigue */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  Fatigue
                </div>
                <Progress value={health.fatigue * 100} className="h-1" />
                <span className={getFatigueColor(health.fatigue)}>
                  {Math.round(health.fatigue * 100)}%
                </span>
              </div>

              {/* Momentum */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Momentum
                </div>
                <Progress value={health.momentum * 100} className="h-1" />
                <span className={getHealthColor(health.momentum)}>
                  {Math.round(health.momentum * 100)}%
                </span>
              </div>

              {/* Visibility */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  Visibility
                </div>
                <Progress value={health.visibility * 100} className="h-1" />
                <span className={getHealthColor(health.visibility)}>
                  {Math.round(health.visibility * 100)}%
                </span>
              </div>

              {/* Last Post */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last Post
                </div>
                <span className="text-[10px]">
                  {formatLastPost(health.last_post)}
                </span>
                {health.recommended_wait_hours > 24 && (
                  <span className="text-yellow-500 text-[10px]">
                    Wait {health.recommended_wait_hours}h
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
