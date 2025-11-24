'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Save } from 'lucide-react';
import type {
  AutopilotPreferences,
  AutomationProfile,
  DomainLevel,
  ActionCategory
} from '@/lib/autopilot';

interface AutopilotPreferencesEditorProps {
  preferences: AutopilotPreferences | null;
  onSave: (preferences: Partial<AutopilotPreferences>) => Promise<void>;
}

const CATEGORIES: ActionCategory[] = [
  'risk',
  'optimisation',
  'creative',
  'scaling',
  'reporting',
  'outreach',
  'retention',
  'financial',
];

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  risk: 'Risk Management',
  optimisation: 'Optimisation',
  creative: 'Creative',
  scaling: 'Scaling',
  reporting: 'Reporting',
  outreach: 'Outreach',
  retention: 'Retention',
  financial: 'Financial',
};

export function AutopilotPreferencesEditor({
  preferences,
  onSave
}: AutopilotPreferencesEditorProps) {
  const [profile, setProfile] = useState<AutomationProfile>(
    preferences?.automationProfile || 'conservative'
  );
  const [domainLevels, setDomainLevels] = useState<Record<string, DomainLevel>>(
    preferences?.domainLevels || {}
  );
  const [notifyOnAuto, setNotifyOnAuto] = useState(
    preferences?.schedulePrefs?.notifyOnAutoExecute ?? true
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        automationProfile: profile,
        domainLevels,
        schedulePrefs: {
          ...preferences?.schedulePrefs,
          notifyOnAutoExecute: notifyOnAuto,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDomainChange = (category: string, level: DomainLevel) => {
    setDomainLevels(prev => ({
      ...prev,
      [category]: level,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Autopilot Preferences
        </CardTitle>
        <CardDescription>
          Configure how the autopilot handles different types of actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Automation Profile */}
        <div className="space-y-2">
          <Label>Automation Profile</Label>
          <Select value={profile} onValueChange={(v) => setProfile(v as AutomationProfile)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off - All actions require approval</SelectItem>
              <SelectItem value="conservative">Conservative - Only low-risk auto-executes</SelectItem>
              <SelectItem value="balanced">Balanced - Low & medium risk can auto-execute</SelectItem>
              <SelectItem value="aggressive">Aggressive - Most actions auto-execute</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Domain-Level Controls */}
        <div className="space-y-4">
          <Label>Domain-Level Controls</Label>
          <p className="text-sm text-muted-foreground">
            Override automation profile for specific categories
          </p>

          <div className="grid gap-3">
            {CATEGORIES.map((category) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm">{CATEGORY_LABELS[category]}</span>
                <Select
                  value={domainLevels[category] || 'auto'}
                  onValueChange={(v) => handleDomainChange(category, v as DomainLevel)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="suggest">Suggest Only</SelectItem>
                    <SelectItem value="approval_only">Approval Only</SelectItem>
                    <SelectItem value="auto">Auto (use profile)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notify on Auto-Execute</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when actions are automatically executed
            </p>
          </div>
          <Switch
            checked={notifyOnAuto}
            onCheckedChange={setNotifyOnAuto}
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
}
