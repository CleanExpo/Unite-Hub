-- Migration: Add MFA support to users table
-- Date: 2025-05-25

-- First, check if the columns already exist to avoid errors
DO $$
BEGIN
    BEGIN
        -- Add the mfa_secret column to store the TOTP secret
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'mfa_secret') THEN
            ALTER TABLE users ADD COLUMN mfa_secret TEXT;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table users does not exist. MFA migration cannot be applied.';
    END;

    BEGIN
        -- Add the mfa_enabled column to track if MFA is enabled for the user
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'mfa_enabled') THEN
            ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table users does not exist. MFA migration cannot be applied.';
    END;

    BEGIN
        -- Add the mfa_verified column to track if MFA has been verified at least once
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'mfa_verified') THEN
            ALTER TABLE users ADD COLUMN mfa_verified BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table users does not exist. MFA migration cannot be applied.';
    END;

    BEGIN
        -- Add the mfa_backup_codes column to store recovery backup codes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'mfa_backup_codes') THEN
            ALTER TABLE users ADD COLUMN mfa_backup_codes JSONB;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table users does not exist. MFA migration cannot be applied.';
    END;

    BEGIN
        -- Add the last_mfa_login column to track when MFA was last used for login
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'last_mfa_login') THEN
            ALTER TABLE users ADD COLUMN last_mfa_login TIMESTAMP WITH TIME ZONE;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table users does not exist. MFA migration cannot be applied.';
    END;

    -- Create an index on mfa_enabled to optimize queries filtering by MFA status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_mfa_enabled') THEN
        CREATE INDEX idx_users_mfa_enabled ON users(mfa_enabled);
    END IF;

    -- Create a security audit table to track MFA-related actions
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_log') THEN
        CREATE TABLE security_audit_log (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            action TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            details JSONB
        );

        -- Add index on user_id for faster lookups
        CREATE INDEX idx_security_audit_log_user_id ON security_audit_log(user_id);
        
        -- Add index on created_at for faster time-based queries
        CREATE INDEX idx_security_audit_log_created_at ON security_audit_log(created_at);
    END IF;

END $$;

-- Add comments to document the columns
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret key for MFA authentication';
COMMENT ON COLUMN users.mfa_enabled IS 'Whether MFA is enabled for this user';
COMMENT ON COLUMN users.mfa_verified IS 'Whether MFA has been verified at least once';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Recovery backup codes for MFA (JSON array of hashed codes)';
COMMENT ON COLUMN users.last_mfa_login IS 'Timestamp of last successful MFA login';

COMMENT ON TABLE security_audit_log IS 'Security audit trail for tracking sensitive operations';
COMMENT ON COLUMN security_audit_log.user_id IS 'User ID associated with the security action';
COMMENT ON COLUMN security_audit_log.action IS 'Type of security action (e.g., "mfa_enabled", "mfa_login_success")';
COMMENT ON COLUMN security_audit_log.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN security_audit_log.user_agent IS 'User agent of the browser/device used';
COMMENT ON COLUMN security_audit_log.created_at IS 'Timestamp when the action occurred';
COMMENT ON COLUMN security_audit_log.details IS 'Additional details about the action in JSON format';
