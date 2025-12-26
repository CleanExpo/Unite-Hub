'use client';

/**
 * Dashboard Mode Toggle
 * Allows users to switch between Simple and Advanced dashboard modes
 * Based on Pattern 2: "There's too much I don't need yet" (4 users)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Layers, Check } from 'lucide-react';

export type DashboardMode = 'simple' | 'advanced';

export interface DashboardModeToggleProps {
  currentMode: DashboardMode;
  userId: string;
  onModeChange?: (newMode: DashboardMode) => void;
}

export function DashboardModeToggle({
  currentMode,
  userId,
  onModeChange,
}: DashboardModeToggleProps) {
  const [mode, setMode] = useState<DashboardMode>(currentMode);
  const [saving, setSaving] = useState(false);

  const handleModeChange = async (newMode: DashboardMode) => {
    if (newMode === mode) return;

    setSaving(true);

    try {
      const res = await fetch('/api/dashboard/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mode: newMode,
        }),
      });

      if (res.ok) {
        setMode(newMode);
        if (onModeChange) {
          onModeChange(newMode);
        }
        // Reload page to apply new mode
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update dashboard mode:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dashboard Mode</CardTitle>
        <CardDescription>
          Choose how much you want to see at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simple Mode */}
        <button
          onClick={() => handleModeChange('simple')}
          disabled={saving}
          className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
            mode === 'simple'
              ? 'border-accent-500 bg-accent-500/10'
              : 'border-border-base hover:border-accent-500/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                mode === 'simple' ? 'bg-accent-500 text-white' : 'bg-bg-raised text-text-secondary'
              }`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-text-primary">Simple Mode</div>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <div className="text-sm text-text-secondary">
                  Core CRM features only (Contacts, Emails, Campaigns)
                </div>
                <div className="text-xs text-text-tertiary mt-2">
                  Perfect for small businesses getting started
                </div>
              </div>
            </div>
            {mode === 'simple' && (
              <Check className="w-5 h-5 text-accent-500 flex-shrink-0" />
            )}
          </div>
        </button>

        {/* Advanced Mode */}
        <button
          onClick={() => handleModeChange('advanced')}
          disabled={saving}
          className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
            mode === 'advanced'
              ? 'border-accent-500 bg-accent-500/10'
              : 'border-border-base hover:border-accent-500/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                mode === 'advanced' ? 'bg-accent-500 text-white' : 'bg-bg-raised text-text-secondary'
              }`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-text-primary mb-1">Advanced Mode</div>
                <div className="text-sm text-text-secondary">
                  All features visible (AI Agents, Founder Tools, Analytics, Integrations)
                </div>
                <div className="text-xs text-text-tertiary mt-2">
                  For agencies and power users who want full access
                </div>
              </div>
            </div>
            {mode === 'advanced' && (
              <Check className="w-5 h-5 text-accent-500 flex-shrink-0" />
            )}
          </div>
        </button>

        {saving && (
          <div className="text-sm text-text-secondary text-center">
            Updating dashboard mode...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact mode toggle for settings page
 */
export function DashboardModeToggleCompact({
  currentMode,
  userId,
  onModeChange,
}: DashboardModeToggleProps) {
  const [mode, setMode] = useState<DashboardMode>(currentMode);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    const newMode: DashboardMode = mode === 'simple' ? 'advanced' : 'simple';

    setSaving(true);

    try {
      const res = await fetch('/api/dashboard/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mode: newMode,
        }),
      });

      if (res.ok) {
        setMode(newMode);
        if (onModeChange) {
          onModeChange(newMode);
        }
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update mode:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <div className="font-medium text-text-primary">Dashboard Mode</div>
        <div className="text-sm text-text-secondary">
          {mode === 'simple'
            ? 'Simple: Core CRM features only'
            : 'Advanced: All features visible'}
        </div>
      </div>
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={saving}
        size="sm"
      >
        {saving ? 'Updating...' : mode === 'simple' ? 'Show Advanced' : 'Show Simple'}
      </Button>
    </div>
  );
}
