-- ============================================================
-- RLS Policies — Nexus 2.0
-- Pattern: founder_id = auth.uid() (single-tenant)
-- Date: 09/03/2026
-- ============================================================

-- Enable RLS on all 9 tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_projects ENABLE ROW LEVEL SECURITY;

-- BUSINESSES
CREATE POLICY "businesses_select" ON businesses FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "businesses_insert" ON businesses FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "businesses_update" ON businesses FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "businesses_delete" ON businesses FOR DELETE USING (founder_id = auth.uid());

-- CONTACTS
CREATE POLICY "contacts_select" ON contacts FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "contacts_insert" ON contacts FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "contacts_update" ON contacts FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "contacts_delete" ON contacts FOR DELETE USING (founder_id = auth.uid());

-- NEXUS_PAGES
CREATE POLICY "nexus_pages_select" ON nexus_pages FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "nexus_pages_insert" ON nexus_pages FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_pages_update" ON nexus_pages FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_pages_delete" ON nexus_pages FOR DELETE USING (founder_id = auth.uid());

-- NEXUS_DATABASES
CREATE POLICY "nexus_databases_select" ON nexus_databases FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "nexus_databases_insert" ON nexus_databases FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_databases_update" ON nexus_databases FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_databases_delete" ON nexus_databases FOR DELETE USING (founder_id = auth.uid());

-- NEXUS_ROWS
CREATE POLICY "nexus_rows_select" ON nexus_rows FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "nexus_rows_insert" ON nexus_rows FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_rows_update" ON nexus_rows FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_rows_delete" ON nexus_rows FOR DELETE USING (founder_id = auth.uid());

-- CREDENTIALS_VAULT
CREATE POLICY "credentials_vault_select" ON credentials_vault FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "credentials_vault_insert" ON credentials_vault FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "credentials_vault_update" ON credentials_vault FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "credentials_vault_delete" ON credentials_vault FOR DELETE USING (founder_id = auth.uid());

-- APPROVAL_QUEUE
CREATE POLICY "approval_queue_select" ON approval_queue FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "approval_queue_insert" ON approval_queue FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "approval_queue_update" ON approval_queue FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "approval_queue_delete" ON approval_queue FOR DELETE USING (founder_id = auth.uid());

-- SOCIAL_CHANNELS
CREATE POLICY "social_channels_select" ON social_channels FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "social_channels_insert" ON social_channels FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "social_channels_update" ON social_channels FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "social_channels_delete" ON social_channels FOR DELETE USING (founder_id = auth.uid());

-- CONNECTED_PROJECTS
CREATE POLICY "connected_projects_select" ON connected_projects FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "connected_projects_insert" ON connected_projects FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "connected_projects_update" ON connected_projects FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "connected_projects_delete" ON connected_projects FOR DELETE USING (founder_id = auth.uid());
