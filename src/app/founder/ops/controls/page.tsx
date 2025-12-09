'use client';

/**
 * Founder Control Center Tab
 * Phase D02: Founder Ops Console
 *
 * Manages automation, AI behavior, and notification settings.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  Bell,
  Zap,
  Brain,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type {
  FounderSettings,
  AIAutonomyLevel,
  AIPersonalizationLevel,
} from '@/lib/founder/founderTwinService';

export default function FounderControlsPage() {
  const { currentOrganization } = useAuth();
  const tenantId = currentOrganization?.org_id;

  const [settings, setSettings] = useState<FounderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState({
    // Synthex Automation
    synthex_automation_enabled: true,
    ai_content_generation_enabled: true,
    predictive_send_time_enabled: true,
    auto_segmentation_enabled: true,
    // Notifications
    daily_digest_enabled: true,
    weekly_report_enabled: true,
    real_time_alerts_enabled: true,
    // AI Behavior
    ai_autonomy_level: 'suggest' as AIAutonomyLevel,
    ai_learning_enabled: true,
    ai_personalization_level: 'high' as AIPersonalizationLevel,
    // Research
    research_auto_run: false,
  });

  useEffect(() => {
    if (tenantId) {
      fetchSettings();
    }
  }, [tenantId]);

  const fetchSettings = async () => {
    if (!tenantId) {
return;
}

    try {
      setLoading(true);
      const response = await fetch(`/api/founder/twin/settings?tenantId=${tenantId}`);
      const data = await response.json();

      if (data.settings) {
        setSettings(data.settings);
        setForm({
          synthex_automation_enabled: data.settings.synthex_automation_enabled,
          ai_content_generation_enabled: data.settings.ai_content_generation_enabled,
          predictive_send_time_enabled: data.settings.predictive_send_time_enabled,
          auto_segmentation_enabled: data.settings.auto_segmentation_enabled,
          daily_digest_enabled: data.settings.daily_digest_enabled,
          weekly_report_enabled: data.settings.weekly_report_enabled,
          real_time_alerts_enabled: data.settings.real_time_alerts_enabled,
          ai_autonomy_level: data.settings.ai_autonomy_level,
          ai_learning_enabled: data.settings.ai_learning_enabled,
          ai_personalization_level: data.settings.ai_personalization_level,
          research_auto_run: data.settings.research_auto_run,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!tenantId) {
return;
}

    try {
      setSaving(true);
      setSaveSuccess(false);

      const response = await fetch('/api/founder/twin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          ...form,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (key: keyof typeof form, value: unknown) => {
    setForm({ ...form, [key]: value });
  };

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Please select an organization to continue.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {saveSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">Settings saved successfully</span>
        </div>
      )}

      {/* Synthex Automation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Synthex Automation
          </CardTitle>
          <CardDescription>
            Control automated marketing features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Master Automation Switch</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable all Synthex automation features
              </p>
            </div>
            <Switch
              checked={form.synthex_automation_enabled}
              onCheckedChange={(v) => updateForm('synthex_automation_enabled', v)}
            />
          </div>

          <div className="pl-4 border-l-2 border-muted space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>AI Content Generation</Label>
                <p className="text-sm text-muted-foreground">
                  Allow AI to generate email and social content
                </p>
              </div>
              <Switch
                checked={form.ai_content_generation_enabled}
                onCheckedChange={(v) => updateForm('ai_content_generation_enabled', v)}
                disabled={!form.synthex_automation_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Predictive Send Time</Label>
                <p className="text-sm text-muted-foreground">
                  Optimize email send times based on recipient behavior
                </p>
              </div>
              <Switch
                checked={form.predictive_send_time_enabled}
                onCheckedChange={(v) => updateForm('predictive_send_time_enabled', v)}
                disabled={!form.synthex_automation_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Segmentation</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically segment audiences based on behavior
                </p>
              </div>
              <Switch
                checked={form.auto_segmentation_enabled}
                onCheckedChange={(v) => updateForm('auto_segmentation_enabled', v)}
                disabled={!form.synthex_automation_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Behavior
          </CardTitle>
          <CardDescription>
            Configure how AI agents operate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Autonomy Level</Label>
              <Select
                value={form.ai_autonomy_level}
                onValueChange={(v) => updateForm('ai_autonomy_level', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Disabled</Badge>
                      <span>No AI actions</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="suggest">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Suggest</Badge>
                      <span>AI suggests, you decide</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="confirm">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Confirm</Badge>
                      <span>AI acts, you confirm</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="autonomous">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">Autonomous</Badge>
                      <span>AI acts independently</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.ai_autonomy_level === 'disabled' && 'AI will not take any actions'}
                {form.ai_autonomy_level === 'suggest' && 'AI will suggest actions for your approval'}
                {form.ai_autonomy_level === 'confirm' && 'AI will take actions that require confirmation'}
                {form.ai_autonomy_level === 'autonomous' && 'AI will take actions without confirmation'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Personalization Level</Label>
              <Select
                value={form.ai_personalization_level}
                onValueChange={(v) => updateForm('ai_personalization_level', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How much AI adapts to your profile and preferences
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Continuous Learning</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to learn from your feedback and behavior
              </p>
            </div>
            <Switch
              checked={form.ai_learning_enabled}
              onCheckedChange={(v) => updateForm('ai_learning_enabled', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how and when you receive updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary of key metrics and actions each morning
              </p>
            </div>
            <Switch
              checked={form.daily_digest_enabled}
              onCheckedChange={(v) => updateForm('daily_digest_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Report</Label>
              <p className="text-sm text-muted-foreground">
                Comprehensive weekly performance and health report
              </p>
            </div>
            <Switch
              checked={form.weekly_report_enabled}
              onCheckedChange={(v) => updateForm('weekly_report_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Real-time Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Immediate notifications for critical events
              </p>
            </div>
            <Switch
              checked={form.real_time_alerts_enabled}
              onCheckedChange={(v) => updateForm('real_time_alerts_enabled', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Research Fabric */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Research Fabric
          </CardTitle>
          <CardDescription>
            AI-powered research automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Run Research</Label>
              <p className="text-sm text-muted-foreground">
                Automatically run research tasks in the background
              </p>
            </div>
            <Switch
              checked={form.research_auto_run}
              onCheckedChange={(v) => updateForm('research_auto_run', v)}
            />
          </div>

          {form.research_auto_run && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Auto-run research may incur additional API costs. Monitor usage in billing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
