'use client';

/**
 * Posting Channel Status
 * Phase 85: Shows token status and channel health
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Link2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ChannelStatus {
  channel: string;
  connected: boolean;
  lastValidated?: string;
  error?: string;
  health?: {
    fatigue: number;
    momentum: number;
  };
}

interface PostingChannelStatusProps {
  channels: ChannelStatus[];
  onRefresh?: () => void;
  className?: string;
}

const channelNames: Record<string, string> = {
  fb: 'Facebook',
  ig: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  gmb: 'Google Business',
  reddit: 'Reddit',
  x: 'X (Twitter)',
  email: 'Email',
};

export function PostingChannelStatus({
  channels,
  onRefresh,
  className = '',
}: PostingChannelStatusProps) {
  const connectedCount = channels.filter(c => c.connected).length;

  const formatTime = (timestamp?: string) => {
    if (!timestamp) {
return 'Never';
}
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Channel Connections
          <Badge variant="secondary" className="ml-auto">
            {connectedCount}/{channels.length}
          </Badge>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-muted rounded"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {channels.map(channel => (
            <div
              key={channel.channel}
              className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {channel.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : channel.error ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-medium text-sm">
                    {channelNames[channel.channel] || channel.channel}
                  </span>
                </div>
                <Badge
                  variant={channel.connected ? 'default' : 'outline'}
                  className="text-[10px]"
                >
                  {channel.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              {channel.error && (
                <p className="text-xs text-red-500 mt-2">{channel.error}</p>
              )}

              {channel.lastValidated && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Last validated: {formatTime(channel.lastValidated)}
                </p>
              )}

              {channel.health && channel.connected && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Fatigue</span>
                    <span
                      className={
                        channel.health.fatigue > 0.7
                          ? 'text-red-500'
                          : channel.health.fatigue > 0.5
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }
                    >
                      {Math.round(channel.health.fatigue * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={channel.health.fatigue * 100}
                    className="h-1"
                  />

                  <div className="flex items-center justify-between text-[10px] mt-1">
                    <span className="text-muted-foreground">Momentum</span>
                    <span className="text-green-500">
                      {Math.round(channel.health.momentum * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={channel.health.momentum * 100}
                    className="h-1"
                  />
                </div>
              )}
            </div>
          ))}

          {channels.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No channels configured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
