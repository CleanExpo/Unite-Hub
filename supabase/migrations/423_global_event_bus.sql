-- Migration 423: Global Event Bus & Audit Trail (Phase E08)
-- Unified event system for automation, webhooks, and audit logging

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS async_jobs CASCADE;
DROP TABLE IF EXISTS event_subscriptions CASCADE;
DROP TABLE IF EXISTS system_events CASCADE;

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'user.created', 'user.updated', 'user.deleted',
    'content.created', 'content.updated', 'content.published', 'content.deleted',
    'campaign.created', 'campaign.launched', 'campaign.paused', 'campaign.completed',
    'audience.segment_created', 'audience.scored',
    'automation.triggered', 'automation.completed',
    'payment.succeeded', 'payment.failed',
    'system.error', 'system.warning', 'system.info'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- System Events (global audit trail)
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  event_name TEXT NOT NULL, -- human-readable name
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- who triggered
  resource_type TEXT, -- 'campaign', 'content', 'user'
  resource_id UUID, -- ID of affected resource
  metadata JSONB DEFAULT '{}'::jsonb, -- event-specific data
  context JSONB DEFAULT '{}'::jsonb, -- request context (IP, user agent, etc.)
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_tenant ON system_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_actor ON system_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_resource ON system_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON system_events(created_at DESC);

-- RLS for system_events
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_tenant_isolation ON system_events
  FOR ALL
  USING (tenant_id = auth.uid());

-- Event Subscriptions (webhook/automation triggers)
CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_pattern TEXT NOT NULL, -- e.g., "campaign.*", "content.published"
  handler_type TEXT NOT NULL, -- 'webhook', 'automation', 'function'
  handler_config JSONB NOT NULL, -- URL, automation ID, function name
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  retry_policy JSONB DEFAULT '{"max_attempts": 3, "backoff_ms": 1000}'::jsonb,
  last_triggered_at TIMESTAMPTZ,
  total_triggers INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON event_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_pattern ON event_subscriptions(event_pattern);
CREATE INDEX IF NOT EXISTS idx_subscriptions_enabled ON event_subscriptions(enabled);

-- RLS for event_subscriptions
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_tenant_isolation ON event_subscriptions
  FOR ALL
  USING (tenant_id = auth.uid());

-- Async Job Queue (background processing)
CREATE TABLE async_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'send_email', 'generate_content', 'sync_data'
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status job_status NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 5, -- 1 (high) to 10 (low)
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON async_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON async_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON async_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON async_jobs(priority, status);

-- RLS for async_jobs
ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_tenant_isolation ON async_jobs
  FOR ALL
  USING (tenant_id = auth.uid());

-- Function: Publish event to bus
CREATE OR REPLACE FUNCTION publish_event(
  p_tenant_id UUID,
  p_event_type event_type,
  p_event_name TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_subscription RECORD;
  v_pattern_match BOOLEAN;
BEGIN
  -- Insert event
  INSERT INTO system_events (
    tenant_id,
    event_type,
    event_name,
    actor_id,
    resource_type,
    resource_id,
    metadata,
    context,
    severity
  )
  VALUES (
    p_tenant_id,
    p_event_type,
    p_event_name,
    p_actor_id,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_context,
    p_severity
  )
  RETURNING id INTO v_event_id;

  -- Trigger subscriptions (simple pattern matching)
  FOR v_subscription IN
    SELECT * FROM event_subscriptions
    WHERE tenant_id = p_tenant_id
      AND enabled = TRUE
  LOOP
    -- Check if event matches pattern
    v_pattern_match := FALSE;

    IF v_subscription.event_pattern = '*' THEN
      v_pattern_match := TRUE;
    ELSIF v_subscription.event_pattern LIKE '%*' THEN
      -- Wildcard pattern: "campaign.*" matches "campaign.created"
      v_pattern_match := p_event_type::TEXT LIKE REPLACE(v_subscription.event_pattern, '*', '%');
    ELSIF v_subscription.event_pattern = p_event_type::TEXT THEN
      v_pattern_match := TRUE;
    END IF;

    -- Queue async job if matched
    IF v_pattern_match THEN
      INSERT INTO async_jobs (
        tenant_id,
        job_type,
        payload,
        priority
      )
      VALUES (
        p_tenant_id,
        v_subscription.handler_type,
        jsonb_build_object(
          'subscription_id', v_subscription.id,
          'event_id', v_event_id,
          'event_type', p_event_type,
          'handler_config', v_subscription.handler_config,
          'event_metadata', p_metadata
        ),
        3 -- High priority for event handlers
      );

      -- Update subscription stats
      UPDATE event_subscriptions
      SET
        last_triggered_at = now(),
        total_triggers = total_triggers + 1,
        updated_at = now()
      WHERE id = v_subscription.id;
    END IF;
  END LOOP;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Queue async job
CREATE OR REPLACE FUNCTION queue_job(
  p_tenant_id UUID,
  p_job_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_priority INTEGER DEFAULT 5,
  p_scheduled_for TIMESTAMPTZ DEFAULT now(),
  p_max_retries INTEGER DEFAULT 3
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO async_jobs (
    tenant_id,
    job_type,
    payload,
    priority,
    scheduled_for,
    max_retries
  )
  VALUES (
    p_tenant_id,
    p_job_type,
    p_payload,
    p_priority,
    p_scheduled_for,
    p_max_retries
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get next job to process (FIFO queue)
CREATE OR REPLACE FUNCTION get_next_job(
  p_worker_id TEXT DEFAULT 'default'
) RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  job_type TEXT,
  payload JSONB,
  retry_count INTEGER,
  max_retries INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE async_jobs
  SET
    status = 'running',
    started_at = now(),
    updated_at = now()
  WHERE async_jobs.id = (
    SELECT async_jobs.id
    FROM async_jobs
    WHERE status = 'queued'
      AND scheduled_for <= now()
    ORDER BY priority ASC, scheduled_for ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    async_jobs.id,
    async_jobs.tenant_id,
    async_jobs.job_type,
    async_jobs.payload,
    async_jobs.retry_count,
    async_jobs.max_retries;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark job as completed
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE async_jobs
  SET
    status = 'completed',
    completed_at = now(),
    result = p_result,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark job as failed
CREATE OR REPLACE FUNCTION fail_job(
  p_job_id UUID,
  p_error_message TEXT,
  p_retry BOOLEAN DEFAULT TRUE
) RETURNS VOID AS $$
DECLARE
  v_job RECORD;
BEGIN
  SELECT * INTO v_job FROM async_jobs WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Retry if attempts remaining
  IF p_retry AND v_job.retry_count < v_job.max_retries THEN
    UPDATE async_jobs
    SET
      status = 'queued',
      retry_count = retry_count + 1,
      error_message = p_error_message,
      scheduled_for = now() + (retry_count * interval '5 minutes'), -- exponential backoff
      updated_at = now()
    WHERE id = p_job_id;
  ELSE
    -- Max retries exceeded
    UPDATE async_jobs
    SET
      status = 'failed',
      error_message = p_error_message,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION publish_event TO authenticated;
GRANT EXECUTE ON FUNCTION queue_job TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_job TO authenticated;
GRANT EXECUTE ON FUNCTION complete_job TO authenticated;
GRANT EXECUTE ON FUNCTION fail_job TO authenticated;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_event_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_subscriptions_updated_at
  BEFORE UPDATE ON event_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_event_subscriptions_timestamp();

CREATE OR REPLACE FUNCTION update_async_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER async_jobs_updated_at
  BEFORE UPDATE ON async_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_async_jobs_timestamp();
