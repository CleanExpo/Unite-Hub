/**
 * Migration 485: Session & Device Security (Phase E5)
 *
 * Session management and device tracking:
 * - User sessions with IP/user-agent tracking
 * - Trusted devices for MFA foundation
 * - Session revocation support
 *
 * Related to: E-Series Security & Governance Foundation
 */

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  last_seen_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Trusted Devices
CREATE TABLE IF NOT EXISTS trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_fingerprint text NOT NULL,
  last_used_at timestamptz DEFAULT now(),
  is_trusted boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT trusted_devices_user_fingerprint UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their sessions" ON user_sessions;
CREATE POLICY "Users can view their sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their devices" ON trusted_devices;
CREATE POLICY "Users can view their devices"
  ON trusted_devices FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP TRIGGER IF EXISTS update_user_sessions_last_seen ON user_sessions;

CREATE OR REPLACE FUNCTION update_user_sessions_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_last_seen
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_last_seen();
