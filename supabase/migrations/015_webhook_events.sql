-- Webhook Events Tracking Table
-- Used for idempotency protection in Stripe webhook processing

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processed', 'failed', 'pending')),
  error_message TEXT,
  raw_event JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure expected columns exist when table already exists (safe re-apply on legacy schemas)
ALTER TABLE IF EXISTS webhook_events
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS raw_event JSONB,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_stripe_event ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_created ON webhook_events(created_at DESC);
-- Cleanup function for old webhook events (retention: 90 days)
CREATE OR REPLACE FUNCTION delete_old_webhook_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM webhook_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;
-- Grant permissions (webhooks don't use RLS - they're system-level)
GRANT ALL ON webhook_events TO service_role;
GRANT SELECT ON webhook_events TO authenticated;
-- Comments
COMMENT ON TABLE webhook_events IS 'Tracks Stripe webhook events for idempotency protection';
COMMENT ON COLUMN webhook_events.stripe_event_id IS 'Unique Stripe event ID (prevents duplicate processing)';
COMMENT ON COLUMN webhook_events.status IS 'Processing status: pending, processed, or failed';
COMMENT ON COLUMN webhook_events.raw_event IS 'Full webhook event payload for debugging';
COMMENT ON COLUMN webhook_events.error_message IS 'Error details if processing failed';
