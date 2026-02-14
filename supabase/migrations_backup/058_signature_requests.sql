-- Phase 9 Week 5-6: Signature Requests Migration
-- Creates signature tracking table and extends existing tables

-- =============================================================
-- Table: signature_requests
-- Tracks e-signature requests for Trusted Mode approval
-- =============================================================

CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  trust_request_id UUID NOT NULL REFERENCES trusted_mode_requests(id) ON DELETE CASCADE,

  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('docusign', 'hellosign', 'manual')),
  provider_envelope_id TEXT,
  provider_document_id TEXT,

  -- Request details
  document_type TEXT NOT NULL DEFAULT 'trusted_mode_agreement',
  template_id TEXT,

  -- Signer info
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_role TEXT DEFAULT 'client_admin',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN (
      'DRAFT',
      'SENT',
      'DELIVERED',
      'VIEWED',
      'SIGNED',
      'DECLINED',
      'VOIDED',
      'EXPIRED',
      'FAILED'
    )
  ),

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Signature details
  signature_ip TEXT,
  signature_user_agent TEXT,
  signed_document_path TEXT,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  webhook_events JSONB DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signature_requests_client ON signature_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_org ON signature_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_trust ON signature_requests(trust_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_signature_requests_envelope ON signature_requests(provider_envelope_id);

-- =============================================================
-- Extend autonomy_proposals with signature_status
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'autonomy_proposals'
    AND column_name = 'signature_required'
  ) THEN
    ALTER TABLE autonomy_proposals ADD COLUMN signature_required BOOLEAN DEFAULT false;
    ALTER TABLE autonomy_proposals ADD COLUMN signature_request_id UUID REFERENCES signature_requests(id);
    ALTER TABLE autonomy_proposals ADD COLUMN signature_status TEXT CHECK (
      signature_status IN ('NOT_REQUIRED', 'PENDING', 'SIGNED', 'DECLINED', 'EXPIRED')
    );
  END IF;
END $$;

-- =============================================================
-- RLS Policies for signature_requests
-- =============================================================

ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- Users can view signature requests for their org
CREATE POLICY "Users can view signature requests for their org"
  ON signature_requests FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Org admins can manage signature requests
CREATE POLICY "Org admins can manage signature requests"
  ON signature_requests FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Service role can insert/update
CREATE POLICY "Service role can insert signature requests"
  ON signature_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update signature requests"
  ON signature_requests FOR UPDATE
  USING (true);

-- =============================================================
-- Updated timestamp trigger
-- =============================================================

CREATE TRIGGER update_signature_requests_updated_at
  BEFORE UPDATE ON signature_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
