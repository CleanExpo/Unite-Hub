'use client';

/**
 * Notification Center
 * Phase: D59
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, Check, Settings } from 'lucide-react';

interface Notification {
  id: string;
  channel: string;
  type: string;
  title: string;
  body?: string;
  severity: string;
  read_at?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/notifications?limit=50');
      const data = await response.json();
      if (response.ok) setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/unite/notifications?action=mark_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-500',
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    return colors[severity] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Notification Center</h1>
            <p className="text-text-secondary">Manage your notifications and preferences</p>
          </div>
          <Button className="bg-accent-500 text-white">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
            <Bell className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
            <p className="text-text-secondary">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 bg-bg-card rounded-lg border ${
                  notification.read_at ? 'border-border-primary opacity-60' : 'border-accent-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(notification.severity)}`} />
                    <h3 className="text-lg font-semibold text-text-primary">{notification.title}</h3>
                  </div>
                  {!notification.read_at && (
                    <Button onClick={() => handleMarkRead(notification.id)} size="sm" variant="ghost">
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {notification.body && (
                  <p className="text-text-secondary text-sm mb-2">{notification.body}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span>{notification.channel}</span>
                  <span>•</span>
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
