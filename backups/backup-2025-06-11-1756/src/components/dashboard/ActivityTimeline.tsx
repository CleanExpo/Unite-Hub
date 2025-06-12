'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Briefcase, DollarSign, MessageSquare, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardService } from '@/lib/services/dashboard';
import type { ActivityTimeline as ActivityType } from '@/types/dashboard';

interface ActivityTimelineProps {
  userId: string;
  className?: string;
  limit?: number;
}

export function ActivityTimeline({ userId, className, limit = 10 }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Subscribe to new activities
    const channel = DashboardService.subscribeToActivities(userId, (activity) => {
      setActivities(prev => [activity, ...prev.slice(0, limit - 1)]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [userId, limit]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const data = await DashboardService.getActivityTimeline(userId, limit);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string, icon?: string) => {
    // Use provided icon if available
    if (icon) {
      switch (icon) {
        case 'Calendar':
          return <Calendar className="h-4 w-4" />;
        case 'Briefcase':
          return <Briefcase className="h-4 w-4" />;
        case 'DollarSign':
          return <DollarSign className="h-4 w-4" />;
        case 'MessageSquare':
          return <MessageSquare className="h-4 w-4" />;
        case 'FileText':
          return <FileText className="h-4 w-4" />;
        case 'CheckCircle':
          return <CheckCircle className="h-4 w-4" />;
        case 'AlertCircle':
          return <AlertCircle className="h-4 w-4" />;
      }
    }

    // Default icons based on activity type
    switch (type) {
      case 'consultation_booked':
        return <Calendar className="h-4 w-4" />;
      case 'project_created':
      case 'project_updated':
        return <Briefcase className="h-4 w-4" />;
      case 'payment_received':
        return <DollarSign className="h-4 w-4" />;
      case 'message_received':
        return <MessageSquare className="h-4 w-4" />;
      case 'document_uploaded':
        return <FileText className="h-4 w-4" />;
      case 'milestone_completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (color?: string) => {
    if (color) {
      const colorMap: Record<string, string> = {
        blue: 'text-blue-400 bg-blue-900/20',
        green: 'text-green-400 bg-green-900/20',
        yellow: 'text-yellow-400 bg-yellow-900/20',
        red: 'text-red-400 bg-red-900/20',
        purple: 'text-purple-400 bg-purple-900/20',
        teal: 'text-teal-400 bg-teal-900/20',
      };
      return colorMap[color] || 'text-gray-400 bg-gray-900/20';
    }
    return 'text-gray-400 bg-gray-900/20';
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return activityDate.toLocaleDateString();
    }
  };

  return (
    <Card className={cn("bg-slate-800 border-slate-700", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-teal-400" />
          <CardTitle className="text-lg text-white">Activity Timeline</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="relative px-6 py-4">
              {/* Timeline line */}
              <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-slate-700"></div>
              
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4 mb-6 last:mb-0"
                >
                  {/* Timeline dot and icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={cn(
                      "p-2 rounded-full",
                      getActivityColor(activity.color)
                    )}>
                      {getActivityIcon(activity.activity_type, activity.icon)}
                    </div>
                    {/* Connector dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-800 rounded-full border-2 border-slate-700"></div>
                  </div>
                  
                  {/* Activity content */}
                  <div className="flex-1 pt-0.5">
                    <h4 className="text-sm font-medium text-white">
                      {activity.title}
                    </h4>
                    {activity.description && (
                      <p className="text-xs text-slate-400 mt-1">
                        {activity.description}
                      </p>
                    )}
                    <span className="text-xs text-slate-500 mt-1 block">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
