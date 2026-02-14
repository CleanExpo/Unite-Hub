-- Migration 163: Networked Intelligence Exchange (NIX)
-- Phase 120: Message bus for engine intelligence sharing

CREATE TABLE IF NOT EXISTS intelligence_exchange_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_engine TEXT NOT NULL,
  consumer_engine TEXT NOT NULL,
  payload JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_exchange_producer ON intelligence_exchange_messages(producer_engine);
CREATE INDEX IF NOT EXISTS idx_intel_exchange_consumer ON intelligence_exchange_messages(consumer_engine);
CREATE INDEX IF NOT EXISTS idx_intel_exchange_created ON intelligence_exchange_messages(created_at DESC);

ALTER TABLE intelligence_exchange_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view exchange messages" ON intelligence_exchange_messages;
CREATE POLICY "Users can view exchange messages" ON intelligence_exchange_messages FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE intelligence_exchange_messages IS 'Phase 120: Intelligence exchange messages between engines';
