'use client'

import { useState } from 'react'
import type { UserSettings } from '@/types/database'

interface IntegrationSettingsSectionProps {
  settings: Partial<UserSettings>
  onSave: (settings: Partial<UserSettings>) => Promise<void>
  loading: boolean
}

export function IntegrationSettingsSection({ settings, onSave, loading }: IntegrationSettingsSectionProps) {
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState(settings.google_drive_vault_folder_id || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ google_drive_vault_folder_id: googleDriveFolderId || null })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-surface-elevated rounded-sm p-6">
      <h2 className="text-lg font-semibold text-color-text-primary mb-4">Integrations</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-color-text-muted mb-2">
            Google Drive Vault Folder ID
          </label>
          <input
            type="text"
            value={googleDriveFolderId}
            onChange={(e) => setGoogleDriveFolderId(e.target.value)}
            placeholder="Paste your Google Drive folder ID here"
            className="w-full bg-surface-elevated text-color-text-primary rounded-sm px-3 py-2 border border-surface-elevated hover:border-color-text-muted focus:outline-none focus:border-cyan-400 font-mono text-xs"
            disabled={loading || saving}
          />
          <p className="text-xs text-color-text-muted mt-2">
            Find this in your Google Drive folder URL: /drive/folders/<strong>FOLDER_ID</strong>
          </p>
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
