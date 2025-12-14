-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Ensure uuid_generate_v4() is resolvable from public schema for later migrations.
-- Supabase may install extensions into the "extensions" schema, while migrations run with search_path=public.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'uuid_generate_v4'
      AND p.pronargs = 0
  ) AND EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'extensions'
      AND p.proname = 'uuid_generate_v4'
      AND p.pronargs = 0
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.uuid_generate_v4()
      RETURNS uuid
      LANGUAGE sql
      VOLATILE
      AS $body$SELECT extensions.uuid_generate_v4();$body$;
    $fn$;
  END IF;
END $$;
-- Forward-compat guard: some existing remote schemas may have a legacy `projects` table
-- without the `priority` column required by later migrations (e.g., 002_*).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'projects'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'priority'
    ) THEN
      EXECUTE $ddl$
        ALTER TABLE public.projects
          ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
          CHECK (priority IN ('high', 'medium', 'low'));
      $ddl$;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'due_date'
    ) THEN
      EXECUTE $ddl$
        ALTER TABLE public.projects
          ADD COLUMN due_date DATE;
      $ddl$;
    END IF;
  END IF;
END $$;
-- Forward-compat guard: existing remote schemas may have legacy Guardian/CRM tables that predate
-- newer columns referenced by later migrations (e.g., 002_* indexes).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'project_milestones'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_milestones'
      AND column_name = 'order_index'
  ) THEN
    EXECUTE $ddl$
      ALTER TABLE public.project_milestones
        ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
    $ddl$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'approvals'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'approvals'
        AND column_name = 'project_id'
    ) THEN
      EXECUTE $ddl$
        ALTER TABLE public.approvals
          ADD COLUMN project_id UUID;
      $ddl$;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'approvals'
        AND column_name = 'priority'
    ) THEN
      EXECUTE $ddl$
        ALTER TABLE public.approvals
          ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';
      $ddl$;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'approvals'
        AND column_name = 'created_at'
    ) THEN
      EXECUTE $ddl$
        ALTER TABLE public.approvals
          ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      $ddl$;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'project_messages'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_messages'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE $ddl$
      ALTER TABLE public.project_messages
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    $ddl$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'intake_submissions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'intake_submissions'
        AND column_name = 'status'
    ) THEN
      EXECUTE $ddl$
        ALTER TABLE public.intake_submissions
          ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
      $ddl$;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'intake_submissions'
        AND column_name = 'created_at'
    ) THEN
      EXECUTE $ddl$
        ALTER TABLE public.intake_submissions
          ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      $ddl$;
    END IF;
  END IF;
END $$;
-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  team_size TEXT,
  industry TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
  status TEXT NOT NULL CHECK (status IN ('active', 'trial', 'cancelled')) DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  job_title TEXT,
  ai_score DECIMAL(3,2) DEFAULT 0.0 CHECK (ai_score >= 0 AND ai_score <= 1),
  status TEXT NOT NULL CHECK (status IN ('prospect', 'lead', 'customer', 'contact')) DEFAULT 'prospect',
  last_interaction TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  ai_summary TEXT,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Generated Content table
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('followup', 'proposal', 'case_study')),
  generated_text TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'sent')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'paused')) DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  agent TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  error_message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ai_score ON contacts(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_emails_workspace_id ON emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_is_processed ON emails(is_processed);
CREATE INDEX IF NOT EXISTS idx_generated_content_workspace_id ON generated_content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_contact_id ON generated_content(contact_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);
-- NOTE: audit_logs.org_id no longer exists in production. Prefer workspace_id when present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'workspace_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON audit_logs(workspace_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'update_organizations_updated_at'
      AND c.relname = 'organizations'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'update_workspaces_updated_at'
      AND c.relname = 'workspaces'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'update_contacts_updated_at'
      AND c.relname = 'contacts'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'update_emails_updated_at'
      AND c.relname = 'emails'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'update_generated_content_updated_at'
      AND c.relname = 'generated_content'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'update_campaigns_updated_at'
      AND c.relname = 'campaigns'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
END $$;
-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- RLS Policies (basic - can be customized based on auth requirements)
-- Note: These policies assume you'll use service role key for server-side operations
-- For client-side access, you'll need more specific policies based on user authentication

-- Organizations: Users can read/update their own organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Users can view their organizations'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view their organizations" ON organizations
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Service role can manage organizations'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage organizations" ON organizations
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
-- Workspaces: Users can access workspaces in their organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
      AND policyname = 'Users can view workspaces'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view workspaces" ON workspaces
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
      AND policyname = 'Service role can manage workspaces'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage workspaces" ON workspaces
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
-- Contacts: Users can access contacts in their workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts'
      AND policyname = 'Users can view contacts'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view contacts" ON contacts
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts'
      AND policyname = 'Service role can manage contacts'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage contacts" ON contacts
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
-- Emails: Users can access emails in their workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'emails'
      AND policyname = 'Users can view emails'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view emails" ON emails
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'emails'
      AND policyname = 'Service role can manage emails'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage emails" ON emails
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
-- Generated Content: Users can access content in their workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'generated_content'
      AND policyname = 'Users can view generated content'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view generated content" ON generated_content
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'generated_content'
      AND policyname = 'Service role can manage generated content'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage generated content" ON generated_content
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
-- Campaigns: Users can access campaigns in their workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaigns'
      AND policyname = 'Users can view campaigns'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view campaigns" ON campaigns
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaigns'
      AND policyname = 'Service role can manage campaigns'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage campaigns" ON campaigns
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
-- Audit Logs: Users can view audit logs for their organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'Users can view audit logs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view audit logs" ON audit_logs
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'Service role can manage audit logs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage audit logs" ON audit_logs
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
