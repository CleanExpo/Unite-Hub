'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" <string | null> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" <NotificationSettings> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              > 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2"> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" </h3>
                  <p className="text-muted-foreground"> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3"> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3"> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellRing, Check, X, Settings, Filter,
  Users, Target, Clock, FileText, AlertCircle,
  CheckCircle, Info, AlertTriangle, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'client' | 'invoice' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  entityId?: string;
  userId: string;
  metadata: {
    action: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

interface NotificationSettings {
  dealUpdates: boolean;
  taskAssignments: boolean;
  taskDeadlines: boolean;
  clientActivity: boolean;
  invoiceReminders: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_ICONS = {
  deal: Target,
  task: Clock,
  client: Users,
  invoice: FileText,
  system: Settings,
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100',
};

const ACTION_ICONS = {
  created: CheckCircle,
  updated: Info,
  deleted: X,
  assigned: Users,
  completed: Check,
  overdue: AlertTriangle,
  reminder: Bell,
  error: AlertCircle,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    dealUpdates: true,
    taskAssignments: true,
    taskDeadlines: true,
    clientActivity: true,
    invoiceReminders: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Play sound for new notifications if enabled
      if (settings.soundEnabled && data.hasNew) {
        playNotificationSound();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/crm/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/crm/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired && !notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const ActionIcon = ACTION_ICONS[notification.metadata.action as keyof typeof ACTION_ICONS] || Info;
    const priorityClass = PRIORITY_COLORS[notification.priority];

    return (
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${priorityClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  <ActionIcon className="h-3 w-3 text-gray-400" />
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Action Required
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    {notification.metadata.entityName && (
                      <span className="text-blue-600">{notification.metadata.entityName}</span>
                    )}
                    {notification.metadata.assignedTo && (
                      <span>→ {notification.metadata.assignedTo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-gray-700" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your CRM activities
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <BellRing className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filter:</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionRequired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionRequired')}
              >
                Action Required ({actionRequiredCount})
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : filter === 'unread'
                      ? 'All caught up!'
                      : 'No actions required'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'Your notifications will appear here when there\'s activity in your CRM'
                      : filter === 'unread'
                      ? 'You\'ve read all your notifications'
                      : 'No pending actions at the moment'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Notifications */}
              <div>
                <h4 className="font-medium mb-3">Activity Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dealUpdates', label: 'Deal Updates', description: 'When deals are created, updated, or closed' },
                    { key: 'taskAssignments', label: 'Task Assignments', description: 'When tasks are assigned to you' },
                    { key: 'taskDeadlines', label: 'Task Deadlines', description: 'Reminders for upcoming task deadlines' },
                    { key: 'clientActivity', label: 'Client Activity', description: 'When clients are created or updated' },
                    { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Payment reminders and invoice updates' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Settings */}
              <div>
                <h4 className="font-medium mb-3">Delivery Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotifications', label: 'Browser Notifications', description: 'Show notifications in your browser' },
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications to your email' },
                    { key: 'soundEnabled', label: 'Sound Alerts', description: 'Play a sound for new notifications' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
.Value -replace "'", "'" <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
