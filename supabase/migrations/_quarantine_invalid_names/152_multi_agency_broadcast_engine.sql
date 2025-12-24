-- Migration 152: Multi-Agency Broadcast Engine (MABE)
-- Phase 109: Broadcast intelligence to multiple agencies

CREATE TABLE IF NOT EXISTS broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  target_scope JSONB NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('intelligence', 'warning', 'asset', 'playbook', 'announcement')),
  payload JSONB NOT NULL,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcast_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  recipient_agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'seen', 'acknowledged')),
  seen_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_sender ON broadcast_messages(sender_agency_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_created ON broadcast_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_receipts_broadcast ON broadcast_receipts(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_receipts_recipient ON broadcast_receipts(recipient_agency_id);

ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view broadcasts" ON broadcast_messages;
CREATE POLICY "Users can view broadcasts" ON broadcast_messages FOR SELECT
  USING (sender_agency_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create broadcasts" ON broadcast_messages;
CREATE POLICY "Users can create broadcasts" ON broadcast_messages FOR INSERT
  WITH CHECK (sender_agency_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view receipts" ON broadcast_receipts;
CREATE POLICY "Users can view receipts" ON broadcast_receipts FOR SELECT
  USING (recipient_agency_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

COMMENT ON TABLE broadcast_messages IS 'Phase 109: Multi-agency broadcast messages';
COMMENT ON TABLE broadcast_receipts IS 'Phase 109: Broadcast delivery receipts';
