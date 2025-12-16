-- Migration 516: Webhook Governance Integrations (Phase E27)
-- Tenant-scoped outbound webhook endpoints and event logging

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS webhook_endpoints CASCADE;

-- Webhook endpoint status
DO $$ BEGIN
  CREATE TYPE webhook_endpoint_status AS ENUM ('active', 'inactive', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Webhook event status
DO $$ BEGIN
  CREATE TYPE webhook_event_status AS ENUM ('pending', 'delivered', 'failed', 'retrying');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Webhook event types
DO $$ BEGIN
  CREATE TYPE webhook_event_type AS ENUM (
    'contact.created',
    'contact.updated',
    'contact.deleted',
    'campaign.created',
    'campaign.updated',
    'campaign.completed',
    'email.sent',
    'email.opened',
    'email.clicked',
    'audit.event',
    'security.alert',
    'incident.created',
    'policy.triggered',
    'rate_limit.exceeded',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Webhook endpoints table
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  status webhook_endpoint_status NOT NULL DEFAULT 'active',
  secret TEXT, -- For signature verification
  events webhook_event_type[] DEFAULT '{}', -- Subscribed event types
  headers JSONB DEFAULT '{}'::jsonb, -- Custom headers
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_success INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_endpoints_tenant ON webhook_endpoints(tenant_id);
CREATE INDEX idx_webhook_endpoints_status ON webhook_endpoints(status);
CREATE INDEX idx_webhook_endpoints_tenant_status ON webhook_endpoints(tenant_id, status);

-- Webhook events table (delivery log)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type webhook_event_type NOT NULL,
  status webhook_event_status NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_endpoint ON webhook_events(endpoint_id, created_at DESC);
CREATE INDEX idx_webhook_events_tenant ON webhook_events(tenant_id, created_at DESC);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_tenant_status ON webhook_events(tenant_id, status, created_at DESC);
CREATE INDEX idx_webhook_events_retry ON webhook_events(status, next_retry_at) WHERE status = 'retrying';

-- RLS for webhook_endpoints
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_endpoints_read_own ON webhook_endpoints
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY webhook_endpoints_tenant_manage ON webhook_endpoints
  FOR ALL
  USING (tenant_id = auth.uid());

-- RLS for webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_events_read_own ON webhook_events
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY webhook_events_insert_own ON webhook_events
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY webhook_events_update_own ON webhook_events
  FOR UPDATE
  USING (tenant_id = auth.uid());

-- Drop existing functions if they exist
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_webhook_endpoint CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS send_webhook_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_webhook_event_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_webhook_statistics CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS cleanup_old_webhook_events CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function: Create webhook endpoint
CREATE OR REPLACE FUNCTION create_webhook_endpoint(
  p_tenant_id UUID,
  p_name TEXT,
  p_url TEXT,
  p_description TEXT DEFAULT NULL,
  p_secret TEXT DEFAULT NULL,
  p_events webhook_event_type[] DEFAULT '{}',
  p_headers JSONB DEFAULT '{}'::jsonb,
  p_retry_count INTEGER DEFAULT 3,
  p_timeout_seconds INTEGER DEFAULT 30,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_endpoint_id UUID;
BEGIN
  INSERT INTO webhook_endpoints (
    tenant_id,
    name,
    url,
    description,
    secret,
    events,
    headers,
    retry_count,
    timeout_seconds,
    status,
    metadata
  ) VALUES (
    p_tenant_id,
    p_name,
    p_url,
    p_description,
    p_secret,
    p_events,
    p_headers,
    p_retry_count,
    p_timeout_seconds,
    'active',
    p_metadata
  )
  RETURNING id INTO v_endpoint_id;

  RETURN v_endpoint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Send webhook event
CREATE OR REPLACE FUNCTION send_webhook_event(
  p_endpoint_id UUID,
  p_tenant_id UUID,
  p_event_type webhook_event_type,
  p_payload JSONB,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_endpoint RECORD;
BEGIN
  -- Verify endpoint exists and is active
  SELECT * INTO v_endpoint
  FROM webhook_endpoints
  WHERE id = p_endpoint_id
    AND tenant_id = p_tenant_id
    AND status = 'active';

  IF v_endpoint IS NULL THEN
    RAISE EXCEPTION 'Webhook endpoint not found or inactive';
  END IF;

  -- Check if endpoint is subscribed to this event type
  IF array_length(v_endpoint.events, 1) > 0 AND NOT (p_event_type = ANY(v_endpoint.events)) THEN
    RAISE EXCEPTION 'Endpoint not subscribed to event type: %', p_event_type;
  END IF;

  -- Create webhook event
  INSERT INTO webhook_events (
    endpoint_id,
    tenant_id,
    event_type,
    status,
    payload,
    metadata
  ) VALUES (
    p_endpoint_id,
    p_tenant_id,
    p_event_type,
    'pending',
    p_payload,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  -- Update endpoint stats
  UPDATE webhook_endpoints
  SET total_sent = total_sent + 1,
      updated_at = now()
  WHERE id = p_endpoint_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update webhook event status
CREATE OR REPLACE FUNCTION update_webhook_event_status(
  p_event_id UUID,
  p_tenant_id UUID,
  p_status webhook_event_status,
  p_response_status INTEGER DEFAULT NULL,
  p_response_body TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_event RECORD;
  v_endpoint_id UUID;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM webhook_events
  WHERE id = p_event_id
    AND tenant_id = p_tenant_id;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Webhook event not found';
  END IF;

  -- Update event
  UPDATE webhook_events
  SET status = p_status,
      response_status = COALESCE(p_response_status, response_status),
      response_body = COALESCE(p_response_body, response_body),
      error_message = COALESCE(p_error_message, error_message),
      attempt_count = attempt_count + 1,
      delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE delivered_at END,
      next_retry_at = CASE
        WHEN p_status = 'retrying' THEN now() + interval '5 minutes' * (attempt_count + 1)
        ELSE next_retry_at
      END
  WHERE id = p_event_id;

  -- Update endpoint stats
  v_endpoint_id := v_event.endpoint_id;

  IF p_status = 'delivered' THEN
    UPDATE webhook_endpoints
    SET total_success = total_success + 1,
        last_success_at = now(),
        updated_at = now()
    WHERE id = v_endpoint_id;
  ELSIF p_status = 'failed' THEN
    UPDATE webhook_endpoints
    SET total_failed = total_failed + 1,
        last_failure_at = now(),
        updated_at = now()
    WHERE id = v_endpoint_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_statistics(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_total_endpoints INTEGER;
  v_active_endpoints INTEGER;
  v_total_events INTEGER;
  v_pending_events INTEGER;
  v_delivered_events INTEGER;
  v_failed_events INTEGER;
  v_by_event_type JSONB;
  v_by_endpoint JSONB;
BEGIN
  -- Count endpoints
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active')
  INTO v_total_endpoints, v_active_endpoints
  FROM webhook_endpoints
  WHERE tenant_id = p_tenant_id;

  -- Count events
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'delivered'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO v_total_events, v_pending_events, v_delivered_events, v_failed_events
  FROM webhook_events
  WHERE tenant_id = p_tenant_id;

  -- Count by event type
  SELECT jsonb_object_agg(event_type, count)
  INTO v_by_event_type
  FROM (
    SELECT event_type::TEXT, COUNT(*) as count
    FROM webhook_events
    WHERE tenant_id = p_tenant_id
    GROUP BY event_type
  ) t;

  -- Count by endpoint
  SELECT jsonb_object_agg(endpoint_id, count)
  INTO v_by_endpoint
  FROM (
    SELECT endpoint_id::TEXT, COUNT(*) as count
    FROM webhook_events
    WHERE tenant_id = p_tenant_id
    GROUP BY endpoint_id
  ) t;

  RETURN jsonb_build_object(
    'total_endpoints', COALESCE(v_total_endpoints, 0),
    'active_endpoints', COALESCE(v_active_endpoints, 0),
    'total_events', COALESCE(v_total_events, 0),
    'pending_events', COALESCE(v_pending_events, 0),
    'delivered_events', COALESCE(v_delivered_events, 0),
    'failed_events', COALESCE(v_failed_events, 0),
    'by_event_type', COALESCE(v_by_event_type, '{}'::jsonb),
    'by_endpoint', COALESCE(v_by_endpoint, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup old webhook events
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events() RETURNS void AS $$
BEGIN
  -- Delete delivered events older than 90 days
  DELETE FROM webhook_events
  WHERE status = 'delivered'
    AND delivered_at < now() - interval '90 days';

  -- Delete failed events older than 30 days
  DELETE FROM webhook_events
  WHERE status = 'failed'
    AND created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_webhook_endpoint TO authenticated;
GRANT EXECUTE ON FUNCTION send_webhook_event TO authenticated;
GRANT EXECUTE ON FUNCTION update_webhook_event_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_webhook_statistics TO authenticated;

-- Trigger to update webhook_endpoints.updated_at
CREATE OR REPLACE FUNCTION update_webhook_endpoint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_endpoint_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_endpoint_timestamp();

COMMENT ON TABLE webhook_endpoints IS 'Tenant-scoped outbound webhook endpoints. Supports event subscriptions, retry logic, and custom headers.';
COMMENT ON TABLE webhook_events IS 'Webhook delivery log with retry tracking and response capture.';
COMMENT ON FUNCTION cleanup_old_webhook_events() IS 'Run periodically via cron to delete old webhook events. Call: SELECT cleanup_old_webhook_events();';
