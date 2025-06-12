'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardService } from '@/lib/services/dashboard';
import type { Notification } from '@/types/dashboard';
import Link from 'next/link';

interface NotificationCenterProps {
  userId: string;
  className?: string;
}

export function NotificationCenter({ userId, className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to new notifications
    const channel = DashboardService.subscribeToNotifications(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(() => {});
    });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        DashboardService.getNotifications(userId, !showAll),
        DashboardService.getUnreadNotificationCount(userId)
      ]);
      
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await DashboardService.markNotificationRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await DashboardService.markAllNotificationsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-400 bg-blue-900/20';
      case 'success':
        return 'text-green-400 bg-green-900/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'error':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <Card className={cn("bg-slate-800 border-slate-700", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-teal-400" />
          <CardTitle className="text-lg text-white">Notifications</CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-teal-600 text-white">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAllAsRead}
              className="text-xs text-slate-400 hover:text-white"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowAll(!showAll);
              loadNotifications();
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            {showAll ? 'Show unread' : 'Show all'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 hover:bg-slate-700/50 transition-colors",
                      !notification.is_read && "bg-slate-700/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 w-6 p-0 hover:bg-slate-600"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              className="text-xs text-teal-400 hover:underline"
                            >
                              View Details â†’
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
