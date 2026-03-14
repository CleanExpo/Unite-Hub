-- webhook_events: dedup/audit table for inbound webhook events
-- Prevents duplicate processing when Meta/Paperclip retries failed deliveries
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     text NOT NULL CHECK (provider IN ('whatsapp', 'paperclip')),
  event_id     text NOT NULL,
  event_type   text NOT NULL,
  payload      jsonb NOT NULL DEFAULT '{}',
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  attempts     integer NOT NULL DEFAULT 0,
  error        text,
  processed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_dedup
  ON public.webhook_events (provider, event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events (status, created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON public.webhook_events;
CREATE POLICY "service_role_full_access" ON public.webhook_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS webhook_events_updated_at ON public.webhook_events;
CREATE TRIGGER webhook_events_updated_at
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
