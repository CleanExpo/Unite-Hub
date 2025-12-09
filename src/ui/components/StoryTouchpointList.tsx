'use client';

/**
 * Story Touchpoint List
 * Phase 75: Display grouped touchpoints by timeframe
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { StoryTouchpointCard } from './StoryTouchpointCard';
import {
  StoryTouchpoint,
  TouchpointTimeframe,
} from '@/lib/storytelling/storyTouchpointEngine';

interface StoryTouchpointListProps {
  touchpoints: StoryTouchpoint[];
  onViewTouchpoint?: (touchpoint: StoryTouchpoint) => void;
  onRegenerateTouchpoint?: (touchpoint: StoryTouchpoint) => void;
  groupByTimeframe?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function StoryTouchpointList({
  touchpoints,
  onViewTouchpoint,
  onRegenerateTouchpoint,
  groupByTimeframe = true,
  showHeader = true,
  className = '',
}: StoryTouchpointListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<TouchpointTimeframe>>(
    new Set(['weekly', 'monthly', 'ninety_day'])
  );

  if (touchpoints.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          No touchpoints available yet
        </CardContent>
      </Card>
    );
  }

  // Sort by most recent first
  const sortedTouchpoints = [...touchpoints].sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  // Group by timeframe if requested
  if (groupByTimeframe) {
    const groups: Record<TouchpointTimeframe, StoryTouchpoint[]> = {
      weekly: [],
      monthly: [],
      ninety_day: [],
    };

    for (const tp of sortedTouchpoints) {
      groups[tp.timeframe].push(tp);
    }

    const toggleGroup = (timeframe: TouchpointTimeframe) => {
      const newExpanded = new Set(expandedGroups);
      if (newExpanded.has(timeframe)) {
        newExpanded.delete(timeframe);
      } else {
        newExpanded.add(timeframe);
      }
      setExpandedGroups(newExpanded);
    };

    const timeframeConfig = {
      weekly: { label: 'Weekly', icon: Calendar, color: 'text-blue-500' },
      monthly: { label: 'Monthly', icon: Calendar, color: 'text-purple-500' },
      ninety_day: { label: '90-Day', icon: Calendar, color: 'text-green-500' },
    };

    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Story Touchpoints</h3>
            <Badge variant="outline" className="text-xs">
              {touchpoints.length} total
            </Badge>
          </div>
        )}

        {(['weekly', 'monthly', 'ninety_day'] as TouchpointTimeframe[]).map((timeframe) => {
          const groupTouchpoints = groups[timeframe];
          if (groupTouchpoints.length === 0) {
return null;
}

          const config = timeframeConfig[timeframe];
          const Icon = config.icon;
          const isExpanded = expandedGroups.has(timeframe);

          return (
            <Card key={timeframe}>
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => toggleGroup(timeframe)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <CardTitle className="text-sm">{config.label}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {groupTouchpoints.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-3">
                  {groupTouchpoints.map((touchpoint) => (
                    <StoryTouchpointCard
                      key={touchpoint.touchpoint_id}
                      touchpoint={touchpoint}
                      onView={
                        onViewTouchpoint
                          ? () => onViewTouchpoint(touchpoint)
                          : undefined
                      }
                      onRegenerate={
                        onRegenerateTouchpoint
                          ? () => onRegenerateTouchpoint(touchpoint)
                          : undefined
                      }
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  // Flat list (no grouping)
  return (
    <div className={`space-y-3 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Story Touchpoints</h3>
          <Badge variant="outline" className="text-xs">
            {touchpoints.length} total
          </Badge>
        </div>
      )}
      {sortedTouchpoints.map((touchpoint) => (
        <StoryTouchpointCard
          key={touchpoint.touchpoint_id}
          touchpoint={touchpoint}
          onView={
            onViewTouchpoint
              ? () => onViewTouchpoint(touchpoint)
              : undefined
          }
          onRegenerate={
            onRegenerateTouchpoint
              ? () => onRegenerateTouchpoint(touchpoint)
              : undefined
          }
        />
      ))}
    </div>
  );
}

/**
 * Compact touchpoint status table for founder view
 */
export function TouchpointStatusTable({
  clients,
  onRegenerate,
}: {
  clients: {
    client_id: string;
    client_name: string;
    weekly_status: string;
    monthly_status: string;
    ninety_day_status: string;
    needs_attention: boolean;
  }[];
  onRegenerate?: (clientId: string, timeframe: TouchpointTimeframe) => void;
}) {
  const getStatusBadge = (status: string) => {
    const config = {
      fresh: { color: 'bg-green-500/10 text-green-500', label: 'Fresh' },
      stale: { color: 'bg-yellow-500/10 text-yellow-500', label: 'Stale' },
      expired: { color: 'bg-red-500/10 text-red-500', label: 'Expired' },
    }[status] || { color: 'bg-muted', label: status };

    return (
      <Badge variant="outline" className={`text-[10px] ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 text-xs font-medium">Client</th>
            <th className="text-center p-3 text-xs font-medium">Weekly</th>
            <th className="text-center p-3 text-xs font-medium">Monthly</th>
            <th className="text-center p-3 text-xs font-medium">90-Day</th>
            <th className="text-right p-3 text-xs font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              key={client.client_id}
              className={`border-t ${client.needs_attention ? 'bg-orange-500/5' : ''}`}
            >
              <td className="p-3 text-sm font-medium">
                {client.client_name}
              </td>
              <td className="p-3 text-center">
                {getStatusBadge(client.weekly_status)}
              </td>
              <td className="p-3 text-center">
                {getStatusBadge(client.monthly_status)}
              </td>
              <td className="p-3 text-center">
                {getStatusBadge(client.ninety_day_status)}
              </td>
              <td className="p-3 text-right">
                {onRegenerate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => onRegenerate(client.client_id, 'weekly')}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StoryTouchpointList;
