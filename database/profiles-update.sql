-- Add missing fields to profiles table for compliance features
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '{"marketingEmails": false, "productUpdates": false, "newsletter": false}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_processing_preferences JSONB DEFAULT '{"analytics": false, "profiling": false, "thirdPartySharing": false}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_privacy_consent_date TIMESTAMP WITH TIME ZONE;

-- Verify the table structure
SELECT 'Profiles table updated successfully with compliance fields.' AS update_status;
