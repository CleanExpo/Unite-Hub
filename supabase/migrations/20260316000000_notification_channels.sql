-- Extend user_settings with notification channel preferences (Slack, WhatsApp)
-- Depends on: 20260312000000_user_settings_table.sql

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS slack_webhook_url text,
  ADD COLUMN IF NOT EXISTS slack_channel text DEFAULT '#nexus-alerts',
  ADD COLUMN IF NOT EXISTS notification_slack boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_whatsapp boolean DEFAULT false;

COMMENT ON COLUMN public.user_settings.slack_webhook_url IS 'Slack Incoming Webhook URL for notification delivery';
COMMENT ON COLUMN public.user_settings.slack_channel IS 'Default Slack channel override for notifications';
COMMENT ON COLUMN public.user_settings.notification_slack IS 'Enable/disable Slack notification channel';
COMMENT ON COLUMN public.user_settings.notification_whatsapp IS 'Enable/disable WhatsApp notification channel (future)';
