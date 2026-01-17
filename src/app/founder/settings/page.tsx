'use client';

/**
 * Founder Settings
 * Admin-only configuration for platform settings (Stripe, DataForSEO, SEMRush, AI modes)
 * Phase 10: Extended to support per-service mode toggles
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger-client';
import { FounderModeToggle } from '@/components/founder/FounderModeToggle';

interface PlatformMode {
  mode: 'test' | 'live';
  timestamp: string;
}

interface AuditEntry {
  changed_by: string;
  old_mode: string;
  new_mode: string;
  reason: string | null;
  changed_at: string;
}

export default function FounderSettingsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<PlatformMode | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'test' | 'live'>('test');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadPlatformMode();
  }, []);

  const loadPlatformMode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/founder/settings/platform-mode');

      if (!response.ok) {
        if (response.status === 403) {
          setError('Admin access required. Only Phill and Rana can access this setting.');
          return;
        }
        throw new Error('Failed to fetch platform mode');
      }

      const data = await response.json();
      setMode(data);
      setSelectedMode(data.mode);

      log.info('Loaded platform mode', { mode: data.mode });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      log.error('Failed to load platform mode', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMode = async () => {
    if (!mode) {
return;
}

    if (selectedMode === mode.mode) {
      setError('No changes to save. New mode is the same as current mode.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/founder/settings/platform-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          reason: reason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update platform mode');
      }

      const result = await response.json();
      setMode({
        mode: result.mode,
        timestamp: result.changedAt,
      });
      setReason('');
      setSuccess(`✅ Platform mode switched to ${selectedMode.toUpperCase()}`);

      log.info('Platform mode changed', {
        newMode: selectedMode,
        changedBy: result.changedBy,
      });

      // Reload audit history
      setTimeout(() => loadPlatformMode(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mode');
      log.error('Failed to save platform mode', { error: err });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-text-muted hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Founder Settings</h1>
            <p className="text-text-muted mt-1">Admin-only platform configuration</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-error-500/50 bg-error-500/10">
            <AlertCircle className="h-4 w-4 text-error-500" />
            <AlertDescription className="text-error-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-success-500/50 bg-success-500/10">
            <CheckCircle2 className="h-4 w-4 text-success-500" />
            <AlertDescription className="text-success-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Multi-Service Mode Toggle (Phase 10) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-info-400" />
            <h2 className="text-xl font-semibold text-white">Service Mode Controls</h2>
          </div>
          <FounderModeToggle />
        </div>

        {/* Legacy Stripe Mode Toggle Card (Deprecated - use above controls) */}
        <Card className="border-border bg-bg-raised">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Stripe Platform Mode</CardTitle>
                <CardDescription>
                  Control whether payments process in test or live mode
                </CardDescription>
              </div>
              <Badge
                variant={mode?.mode === 'live' ? 'destructive' : 'secondary'}
                className={`text-lg px-4 py-2 ${
                  mode?.mode === 'live'
                    ? 'bg-error-500/20 text-error-400 border-error-500'
                    : 'bg-info-500/20 text-info-400 border-info-500'
                }`}
              >
                {mode?.mode.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Mode Display */}
            <div className="p-4 rounded-lg bg-bg-elevated/50 border border-border">
              <p className="text-sm text-text-muted mb-2">Current Mode</p>
              <p className="text-2xl font-bold text-white">
                {mode?.mode === 'live' ? '💳 LIVE' : '🧪 TEST'}
              </p>
              <p className="text-xs text-text-tertiary mt-2">
                Last updated: {mode?.timestamp ? new Date(mode.timestamp).toLocaleString() : 'Unknown'}
              </p>
            </div>

            {/* Warning for Live Mode */}
            {mode?.mode === 'live' && (
              <Alert className="border-warning-500/50 bg-warning-500/10">
                <AlertCircle className="h-4 w-4 text-warning-500" />
                <AlertDescription className="text-warning-400">
                  ⚠️ Platform is in LIVE mode. Real payments are being processed. Use caution when switching modes.
                </AlertDescription>
              </Alert>
            )}

            {/* Mode Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-3">
                  Switch To Mode
                </label>
                <div className="flex gap-4">
                  {(['test', 'live'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMode(m)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        selectedMode === m
                          ? m === 'live'
                            ? 'bg-error-500/30 border-2 border-error-500 text-error-400'
                            : 'bg-info-500/30 border-2 border-info-500 text-info-400'
                          : 'bg-bg-elevated border-2 border-border text-text-muted hover:border-border'
                      }`}
                    >
                      {m === 'live' ? '💳 LIVE MODE' : '🧪 TEST MODE'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason (Optional) */}
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">
                  Reason for Change (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., 'Customer production launch', 'Testing environment update'"
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-white placeholder-gray-500 focus:outline-none focus:border-info-500"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveMode}
                disabled={isSaving || selectedMode === mode?.mode}
                className={`w-full font-medium py-2 ${
                  selectedMode === 'live'
                    ? 'bg-error-600 hover:bg-error-700 disabled:bg-error-600/50'
                    : 'bg-info-600 hover:bg-info-700'
                } text-white`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 inline-block mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : selectedMode === mode?.mode ? (
                  'No Changes'
                ) : (
                  <>
                    <Save className="h-4 w-4 inline-block mr-2" />
                    Confirm Mode Switch
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit History */}
        {audit.length > 0 && (
          <Card className="border-border bg-bg-raised">
            <CardHeader>
              <CardTitle className="text-white">Mode Change History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {audit.map((entry, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-bg-elevated/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="text-xs">
                          {entry.old_mode} → {entry.new_mode}
                        </Badge>
                        <span className="text-xs text-text-tertiary">
                          by {entry.changed_by?.split('@')[0] || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {new Date(entry.changed_at).toLocaleString()}
                      </span>
                    </div>
                    {entry.reason && (
                      <p className="text-sm text-text-muted">Reason: {entry.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
