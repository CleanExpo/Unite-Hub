-- Migration 151: Founder Flight Deck v2
-- Phase 108: Unified executive cockpit

CREATE TABLE IF NOT EXISTS flight_deck_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_config JSONB NOT NULL DEFAULT '{}',
  widget_states JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flight_deck_tenant ON flight_deck_layouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_flight_deck_user ON flight_deck_layouts(user_id);

ALTER TABLE flight_deck_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own flight deck" ON flight_deck_layouts;
CREATE POLICY "Users can manage own flight deck" ON flight_deck_layouts FOR ALL
  USING (user_id = auth.uid());

COMMENT ON TABLE flight_deck_layouts IS 'Phase 108: Founder flight deck layout configurations';
