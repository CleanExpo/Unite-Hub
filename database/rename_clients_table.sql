-- Migration to rename 'clients' table to 'crm_clients'
BEGIN;

-- Rename the table
ALTER TABLE clients RENAME TO crm_clients;

-- Update dependent objects
-- 1. Update foreign key references in other tables
ALTER TABLE projects 
    RENAME COLUMN client_id TO crm_client_id;

ALTER TABLE projects 
    ALTER COLUMN crm_client_id SET DATA TYPE UUID,
    ADD CONSTRAINT fk_crm_client_id FOREIGN KEY (crm_client_id) REFERENCES crm_clients(id);

ALTER TABLE interactions 
    RENAME COLUMN client_id TO crm_client_id;

ALTER TABLE interactions 
    ALTER COLUMN crm_client_id SET DATA TYPE UUID,
    ADD CONSTRAINT fk_crm_client_id FOREIGN KEY (crm_client_id) REFERENCES crm_clients(id);

-- ... repeat similar updates for other tables referencing clients ...

-- 2. Update indexes
ALTER INDEX idx_clients_status RENAME TO idx_crm_clients_status;
ALTER INDEX idx_clients_email RENAME TO idx_crm_clients_email;
ALTER INDEX idx_clients_company RENAME TO idx_crm_clients_company;

-- 3. Update views
DROP VIEW IF EXISTS client_overview;
CREATE OR REPLACE VIEW crm_client_overview AS
SELECT 
    c.*,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') as active_projects,
    COUNT(DISTINCT i.id) as interaction_count,
    MAX(i.interaction_date) as last_interaction_date
FROM crm_clients c
LEFT JOIN projects p ON c.id = p.crm_client_id
LEFT JOIN interactions i ON c.id = i.crm_client_id
GROUP BY c.id;

-- 4. Update RLS policies
DROP POLICY IF EXISTS "Users can view all clients" ON crm_clients;
DROP POLICY IF EXISTS "Users can create clients" ON crm_clients;
DROP POLICY IF EXISTS "Users can update clients" ON crm_clients;

CREATE POLICY "Users can view all crm_clients" ON crm_clients
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create crm_clients" ON crm_clients
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update crm_clients" ON crm_clients
    FOR UPDATE USING (auth.uid() IS NOT NULL);

COMMIT;
