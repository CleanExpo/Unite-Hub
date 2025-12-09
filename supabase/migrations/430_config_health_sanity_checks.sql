-- Migration 430: Config Health & Sanity Checks (Phase E15)
-- Automated health monitoring for Unite-Hub + Synthex configurations

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS config_check_results CASCADE;
DROP TABLE IF EXISTS config_checks CASCADE;

-- Check status enum
DO $$ BEGIN
  CREATE TYPE config_check_status AS ENUM ('pass', 'warn', 'fail');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Check severity enum
DO $$ BEGIN
  CREATE TYPE config_check_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Config Checks table (global check definitions)
CREATE TABLE config_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- e.g., 'env.anthropic_api_key', 'dns.domain_configured'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'environment', 'dns', 'webhooks', 'integrations', 'security'
  severity config_check_severity NOT NULL DEFAULT 'medium',
  check_function TEXT, -- Optional: name of function to execute for check
  expected_value TEXT, -- Optional: expected value or pattern
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_config_checks_key ON config_checks(key);
CREATE INDEX idx_config_checks_category ON config_checks(category);
CREATE INDEX idx_config_checks_severity ON config_checks(severity);

-- Config Check Results table (tenant-scoped results)
CREATE TABLE config_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID NOT NULL REFERENCES config_checks(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global/system check
  status config_check_status NOT NULL,
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_config_check_results_check ON config_check_results(check_id);
CREATE INDEX idx_config_check_results_tenant ON config_check_results(tenant_id);
CREATE INDEX idx_config_check_results_status ON config_check_results(status);
CREATE INDEX idx_config_check_results_checked_at ON config_check_results(checked_at DESC);
CREATE INDEX idx_config_check_results_tenant_check ON config_check_results(tenant_id, check_id);

-- RLS for config_checks (everyone can read, admins can write)
ALTER TABLE config_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_checks_read_all ON config_checks
  FOR SELECT
  USING (TRUE);

CREATE POLICY config_checks_admin_write ON config_checks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- RLS for config_check_results (tenants see their own)
ALTER TABLE config_check_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_check_results_read_own ON config_check_results
  FOR SELECT
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY config_check_results_system_write ON config_check_results
  FOR INSERT
  WITH CHECK (TRUE); -- Allow system to insert results

-- Function: Record check result
CREATE OR REPLACE FUNCTION record_check_result(
  p_check_key TEXT,
  p_tenant_id UUID,
  p_status config_check_status,
  p_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_check_id UUID;
  v_result_id UUID;
BEGIN
  -- Get check ID
  SELECT id INTO v_check_id
  FROM config_checks
  WHERE key = p_check_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Check not found: %', p_check_key;
  END IF;

  -- Insert result
  INSERT INTO config_check_results (
    check_id,
    tenant_id,
    status,
    message,
    details
  ) VALUES (
    v_check_id,
    p_tenant_id,
    p_status,
    p_message,
    p_details
  )
  RETURNING id INTO v_result_id;

  RETURN v_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get latest results for tenant
CREATE OR REPLACE FUNCTION get_latest_check_results(
  p_tenant_id UUID
) RETURNS TABLE(
  check_key TEXT,
  check_name TEXT,
  category TEXT,
  severity config_check_severity,
  status config_check_status,
  message TEXT,
  checked_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (c.key)
    c.key,
    c.name,
    c.category,
    c.severity,
    r.status,
    r.message,
    r.checked_at
  FROM config_checks c
  LEFT JOIN config_check_results r ON r.check_id = c.id
    AND (r.tenant_id = p_tenant_id OR r.tenant_id IS NULL)
  WHERE c.enabled = TRUE
  ORDER BY c.key, r.checked_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get health summary
CREATE OR REPLACE FUNCTION get_health_summary(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_pass_count INTEGER;
  v_warn_count INTEGER;
  v_fail_count INTEGER;
  v_critical_fail_count INTEGER;
  v_total_checks INTEGER;
BEGIN
  -- Count latest results by status
  WITH latest_results AS (
    SELECT DISTINCT ON (c.id)
      c.id,
      c.severity,
      r.status
    FROM config_checks c
    LEFT JOIN config_check_results r ON r.check_id = c.id
      AND (r.tenant_id = p_tenant_id OR r.tenant_id IS NULL)
    WHERE c.enabled = TRUE
    ORDER BY c.id, r.checked_at DESC NULLS LAST
  )
  SELECT
    COUNT(*) FILTER (WHERE status = 'pass'),
    COUNT(*) FILTER (WHERE status = 'warn'),
    COUNT(*) FILTER (WHERE status = 'fail'),
    COUNT(*) FILTER (WHERE status = 'fail' AND severity = 'critical'),
    COUNT(*)
  INTO v_pass_count, v_warn_count, v_fail_count, v_critical_fail_count, v_total_checks
  FROM latest_results;

  RETURN jsonb_build_object(
    'total_checks', v_total_checks,
    'pass_count', COALESCE(v_pass_count, 0),
    'warn_count', COALESCE(v_warn_count, 0),
    'fail_count', COALESCE(v_fail_count, 0),
    'critical_fail_count', COALESCE(v_critical_fail_count, 0),
    'health_score', CASE
      WHEN v_total_checks = 0 THEN 100
      ELSE ROUND((COALESCE(v_pass_count, 0)::NUMERIC / v_total_checks) * 100)
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_check_result TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_check_results TO authenticated;
GRANT EXECUTE ON FUNCTION get_health_summary TO authenticated;

-- Seed default checks
INSERT INTO config_checks (key, name, description, category, severity)
VALUES
  -- Environment checks
  ('env.anthropic_api_key', 'Anthropic API Key', 'Claude API key is configured', 'environment', 'critical'),
  ('env.supabase_url', 'Supabase URL', 'Supabase project URL is set', 'environment', 'critical'),
  ('env.supabase_anon_key', 'Supabase Anon Key', 'Supabase anonymous key is set', 'environment', 'critical'),
  ('env.nextauth_url', 'NextAuth URL', 'Authentication callback URL configured', 'environment', 'high'),
  ('env.nextauth_secret', 'NextAuth Secret', 'Session encryption key is set', 'environment', 'critical'),

  -- Integration checks
  ('integration.google_oauth', 'Google OAuth', 'Google OAuth credentials configured', 'integrations', 'medium'),
  ('integration.sendgrid', 'SendGrid Email', 'SendGrid API key configured', 'integrations', 'medium'),
  ('integration.stripe', 'Stripe Payments', 'Stripe keys configured', 'integrations', 'high'),

  -- DNS checks
  ('dns.domain_configured', 'Domain Configuration', 'Custom domain is properly configured', 'dns', 'medium'),
  ('dns.ssl_certificate', 'SSL Certificate', 'Valid SSL certificate installed', 'dns', 'high'),

  -- Security checks
  ('security.rls_enabled', 'Row Level Security', 'RLS enabled on all tables', 'security', 'critical'),
  ('security.cors_configured', 'CORS Configuration', 'CORS headers properly configured', 'security', 'high'),
  ('security.rate_limiting', 'Rate Limiting', 'Rate limiting is active', 'security', 'high'),

  -- Webhook checks
  ('webhook.stripe_configured', 'Stripe Webhooks', 'Stripe webhook endpoints configured', 'webhooks', 'medium'),
  ('webhook.github_configured', 'GitHub Webhooks', 'GitHub webhooks configured (if used)', 'webhooks', 'low'),

  -- Database checks
  ('database.connections', 'Database Connections', 'Database connection pool healthy', 'database', 'high'),
  ('database.storage_space', 'Database Storage', 'Sufficient storage space available', 'database', 'medium'),
  ('database.backup_configured', 'Database Backups', 'Automated backups configured', 'database', 'high')
ON CONFLICT (key) DO NOTHING;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_config_checks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER config_checks_updated_at
  BEFORE UPDATE ON config_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_config_checks_timestamp();

-- Auto-cleanup old results (keep last 30 days per check)
CREATE OR REPLACE FUNCTION cleanup_old_check_results()
RETURNS void AS $$
BEGIN
  DELETE FROM config_check_results
  WHERE checked_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
