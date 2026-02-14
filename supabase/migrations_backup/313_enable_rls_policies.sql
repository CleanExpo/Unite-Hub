-- Migration 313: Enable RLS and Create Policies
-- Run AFTER migration 312 completes successfully
-- All statements are idempotent

-- ============================================================
-- ENABLE RLS (idempotent - no error if already enabled)
-- ============================================================

ALTER TABLE admin_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_playbooks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DROP EXISTING POLICIES (safe - no error if not exists)
-- ============================================================

DROP POLICY IF EXISTS "Admins can view approvals" ON admin_approvals;
DROP POLICY IF EXISTS "Admins can manage trusted devices" ON admin_trusted_devices;
DROP POLICY IF EXISTS "Users can access workspace leads" ON leads;
DROP POLICY IF EXISTS "Users can access workspace clients" ON clients;
DROP POLICY IF EXISTS "Users can access client actions" ON client_actions;
DROP POLICY IF EXISTS "Users can access integrations" ON integrations;
DROP POLICY IF EXISTS "Users can access SEO credentials" ON seo_credentials;
DROP POLICY IF EXISTS "Users can access SEO profiles" ON seo_profiles;
DROP POLICY IF EXISTS "Users can access social inbox" ON social_inbox_messages;
DROP POLICY IF EXISTS "Users can access social playbooks" ON social_playbooks;

-- ============================================================
-- CREATE POLICIES
-- ============================================================

CREATE POLICY "Admins can view approvals" ON admin_approvals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage trusted devices" ON admin_trusted_devices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access workspace leads" ON leads
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access workspace clients" ON clients
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access client actions" ON client_actions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access SEO credentials" ON seo_credentials
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access SEO profiles" ON seo_profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access social inbox" ON social_inbox_messages
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access social playbooks" ON social_playbooks
  FOR ALL USING (auth.uid() IS NOT NULL);
