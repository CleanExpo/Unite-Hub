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
  const [slack, setSlack] = useState(settings.notification_slack ?? false)
  const [slackChannel, setSlackChannel] = useState(settings.slack_channel ?? '#nexus-alerts')
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(settings.slack_webhook_url ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        notification_digest: digest,
        notification_alerts: alerts,
        notification_cases: cases,
        notification_slack: slack,
        slack_channel: slackChannel || '#nexus-alerts',
        slack_webhook_url: slackWebhookUrl || null,
        notification_whatsapp: false,
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

        {/* ── Slack Notifications ─────────────────────────────────────── */}
        <div className="border-t border-surface-elevated pt-4 mt-4">
          <h3 className="text-[13px] font-semibold text-color-text-primary mb-3">Slack Notifications</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={slack}
              onChange={(e) => setSlack(e.target.checked)}
              disabled={loading || saving}
              className="w-4 h-4 rounded-sm bg-surface-elevated border border-color-text-muted"
            />
            <span className="text-sm font-medium text-color-text-primary">Enable Slack Notifications</span>
          </label>

          {slack && (
            <div className="ml-7 mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-color-text-muted mb-1">Channel</label>
                <input
                  type="text"
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                  disabled={loading || saving}
                  placeholder="#nexus-alerts"
                  className="w-full max-w-xs px-3 py-1.5 text-[13px] bg-surface-elevated border border-color-text-muted rounded-sm text-color-text-primary placeholder:text-color-text-muted/50 focus:outline-none focus:border-[#00F5FF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-color-text-muted mb-1">Webhook URL</label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  disabled={loading || saving}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full max-w-md px-3 py-1.5 text-[13px] bg-surface-elevated border border-color-text-muted rounded-sm text-color-text-primary placeholder:text-color-text-muted/50 focus:outline-none focus:border-[#00F5FF]"
                />
              </div>
            </div>
          )}

          <p className="text-[10px] text-color-text-muted mt-2">
            Configure a Slack Incoming Webhook to receive notifications for cron completions, advisory updates, and approval alerts.
          </p>
        </div>

        {/* ── WhatsApp Notifications ──────────────────────────────────── */}
        <div className="border-t border-surface-elevated pt-4 mt-4">
          <h3 className="text-[13px] font-semibold text-color-text-primary mb-3">WhatsApp Notifications</h3>

          <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
            <input
              type="checkbox"
              checked={false}
              disabled
              className="w-4 h-4 rounded-sm bg-surface-elevated border border-color-text-muted"
            />
            <span className="text-sm font-medium text-color-text-primary">Enable WhatsApp Notifications</span>
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-surface-elevated border border-color-text-muted text-color-text-muted">
              Coming Soon
            </span>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="px-4 py-2 bg-cyan-600 text-color-text-primary rounded-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
