'use client';

import React from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/lib/pwa/push-notifications';
import { toast } from 'sonner';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const success = await subscribe();
      if (success) {
        toast.success('Push notifications enabled');
      } else {
        toast.error('Failed to enable push notifications');
      }
    } else {
      const success = await unsubscribe();
      if (success) {
        toast.success('Push notifications disabled');
      } else {
        toast.error('Failed to disable push notifications');
      }
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about important updates and activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Enable Notifications</div>
            <div className="text-sm text-muted-foreground">
              Receive push notifications on this device
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={loading || permission === 'denied'}
            />
          </div>
        </div>

        {permission === 'denied' && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            Push notifications are blocked. Please enable them in your browser settings.
          </div>
        )}

        {isSubscribed && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Notification Types</h4>
            
            <div className="space-y-3">
              <NotificationTypeToggle
                title="System Updates"
                description="Important system updates and maintenance"
                defaultChecked={true}
              />
              <NotificationTypeToggle
                title="New Messages"
                description="When you receive new messages"
                defaultChecked={true}
              />
              <NotificationTypeToggle
                title="Task Reminders"
                description="Reminders for upcoming tasks"
                defaultChecked={true}
              />
              <NotificationTypeToggle
                title="Marketing"
                description="Product updates and announcements"
                defaultChecked={false}
              />
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          You can change these settings at any time. Notifications require permission from your browser.
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationTypeToggle({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <div className="text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={setChecked}
        className="ml-4"
      />
    </div>
  );
}

/**
 * Compact notification toggle for use in other components
 */
export function NotificationToggle() {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="relative h-9 w-9 p-0"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
      </span>
    </Button>
  );
}
