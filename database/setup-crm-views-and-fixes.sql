-- ============================================
-- CRM DATABASE VIEWS AND FIXES
-- ============================================
-- This script creates the missing views that the API requires
-- Run this AFTER the main setup script in Supabase SQL Editor

-- Create the deals_with_stages view that the API is expecting
CREATE OR REPLACE VIEW deals_with_stages AS
SELECT 
  d.id,
  d.name,
  d.status,
  d.amount,
  d.created_at,
  d.client_id,
  ps.name as stage_name,
  CASE 
    WHEN d.status = 'won' THEN 'Closed Won'
    WHEN d.status = 'lost' THEN 'Closed Lost'
    ELSE ps.name
  END as display_stage
FROM deals d
LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id;

-- Create activities view (alias for interactions)
CREATE OR REPLACE VIEW activities AS
SELECT 
  id,
  client_id,
  interaction_type as type,
  interaction_date as timestamp,
  summary as description,
  created_by,
  created_at
FROM interactions;

-- Grant permissions on views
GRANT SELECT ON deals_with_stages TO authenticated;
GRANT SELECT ON activities TO authenticated;

-- Add RLS policies for views
ALTER VIEW deals_with_stages SET (security_invoker = on);
ALTER VIEW activities SET (security_invoker = on);

-- Insert sample data if tables are empty
INSERT INTO clients (company_name, email, contact_person, phone, client_status)
VALUES 
  ('Test Company 1', 'test1@example.com', 'John Doe', '+61 400 000 001', 'active'),
  ('Test Company 2', 'test2@example.com', 'Jane Smith', '+61 400 000 002', 'lead'),
  ('Test Company 3', 'test3@example.com', 'Bob Johnson', '+61 400 000 003', 'prospect')
ON CONFLICT (email) DO NOTHING;

-- Get pipeline and stage IDs for sample deals
DO $$
DECLARE
  v_pipeline_id UUID;
  v_lead_stage_id UUID;
  v_qualified_stage_id UUID;
  v_proposal_stage_id UUID;
  v_client1_id UUID;
  v_client2_id UUID;
  v_client3_id UUID;
BEGIN
  -- Get pipeline ID
  SELECT id INTO v_pipeline_id FROM pipelines WHERE name = 'Sales Pipeline' LIMIT 1;
  
  -- Get stage IDs
  SELECT id INTO v_lead_stage_id FROM pipeline_stages WHERE pipeline_id = v_pipeline_id AND name = 'Lead' LIMIT 1;
  SELECT id INTO v_qualified_stage_id FROM pipeline_stages WHERE pipeline_id = v_pipeline_id AND name = 'Qualified' LIMIT 1;
  SELECT id INTO v_proposal_stage_id FROM pipeline_stages WHERE pipeline_id = v_pipeline_id AND name = 'Proposal' LIMIT 1;
  
  -- Get client IDs
  SELECT id INTO v_client1_id FROM clients WHERE email = 'test1@example.com' LIMIT 1;
  SELECT id INTO v_client2_id FROM clients WHERE email = 'test2@example.com' LIMIT 1;
  SELECT id INTO v_client3_id FROM clients WHERE email = 'test3@example.com' LIMIT 1;
  
  -- Insert sample deals if we have all required data
  IF v_pipeline_id IS NOT NULL AND v_lead_stage_id IS NOT NULL AND v_client1_id IS NOT NULL THEN
    INSERT INTO deals (name, amount, pipeline_id, stage_id, client_id, status, expected_close_date)
    VALUES 
      ('Website Development Project', 25000, v_pipeline_id, v_proposal_stage_id, v_client1_id, 'open', CURRENT_DATE + INTERVAL '30 days'),
      ('Mobile App Development', 50000, v_pipeline_id, v_qualified_stage_id, v_client2_id, 'open', CURRENT_DATE + INTERVAL '45 days'),
      ('Consulting Services', 15000, v_pipeline_id, v_lead_stage_id, v_client3_id, 'open', CURRENT_DATE + INTERVAL '60 days')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample tasks
    INSERT INTO tasks (title, description, status, priority, client_id, due_date)
    VALUES
      ('Follow up with Test Company 1', 'Send proposal for website project', 'in-progress', 'high', v_client1_id, CURRENT_DATE + INTERVAL '2 days'),
      ('Schedule demo for Test Company 2', 'Demo the mobile app prototype', 'in-progress', 'medium', v_client2_id, CURRENT_DATE + INTERVAL '5 days'),
      ('Initial consultation', 'Discuss requirements with Test Company 3', 'in-progress', 'medium', v_client3_id, CURRENT_DATE + INTERVAL '7 days')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample interactions
    INSERT INTO interactions (client_id, interaction_type, subject, summary, interaction_date)
    VALUES
      (v_client1_id, 'email', 'Project Requirements', 'Discussed website requirements and timeline', CURRENT_TIMESTAMP - INTERVAL '2 days'),
      (v_client2_id, 'meeting', 'Initial Meeting', 'Had introductory meeting about mobile app needs', CURRENT_TIMESTAMP - INTERVAL '3 days'),
      (v_client3_id, 'call', 'Discovery Call', 'Initial call to understand consulting needs', CURRENT_TIMESTAMP - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Verify the setup
SELECT 'Views created successfully' as status
UNION ALL
SELECT 'Deals count: ' || COUNT(*)::text FROM deals
UNION ALL
SELECT 'Tasks count: ' || COUNT(*)::text FROM tasks
UNION ALL
SELECT 'Interactions count: ' || COUNT(*)::text FROM interactions;
