-- Founder Document Repository
-- Migration 505

CREATE TABLE IF NOT EXISTS founder_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL,
  business_id     text NOT NULL CHECK (business_id IN ('disaster-recovery','restore-assist','ato','nrpg','unite-group','carsi')),
  file_name       text NOT NULL,
  file_type       text NOT NULL,
  category        text NOT NULL DEFAULT 'other' CHECK (category IN ('contract','licence','insurance','tax','hr','financial','legal','other')),
  storage_path    text,           -- path in founder-documents bucket (null if Drive-only)
  drive_file_id   text,           -- Google Drive file ID
  drive_web_url   text,           -- Drive view/download URL
  file_size_bytes bigint,
  expiry_date     date,           -- for expiry alerts
  notes           text,
  extracted_text  text,           -- Claude Haiku extraction result
  extracted_at    timestamptz,
  tags            text[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS: owner-only access
ALTER TABLE founder_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only" ON founder_documents
  FOR ALL USING (owner_id = auth.uid());

-- Service role bypass
CREATE POLICY "service_role_bypass" ON founder_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_founder_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER founder_documents_updated_at
  BEFORE UPDATE ON founder_documents
  FOR EACH ROW EXECUTE FUNCTION update_founder_documents_updated_at();

-- Indexes
CREATE INDEX idx_founder_documents_owner ON founder_documents(owner_id);
CREATE INDEX idx_founder_documents_business ON founder_documents(business_id);
CREATE INDEX idx_founder_documents_expiry ON founder_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_founder_documents_category ON founder_documents(category);

COMMENT ON TABLE founder_documents IS 'Founder document repository with expiry tracking and Claude Haiku AI extraction';
