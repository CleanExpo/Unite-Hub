'use client';

/**
 * Scaling Mode Timeline
 * Phase 86: Visualise scaling history events
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
  Play,
  FileText,
  Settings,
} from 'lucide-react';

interface ScalingHistoryEvent {
  id: string;
  created_at: string;
  event_type: string;
  old_mode?: string;
  new_mode?: string;
  reason_markdown: string;
  actor: string;
}

interface ScalingModeTimelineProps {
  events: ScalingHistoryEvent[];
  className?: string;
}

const eventIcons: Record<string, any> = {
  mode_change: ArrowUpRight,
  capacity_update: Settings,
  freeze: Pause,
  unfreeze: Play,
  note: FileText,
  config_update: Settings,
};

const eventColors: Record<string, string> = {
  mode_change: 'text-blue-500',
  capacity_update: 'text-purple-500',
  freeze: 'text-red-500',
  unfreeze: 'text-green-500',
  note: 'text-gray-500',
  config_update: 'text-orange-500',
};

const eventLabels: Record<string, string> = {
  mode_change: 'Mode Change',
  capacity_update: 'Capacity Update',
  freeze: 'Frozen',
  unfreeze: 'Unfrozen',
  note: 'Note',
  config_update: 'Config Update',
};

export function ScalingModeTimeline({
  events,
  className = '',
}: ScalingModeTimelineProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Scaling Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No scaling events yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Scaling Timeline
          <Badge variant="secondary" className="ml-auto">
            {events.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {events.map((event, index) => {
            const Icon = eventIcons[event.event_type] || FileText;
            const color = eventColors[event.event_type] || 'text-gray-500';

            return (
              <div key={event.id} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`p-1.5 rounded-full bg-muted ${color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-px h-full bg-border flex-1 my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {eventLabels[event.event_type] || event.event_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(event.created_at)}
                    </span>
                  </div>

                  {/* Mode change details */}
                  {event.event_type === 'mode_change' && event.old_mode && event.new_mode && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {event.old_mode}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="default" className="text-[10px]">
                        {event.new_mode}
                      </Badge>
                    </div>
                  )}

                  {/* Reason */}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {event.reason_markdown.split('\n')[0]}
                  </p>

                  {/* Actor */}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    by {event.actor}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
