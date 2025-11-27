/**
 * Alert Notification Manager Component
 *
 * Manages notification preferences and intelligent delivery:
 * - Smart deduplication and grouping
 * - Quiet hours configuration
 * - Escalation rules management
 * - Channel-specific settings
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, MessageSquare, Slack, Clock, Bell, Settings, Save } from 'lucide-react';
import { logger } from '@/lib/logging';

interface NotificationPreferences {
  email_enabled: boolean;
  in_app_enabled: boolean;
  slack_enabled: boolean;
  grouping_enabled: boolean;
  deduplication_enabled: boolean;
  deduplication_window_minutes: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  min_alert_severity: 'info' | 'warning' | 'critical';
  max_notifications_per_hour: number;
  escalation_enabled: boolean;
  escalation_after_minutes: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_enabled: true,
  in_app_enabled: true,
  slack_enabled: false,
  grouping_enabled: true,
  deduplication_enabled: true,
  deduplication_window_minutes: 5,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '06:00',
  min_alert_severity: 'info',
  max_notifications_per_hour: 20,
  escalation_enabled: true,
  escalation_after_minutes: 60,
};

export function AlertNotificationManager({
  frameworkId,
  workspaceId,
}: {
  frameworkId: string;
  workspaceId: string;
}) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    logger.info('[NOTIFICATION MANAGER] Saving preferences...');

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      logger.info('[NOTIFICATION MANAGER] Preferences saved successfully');
      setShowDialog(false);
    }, 1000);
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Preferences
        </h2>
        <Button onClick={() => setShowDialog(true)} size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Settings
        </Button>
      </div>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="deduplication">Deduplication</TabsTrigger>
          <TabsTrigger value="quiethours">Quiet Hours</TabsTrigger>
          <TabsTrigger value="escalation">Escalation</TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Choose how you want to receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Channel */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive alerts via email</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={preferences.email_enabled}
                    onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
                  />
                </div>
                {preferences.email_enabled && (
                  <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">
                    Emails will be sent to your registered address with full alert details and recommended actions.
                  </div>
                )}
              </div>

              {/* In-App Channel */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">In-App Notifications</p>
                      <p className="text-sm text-gray-600">Show alerts in the dashboard</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={preferences.in_app_enabled}
                    onCheckedChange={(checked) => updatePreference('in_app_enabled', checked)}
                  />
                </div>
                {preferences.in_app_enabled && (
                  <div className="bg-green-50 p-3 rounded text-sm text-gray-700">
                    Alerts will appear in the notification center and as banners in the dashboard.
                  </div>
                )}
              </div>

              {/* Slack Channel */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Slack className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Slack Notifications</p>
                      <p className="text-sm text-gray-600">Send alerts to Slack channels</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={preferences.slack_enabled}
                    onCheckedChange={(checked) => updatePreference('slack_enabled', checked)}
                  />
                </div>
                {preferences.slack_enabled && (
                  <div className="bg-purple-50 p-3 rounded text-sm text-gray-700">
                    Alerts will be posted to configured Slack channels with interactive buttons for acknowledgment.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Channel Summary */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Active Channels</p>
              <div className="flex flex-wrap gap-2">
                {preferences.email_enabled && (
                  <Badge variant="default" className="gap-2">
                    <Mail className="h-3 w-3" />
                    Email
                  </Badge>
                )}
                {preferences.in_app_enabled && (
                  <Badge variant="default" className="gap-2">
                    <MessageSquare className="h-3 w-3" />
                    In-App
                  </Badge>
                )}
                {preferences.slack_enabled && (
                  <Badge variant="default" className="gap-2">
                    <Slack className="h-3 w-3" />
                    Slack
                  </Badge>
                )}
                {!preferences.email_enabled && !preferences.in_app_enabled && !preferences.slack_enabled && (
                  <Badge variant="outline">No channels enabled</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deduplication Tab */}
        <TabsContent value="deduplication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Deduplication</CardTitle>
              <CardDescription>Prevent duplicate alert notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="font-medium">Enable Deduplication</p>
                  <p className="text-sm text-gray-600">Suppress duplicate alerts within timeframe</p>
                </div>
                <Checkbox
                  checked={preferences.deduplication_enabled}
                  onCheckedChange={(checked) => updatePreference('deduplication_enabled', checked)}
                />
              </div>

              {preferences.deduplication_enabled && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Deduplication Window</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={preferences.deduplication_window_minutes}
                        onChange={(e) =>
                          updatePreference('deduplication_window_minutes', parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Same alert type within this window will be grouped
                    </p>
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-3 bg-blue-50">
                <p className="font-medium text-sm">How It Works</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Identical alerts trigger only once per window</li>
                  <li>• Duplicate count is shown in notification</li>
                  <li>• Reduces notification fatigue</li>
                  <li>• Prevents action duplication</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiet Hours Tab */}
        <TabsContent value="quiethours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>Suppress notifications during specified hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="font-medium">Enable Quiet Hours</p>
                  <p className="text-sm text-gray-600">No notifications between start and end times</p>
                </div>
                <Checkbox
                  checked={preferences.quiet_hours_enabled}
                  onCheckedChange={(checked) => updatePreference('quiet_hours_enabled', checked)}
                />
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Start Time</Label>
                      <Input
                        type="time"
                        value={preferences.quiet_hours_start}
                        onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">End Time</Label>
                      <Input
                        type="time"
                        value={preferences.quiet_hours_end}
                        onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                    ⚠️ Critical severity alerts will still be sent during quiet hours
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalation Tab */}
        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escalation Rules</CardTitle>
              <CardDescription>Automatically escalate unacknowledged alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="font-medium">Enable Escalation</p>
                  <p className="text-sm text-gray-600">Escalate alerts if not acknowledged</p>
                </div>
                <Checkbox
                  checked={preferences.escalation_enabled}
                  onCheckedChange={(checked) => updatePreference('escalation_enabled', checked)}
                />
              </div>

              {preferences.escalation_enabled && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Escalate After</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        min="5"
                        step="5"
                        value={preferences.escalation_after_minutes}
                        onChange={(e) => updatePreference('escalation_after_minutes', parseInt(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    Unacknowledged alerts will be resent with increased urgency
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      {showDialog && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Changes</DialogTitle>
              <DialogDescription>
                Apply your notification preference changes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="font-medium mb-2">Changes Summary</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>✓ {preferences.email_enabled ? 'Email enabled' : 'Email disabled'}</li>
                  <li>✓ {preferences.in_app_enabled ? 'In-app enabled' : 'In-app disabled'}</li>
                  <li>✓ {preferences.slack_enabled ? 'Slack enabled' : 'Slack disabled'}</li>
                  <li>✓ Deduplication {preferences.deduplication_enabled ? `every ${preferences.deduplication_window_minutes}m` : 'disabled'}</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
