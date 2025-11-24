'use client';

/**
 * Founder Intel Settings
 * Phase 80: Preferences configuration UI
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FounderIntelPreferences, SourceEngine } from '@/lib/founderIntel/founderIntelTypes';

const ENGINES: { key: SourceEngine; label: string }[] = [
  { key: 'agency_director', label: 'Agency Director' },
  { key: 'creative_director', label: 'Creative Director' },
  { key: 'scaling_engine', label: 'Scaling Engine' },
  { key: 'orm', label: 'ORM' },
  { key: 'alignment_engine', label: 'Alignment Engine' },
  { key: 'story_engine', label: 'Story Engine' },
  { key: 'vif', label: 'VIF' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function FounderIntelSettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<FounderIntelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/founder-intel/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/founder-intel/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_thresholds: preferences.risk_thresholds,
          opportunity_preferences: preferences.opportunity_preferences,
          briefing_schedule: preferences.briefing_schedule,
          mute_rules: preferences.mute_rules,
        }),
      });

      if (res.ok) {
        router.push('/founder/intel');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateThreshold = (engine: SourceEngine, value: number) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      risk_thresholds: {
        ...preferences.risk_thresholds,
        [engine]: value,
      },
    });
  };

  if (isLoading || !preferences) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Intelligence Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure thresholds, schedules, and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Risk Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Risk Thresholds</CardTitle>
          <CardDescription>
            Set minimum thresholds for surfacing alerts from each engine (0-1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ENGINES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm">{label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={preferences.risk_thresholds[key] || 0.5}
                  onChange={(e) => updateThreshold(key, parseFloat(e.target.value))}
                  className="w-20 text-sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Opportunity Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Opportunity Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Minimum Confidence</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={preferences.opportunity_preferences.min_confidence}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  opportunity_preferences: {
                    ...preferences.opportunity_preferences,
                    min_confidence: parseFloat(e.target.value),
                  },
                })
              }
              className="w-20 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Show Low Opportunities</Label>
            <Switch
              checked={preferences.opportunity_preferences.show_low_opportunities}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  opportunity_preferences: {
                    ...preferences.opportunity_preferences,
                    show_low_opportunities: checked,
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Highlight High Impact</Label>
            <Switch
              checked={preferences.opportunity_preferences.highlight_high_impact}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  opportunity_preferences: {
                    ...preferences.opportunity_preferences,
                    highlight_high_impact: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Briefing Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Briefing Schedule</CardTitle>
          <CardDescription>
            Configure when weekly briefings are generated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Day</Label>
            <Select
              value={preferences.briefing_schedule.weekly.day}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  briefing_schedule: {
                    ...preferences.briefing_schedule,
                    weekly: {
                      ...preferences.briefing_schedule.weekly,
                      day: value,
                    },
                  },
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day} className="capitalize">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Hour (24h)</Label>
            <Input
              type="number"
              min="0"
              max="23"
              value={preferences.briefing_schedule.weekly.hour}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  briefing_schedule: {
                    ...preferences.briefing_schedule,
                    weekly: {
                      ...preferences.briefing_schedule.weekly,
                      hour: parseInt(e.target.value),
                    },
                  },
                })
              }
              className="w-20 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Timezone</Label>
            <Input
              value={preferences.briefing_schedule.timezone}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  briefing_schedule: {
                    ...preferences.briefing_schedule,
                    timezone: e.target.value,
                  },
                })
              }
              className="w-48 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset button */}
      <Button variant="outline" onClick={loadPreferences}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset to Saved
      </Button>
    </div>
  );
}
