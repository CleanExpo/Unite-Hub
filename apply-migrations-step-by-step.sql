-- STEP BY STEP migration - run each section separately to identify issues
-- Copy and run ONLY ONE section at a time

-- ============================================================================
-- SECTION 1: Fix organizations table
-- Run this first
-- ============================================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Add plan column with default (handle if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'plan'
  ) THEN
    ALTER TABLE organizations ADD COLUMN plan TEXT NOT NULL DEFAULT 'starter';
    ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check CHECK (plan IN ('starter', 'professional', 'enterprise'));
  END IF;
END $$;

-- Add status column with default (handle if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'status'
  ) THEN
    ALTER TABLE organizations ADD COLUMN status TEXT NOT NULL DEFAULT 'trial';
    ALTER TABLE organizations ADD CONSTRAINT organizations_status_check CHECK (status IN ('active', 'trial', 'cancelled'));
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: Fix contacts table
-- Run this after Section 1 succeeds
-- ============================================================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint on workspace_id + email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contacts_workspace_id_email_key'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_workspace_id_email_key UNIQUE (workspace_id, email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_industry ON contacts(industry);

-- ============================================================================
-- SECTION 3: Fix emails table
-- Run this after Section 2 succeeds
-- ============================================================================
ALTER TABLE emails ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_emails_metadata ON emails USING gin(metadata);

-- ============================================================================
-- SECTION 4: Create drip_campaigns table
-- Run this after Section 3 succeeds
-- ============================================================================
CREATE TABLE IF NOT EXISTS drip_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN ('cold_outreach', 'lead_nurture', 'onboarding', 're_engagement', 'custom')) DEFAULT 'custom',
  goal TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'archived')) DEFAULT 'draft',
  total_steps INTEGER DEFAULT 0,
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  tags TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "replied": 0, "converted": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drip_campaigns_workspace_id ON drip_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_contact_id ON drip_campaigns(contact_id);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_status ON drip_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_is_template ON drip_campaigns(is_template);

-- ============================================================================
-- SECTION 5: Create campaign_steps table
-- Run this after Section 4 succeeds
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  day_delay INTEGER DEFAULT 0,
  subject_line TEXT NOT NULL,
  preheader_text TEXT,
  email_body TEXT NOT NULL,
  email_body_html TEXT,
  cta JSONB DEFAULT '{"text": "", "url": null, "type": "button"}',
  ai_generated BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  personalization_tags TEXT[] DEFAULT '{}',
  alternatives JSONB DEFAULT '[]',
  conditional_logic JSONB,
  metrics JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "replied": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (campaign_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON campaign_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_steps_step_number ON campaign_steps(step_number);

-- ============================================================================
-- SECTION 6: Create campaign_enrollments table
-- Run this after Section 5 succeeds
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed', 'bounced')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  next_email_scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  interaction_history JSONB DEFAULT '[]',
  personalization_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_campaign_id ON campaign_enrollments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_contact_id ON campaign_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_status ON campaign_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_next_scheduled ON campaign_enrollments(next_email_scheduled_at);

-- ============================================================================
-- SECTION 7: Create campaign_execution_logs table
-- Run this after Section 6 succeeds
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES campaign_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES campaign_steps(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('email_sent', 'email_opened', 'email_clicked', 'email_replied', 'email_bounced', 'unsubscribed', 'paused', 'resumed', 'completed')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_campaign_id ON campaign_execution_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_enrollment_id ON campaign_execution_logs(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_contact_id ON campaign_execution_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_created_at ON campaign_execution_logs(created_at DESC);

-- ============================================================================
-- SECTION 8: Add triggers and RLS
-- Run this after Section 7 succeeds
-- ============================================================================

-- Triggers
DROP TRIGGER IF EXISTS update_drip_campaigns_updated_at ON drip_campaigns;
CREATE TRIGGER update_drip_campaigns_updated_at BEFORE UPDATE ON drip_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_steps_updated_at ON campaign_steps;
CREATE TRIGGER update_campaign_steps_updated_at BEFORE UPDATE ON campaign_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_enrollments_updated_at ON campaign_enrollments;
CREATE TRIGGER update_campaign_enrollments_updated_at BEFORE UPDATE ON campaign_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_execution_logs ENABLE ROW LEVEL SECURITY;

-- Drop and create policies
DROP POLICY IF EXISTS "Users can view drip campaigns" ON drip_campaigns;
CREATE POLICY "Users can view drip campaigns" ON drip_campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage drip campaigns" ON drip_campaigns;
CREATE POLICY "Service role can manage drip campaigns" ON drip_campaigns FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view campaign steps" ON campaign_steps;
CREATE POLICY "Users can view campaign steps" ON campaign_steps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage campaign steps" ON campaign_steps;
CREATE POLICY "Service role can manage campaign steps" ON campaign_steps FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view campaign enrollments" ON campaign_enrollments;
CREATE POLICY "Users can view campaign enrollments" ON campaign_enrollments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage campaign enrollments" ON campaign_enrollments;
CREATE POLICY "Service role can manage campaign enrollments" ON campaign_enrollments FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view campaign execution logs" ON campaign_execution_logs;
CREATE POLICY "Users can view campaign execution logs" ON campaign_execution_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage campaign execution logs" ON campaign_execution_logs;
CREATE POLICY "Service role can manage campaign execution logs" ON campaign_execution_logs FOR ALL USING (true);
