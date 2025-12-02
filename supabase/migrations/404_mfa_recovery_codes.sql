-- Migration 404: MFA Recovery Codes Table
-- Purpose: Store hashed recovery codes for MFA bypass
-- Security Task P2-6: MFA Implementation
-- Date: 2025-12-03

-- =====================================================
-- MFA RECOVERY CODES TABLE
-- =====================================================

-- Create recovery codes table
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(code_hash)
);

-- Add comment to table
COMMENT ON TABLE mfa_recovery_codes IS 'Stores hashed MFA recovery codes for backup authentication';

-- Add comments to columns
COMMENT ON COLUMN mfa_recovery_codes.id IS 'Unique identifier for the recovery code record';
COMMENT ON COLUMN mfa_recovery_codes.user_id IS 'Reference to the user who owns this recovery code';
COMMENT ON COLUMN mfa_recovery_codes.code_hash IS 'SHA-256 hash of the recovery code (never store plain text)';
COMMENT ON COLUMN mfa_recovery_codes.used IS 'Whether this recovery code has been used (single-use only)';
COMMENT ON COLUMN mfa_recovery_codes.created_at IS 'Timestamp when the recovery code was generated';
COMMENT ON COLUMN mfa_recovery_codes.used_at IS 'Timestamp when the recovery code was used (NULL if unused)';

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id
  ON mfa_recovery_codes(user_id);

-- Index for faster hash lookups during verification
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_hash
  ON mfa_recovery_codes(code_hash);

-- Index for unused codes lookup
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_unused
  ON mfa_recovery_codes(user_id, used)
  WHERE used = FALSE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own recovery codes
CREATE POLICY "Users can view their own recovery codes"
  ON mfa_recovery_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own recovery codes
CREATE POLICY "Users can delete their own recovery codes"
  ON mfa_recovery_codes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all recovery codes
CREATE POLICY "Service role can manage recovery codes"
  ON mfa_recovery_codes
  FOR ALL
  USING (
    -- Allow service role (for API routes)
    auth.jwt()->>'role' = 'service_role' OR
    -- Allow authenticated users for their own codes
    (auth.role() = 'authenticated' AND auth.uid() = user_id)
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically mark recovery code as used
CREATE OR REPLACE FUNCTION mark_recovery_code_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.used = TRUE AND OLD.used = FALSE THEN
    NEW.used_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update used_at timestamp
CREATE TRIGGER trigger_mark_recovery_code_used
  BEFORE UPDATE ON mfa_recovery_codes
  FOR EACH ROW
  WHEN (NEW.used = TRUE AND OLD.used = FALSE)
  EXECUTE FUNCTION mark_recovery_code_used();

-- Function to clean up old unused recovery codes (6 months)
CREATE OR REPLACE FUNCTION cleanup_old_recovery_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM mfa_recovery_codes
  WHERE used = FALSE
    AND created_at < NOW() - INTERVAL '6 months';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_recovery_codes() IS
  'Deletes unused recovery codes older than 6 months for security';

-- =====================================================
-- AUDIT LOGGING
-- =====================================================

-- Function to log recovery code usage
CREATE OR REPLACE FUNCTION log_recovery_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.used = TRUE AND OLD.used = FALSE THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      metadata,
      created_at
    ) VALUES (
      NEW.user_id,
      'mfa_recovery_code_used',
      'mfa_recovery_code',
      NEW.id::TEXT,
      jsonb_build_object(
        'code_id', NEW.id,
        'used_at', NEW.used_at
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to audit recovery code usage
CREATE TRIGGER trigger_log_recovery_code_usage
  AFTER UPDATE ON mfa_recovery_codes
  FOR EACH ROW
  WHEN (NEW.used = TRUE AND OLD.used = FALSE)
  EXECUTE FUNCTION log_recovery_code_usage();

-- =====================================================
-- SECURITY NOTES
-- =====================================================

-- IMPORTANT SECURITY CONSIDERATIONS:
--
-- 1. NEVER store recovery codes in plain text
--    - Always hash with SHA-256 or stronger
--    - Use crypto.createHash('sha256').update(code).digest('hex') in Node.js
--
-- 2. Recovery codes are SINGLE-USE only
--    - Mark as used immediately after verification
--    - Never allow reuse of codes
--
-- 3. Generate sufficient entropy
--    - Minimum 8 characters per code
--    - Use cryptographically secure random generation
--    - Example: crypto.randomBytes(4).toString('hex')
--
-- 4. Limit number of codes per user
--    - Recommend 10 codes per user
--    - Invalidate old codes when generating new set
--
-- 5. Expire unused codes
--    - Run cleanup_old_recovery_codes() periodically
--    - Recommend 6-month expiration for unused codes
--
-- 6. Audit all usage
--    - Log when codes are generated
--    - Log when codes are used
--    - Log when codes are invalidated
--
-- 7. Rate limiting
--    - Limit recovery code verification attempts
--    - Recommend 5 attempts per 15 minutes
--    - Lock account after excessive failures

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_recovery_codes TO authenticated;
GRANT ALL ON mfa_recovery_codes TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify table creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'mfa_recovery_codes'
  ) THEN
    RAISE EXCEPTION 'Table mfa_recovery_codes was not created successfully';
  END IF;

  RAISE NOTICE 'Migration 404: MFA Recovery Codes - SUCCESS';
END $$;
