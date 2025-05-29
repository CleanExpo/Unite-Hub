-- Migration: Add GDPR/CCPA compliance features
-- Date: 2025-05-25

-- First, check if the tables/columns already exist to avoid errors
DO $$
BEGIN
    -- 1. Add consent management table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
        CREATE TABLE user_consents (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            consent_type VARCHAR(50) NOT NULL,
            consented BOOLEAN NOT NULL DEFAULT FALSE,
            consent_version VARCHAR(20) NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add indexes
        CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
        CREATE INDEX idx_user_consents_consent_type ON user_consents(consent_type);
    END IF;

    -- 2. Add cookie consents table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cookie_consents') THEN
        CREATE TABLE cookie_consents (
            id SERIAL PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id UUID,
            necessary BOOLEAN NOT NULL DEFAULT TRUE,
            preferences BOOLEAN NOT NULL DEFAULT FALSE,
            analytics BOOLEAN NOT NULL DEFAULT FALSE,
            marketing BOOLEAN NOT NULL DEFAULT FALSE,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add indexes
        CREATE INDEX idx_cookie_consents_session_id ON cookie_consents(session_id);
        CREATE INDEX idx_cookie_consents_user_id ON cookie_consents(user_id);
    END IF;

    -- 3. Add data deletion requests table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_deletion_requests') THEN
        CREATE TABLE data_deletion_requests (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            request_type VARCHAR(50) NOT NULL, -- 'partial' or 'full'
            status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'denied'
            request_reason TEXT,
            data_categories JSONB, -- For partial deletion, which categories to delete
            admin_notes TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
        );

        -- Add indexes
        CREATE INDEX idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
        CREATE INDEX idx_data_deletion_requests_status ON data_deletion_requests(status);
    END IF;

    -- 4. Add data export requests table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_export_requests') THEN
        CREATE TABLE data_export_requests (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            export_format VARCHAR(20) NOT NULL DEFAULT 'json', -- 'json', 'csv', 'pdf'
            status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
            data_categories JSONB, -- Which categories to export
            download_url TEXT,
            download_expiry TIMESTAMP WITH TIME ZONE,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
        );

        -- Add indexes
        CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
        CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);
    END IF;

    -- 5. Add privacy settings to users table
    BEGIN
        -- Add the communication_preferences column to store user preferences
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'communication_preferences') THEN
            ALTER TABLE users ADD COLUMN communication_preferences JSONB DEFAULT '{"marketing_emails": false, "product_updates": false, "newsletter": false}';
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table users does not exist. Privacy settings migration cannot be applied.';
    END;

    BEGIN
        -- Add the data_processing_preferences column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'data_processing_preferences') THEN
            ALTER TABLE users ADD COLUMN data_processing_preferences JSONB DEFAULT '{"analytics": false, "profiling": false, "third_party_sharing": false}';
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table users does not exist. Privacy settings migration cannot be applied.';
    END;

    BEGIN
        -- Add the last_privacy_consent_date column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'last_privacy_consent_date') THEN
            ALTER TABLE users ADD COLUMN last_privacy_consent_date TIMESTAMP WITH TIME ZONE;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table users does not exist. Privacy settings migration cannot be applied.';
    END;

    -- 6. Create audit trail for compliance-related actions
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_audit_log') THEN
        CREATE TABLE compliance_audit_log (
            id SERIAL PRIMARY KEY,
            user_id UUID,
            action_type VARCHAR(50) NOT NULL,
            action_details JSONB NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            admin_id UUID, -- If action was performed by an admin
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add indexes
        CREATE INDEX idx_compliance_audit_log_user_id ON compliance_audit_log(user_id);
        CREATE INDEX idx_compliance_audit_log_action_type ON compliance_audit_log(action_type);
        CREATE INDEX idx_compliance_audit_log_created_at ON compliance_audit_log(created_at);
    END IF;

    -- 7. Create privacy policy versions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'privacy_policy_versions') THEN
        CREATE TABLE privacy_policy_versions (
            id SERIAL PRIMARY KEY,
            version VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT FALSE,
            published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add unique constraint on version
        ALTER TABLE privacy_policy_versions 
        ADD CONSTRAINT unique_privacy_policy_version UNIQUE (version);
    END IF;

    -- 8. Create terms of service versions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'terms_of_service_versions') THEN
        CREATE TABLE terms_of_service_versions (
            id SERIAL PRIMARY KEY,
            version VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT FALSE,
            published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add unique constraint on version
        ALTER TABLE terms_of_service_versions 
        ADD CONSTRAINT unique_terms_of_service_version UNIQUE (version);
    END IF;

    -- 9. Create user agreements tracking table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_agreements') THEN
        CREATE TABLE user_agreements (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            agreement_type VARCHAR(50) NOT NULL, -- 'privacy_policy', 'terms_of_service', etc.
            version VARCHAR(20) NOT NULL,
            agreed BOOLEAN NOT NULL DEFAULT TRUE,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add indexes
        CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);
        CREATE INDEX idx_user_agreements_agreement_type ON user_agreements(agreement_type);
    END IF;

END $$;

-- Add comments to document the tables and columns
COMMENT ON TABLE user_consents IS 'Stores user consent records for GDPR/CCPA compliance';
COMMENT ON COLUMN user_consents.consent_type IS 'Type of consent (e.g., marketing, analytics, profiling)';
COMMENT ON COLUMN user_consents.consent_version IS 'Version of the consent form when user consented';

COMMENT ON TABLE cookie_consents IS 'Tracks user consent for different cookie categories';
COMMENT ON COLUMN cookie_consents.necessary IS 'Consent for necessary cookies (always true)';
COMMENT ON COLUMN cookie_consents.preferences IS 'Consent for preference/functionality cookies';
COMMENT ON COLUMN cookie_consents.analytics IS 'Consent for analytics cookies';
COMMENT ON COLUMN cookie_consents.marketing IS 'Consent for marketing/advertising cookies';

COMMENT ON TABLE data_deletion_requests IS 'Tracks user requests for data deletion (right to be forgotten)';
COMMENT ON COLUMN data_deletion_requests.request_type IS 'Whether user requested partial or full deletion';
COMMENT ON COLUMN data_deletion_requests.data_categories IS 'For partial deletion, which data categories to delete';

COMMENT ON TABLE data_export_requests IS 'Tracks user requests for data export (data portability)';
COMMENT ON COLUMN data_export_requests.export_format IS 'Format for the exported data';
COMMENT ON COLUMN data_export_requests.data_categories IS 'Categories of data to include in export';
COMMENT ON COLUMN data_export_requests.download_url IS 'Temporary URL for downloading exported data';
COMMENT ON COLUMN data_export_requests.download_expiry IS 'When the download URL expires';

COMMENT ON COLUMN users.communication_preferences IS 'User preferences for different types of communications';
COMMENT ON COLUMN users.data_processing_preferences IS 'User preferences for how their data can be processed';
COMMENT ON COLUMN users.last_privacy_consent_date IS 'When the user last consented to the privacy policy';

COMMENT ON TABLE compliance_audit_log IS 'Audit trail for compliance-related actions for regulatory requirements';
COMMENT ON COLUMN compliance_audit_log.action_type IS 'Type of compliance action performed';
COMMENT ON COLUMN compliance_audit_log.action_details IS 'Details of the compliance action';

COMMENT ON TABLE privacy_policy_versions IS 'Stores versions of privacy policy documents';
COMMENT ON COLUMN privacy_policy_versions.version IS 'Version identifier for the privacy policy';
COMMENT ON COLUMN privacy_policy_versions.active IS 'Whether this is the current active privacy policy';

COMMENT ON TABLE terms_of_service_versions IS 'Stores versions of terms of service documents';
COMMENT ON COLUMN terms_of_service_versions.version IS 'Version identifier for the terms of service';
COMMENT ON COLUMN terms_of_service_versions.active IS 'Whether this is the current active terms of service';

COMMENT ON TABLE user_agreements IS 'Tracks user agreement to privacy policy, terms of service, etc.';
COMMENT ON COLUMN user_agreements.agreement_type IS 'Type of agreement (privacy policy, terms of service, etc.)';
COMMENT ON COLUMN user_agreements.version IS 'Version of the agreement document that user agreed to';
