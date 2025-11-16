-- Drip Campaign Tables for Email Automation (Standalone Version)
-- This version creates contacts table if it doesn't exist
-- Safe to run even if some tables already exist

-- Create contacts table if it doesn't exist (minimal version)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  job_title TEXT,
  ai_score DECIMAL(5,2) DEFAULT 0.0,
  status TEXT DEFAULT 'prospect',
  last_interaction TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now create drip campaign tables (they depend on contacts)
-- Drip Campaigns table (formerly emailSequences)
-- Note: Campaigns are workspace-level templates. Contacts enroll via campaign_enrollments table.
CREATE TABLE IF NOT EXISTS drip_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
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

-- Campaign Steps table
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

-- Campaign Enrollments table
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

-- Campaign Execution Logs table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

CREATE INDEX IF NOT EXISTS idx_drip_campaigns_workspace_id ON drip_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_status ON drip_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_is_template ON drip_campaigns(is_template);

CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON campaign_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_steps_step_number ON campaign_steps(step_number);

CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_campaign_id ON campaign_enrollments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_contact_id ON campaign_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_status ON campaign_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_next_scheduled ON campaign_enrollments(next_email_scheduled_at);

CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_campaign_id ON campaign_execution_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_enrollment_id ON campaign_execution_logs(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_contact_id ON campaign_execution_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_created_at ON campaign_execution_logs(created_at DESC);
