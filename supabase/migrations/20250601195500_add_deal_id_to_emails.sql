ALTER TABLE crm_emails ADD COLUMN deal_id UUID REFERENCES pipeline_deals(id) ON DELETE SET NULL;
