'use client';

/**
 * Combat Rounds Table
 * Phase 88: List all rounds and their status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Swords,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface CombatRound {
  id: string;
  createdAt: string;
  channel: string;
  roundStatus: string;
  strategy: string;
  startedAt?: string;
  completedAt?: string;
}

interface CombatRoundsTableProps {
  rounds: CombatRound[];
  onStartRound?: (roundId: string) => void;
  className?: string;
}

const channelColors: Record<string, string> = {
  fb: 'bg-blue-500',
  ig: 'bg-pink-500',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-700',
  youtube: 'bg-red-500',
  gmb: 'bg-green-500',
  reddit: 'bg-orange-500',
  email: 'bg-gray-500',
  x: 'bg-black',
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  running: { icon: Play, color: 'text-blue-500', label: 'Running' },
  complete: { icon: CheckCircle, color: 'text-green-500', label: 'Complete' },
  inconclusive: { icon: AlertTriangle, color: 'text-gray-500', label: 'Inconclusive' },
};

const strategyLabels: Record<string, string> = {
  classic_ab: 'A/B Test',
  multivariate: 'Multivariate',
  rapid_cycle: 'Rapid Cycle',
};

export function CombatRoundsTable({
  rounds,
  onStartRound,
  className = '',
}: CombatRoundsTableProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (rounds.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Combat Rounds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No combat rounds yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Swords className="h-4 w-4" />
          Combat Rounds
          <Badge variant="secondary" className="ml-auto">
            {rounds.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {rounds.map(round => {
            const statusInfo = statusConfig[round.roundStatus] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={round.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    <Badge className={channelColors[round.channel] || 'bg-gray-500'}>
                      {round.channel.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {strategyLabels[round.strategy] || round.strategy}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(round.createdAt)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {statusInfo.label}
                    {round.startedAt && ` • Started ${formatTime(round.startedAt)}`}
                  </span>

                  {round.roundStatus === 'pending' && onStartRound && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartRound(round.id)}
                      className="h-6 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
