'use client'

import { useState } from 'react'
import type { UserSettings } from '@/types/database'

interface NotificationPreferencesSectionProps {
  settings: Partial<UserSettings>
  onSave: (settings: Partial<UserSettings>) => Promise<void>
  loading: boolean
}

export function NotificationPreferencesSection({ settings, onSave, loading }: NotificationPreferencesSectionProps) {
  const [digest, setDigest] = useState(settings.notification_digest ?? true)
  const [alerts, setAlerts] = useState(settings.notification_alerts ?? true)
  const [cases, setCases] = useState(settings.notification_cases ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        notification_digest: digest,
        notification_alerts: alerts,
        notification_cases: cases,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-surface-elevated rounded-sm p-6">
      <h2 className="text-lg font-semibold text-color-text-primary mb-4">Notification Preferences</h2>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={digest}
            onChange={(e) => setDigest(e.target.checked)}
            disabled={loading || saving}
            className="w-4 h-4 rounded-sm bg-surface-elevated border border-color-text-muted"
          />
          <span className="text-sm font-medium text-color-text-primary">Daily Digest Email</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={alerts}
            onChange={(e) => setAlerts(e.target.checked)}
            disabled={loading || saving}
            className="w-4 h-4 rounded-sm bg-surface-elevated border border-color-text-muted"
          />
          <span className="text-sm font-medium text-color-text-primary">Approval Alerts</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={cases}
            onChange={(e) => setCases(e.target.checked)}
            disabled={loading || saving}
            className="w-4 h-4 rounded-sm bg-surface-elevated border border-color-text-muted"
          />
          <span className="text-sm font-medium text-color-text-primary">Advisory Case Updates</span>
        </label>

        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="px-4 py-2 bg-cyan-600 text-color-text-primary rounded-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
