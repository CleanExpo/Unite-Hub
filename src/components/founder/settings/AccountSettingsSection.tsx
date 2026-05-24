'use client'

import { useState } from 'react'
import type { UserSettings } from '@/types/database'

interface AccountSettingsSectionProps {
  settings: Partial<UserSettings>
  onSave: (settings: Partial<UserSettings>) => Promise<void>
  loading: boolean
}

export function AccountSettingsSection({ settings, onSave, loading }: AccountSettingsSectionProps) {
  const [timezone, setTimezone] = useState(settings.timezone || 'Australia/Sydney')
  const [locale, setLocale] = useState(settings.locale || 'en-AU')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ timezone, locale })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-surface-elevated rounded-sm p-6">
      <h2 className="text-lg font-semibold text-color-text-primary mb-4">Account Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-color-text-muted mb-2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-surface-elevated text-color-text-primary rounded-sm px-3 py-2 border border-surface-elevated hover:border-color-text-muted focus:outline-none focus:border-cyan-400"
            disabled={loading || saving}
          >
            <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
            <option value="Australia/Melbourne">Melbourne (AEST/AEDT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-color-text-muted mb-2">Locale</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full bg-surface-elevated text-color-text-primary rounded-sm px-3 py-2 border border-surface-elevated hover:border-color-text-muted focus:outline-none focus:border-cyan-400"
            disabled={loading || saving}
          >
            <option value="en-AU">Australian English (DD/MM/YYYY)</option>
            <option value="en-US">American English (MM/DD/YYYY)</option>
          </select>
        </div>

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
