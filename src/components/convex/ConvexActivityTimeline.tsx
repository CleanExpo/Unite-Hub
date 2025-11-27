'use client';

/**
 * CONVEX Activity Timeline Component
 *
 * Displays strategy activity history with:
 * - Timeline view of all user actions
 * - Filters by activity type
 * - User avatars and timestamps
 * - Rich metadata display
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Share2,
  Edit3,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'commented' | 'shared' | 'restored';
  user: string;
  userId: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivitySummary {
  totalActivities: number;
  activitiesByType: Record<string, number>;
  activeUsers: number;
  lastActivityTime: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  summary?: ActivitySummary;
  limit?: number;
}

export function ConvexActivityTimeline({
  activities,
  summary,
  limit = 50,
}: ActivityTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredActivities = filterType
    ? activities.filter((a) => a.type === filterType)
    : activities;

  const displayedActivities = filteredActivities.slice(0, limit);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        );
      case 'updated':
        return <Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'commented':
        return (
          <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        );
      case 'shared':
        return <Share2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'restored':
        return (
          <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        );
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'updated':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'commented':
        return 'bg-purple-100 dark:bg-purple-900/30';
      case 'shared':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'restored':
        return 'bg-orange-100 dark:bg-orange-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100';
      case 'updated':
        return 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100';
      case 'commented':
        return 'bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100';
      case 'shared':
        return 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100';
      case 'restored':
        return 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100';
      default:
        return 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{summary.totalActivities}</p>
              <p className="text-xs text-muted-foreground">Total Activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{summary.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">
                {summary.activitiesByType['updated'] || 0}
              </p>
              <p className="text-xs text-muted-foreground">Updates</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold truncate">
                {new Date(summary.lastActivityTime).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">Last Activity</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Type Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterType === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType(null)}
        >
          All ({activities.length})
        </Button>

        {summary &&
          Object.entries(summary.activitiesByType).map(([type, count]) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
              className="capitalize"
            >
              {type} ({count})
            </Button>
          ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {displayedActivities.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-sm text-muted-foreground">
                No activities to display
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline connector */}
                {index < displayedActivities.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                )}

                {/* Activity card */}
                <Card className={getActivityColor(activity.type)}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-semibold">
                              {activity.user}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge className={getActivityBadgeColor(activity.type)}>
                            {activity.type}
                          </Badge>
                        </div>

                        <p className="text-sm text-foreground">
                          {activity.description}
                        </p>

                        {/* Expandable Metadata */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs mt-2 h-auto py-1"
                              onClick={() =>
                                setExpandedId(
                                  expandedId === activity.id
                                    ? null
                                    : activity.id
                                )
                              }
                            >
                              {expandedId === activity.id ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Hide details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Show details
                                </>
                              )}
                            </Button>

                            {expandedId === activity.id && (
                              <div className="mt-3 p-3 bg-background/50 rounded border text-xs space-y-1">
                                {Object.entries(activity.metadata).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="font-semibold text-muted-foreground">
                                        {key}:
                                      </span>
                                      <span className="text-foreground break-all">
                                        {typeof value === 'object'
                                          ? JSON.stringify(value, null, 2)
                                          : String(value)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredActivities.length > limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Load {filteredActivities.length - limit} more activities
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
