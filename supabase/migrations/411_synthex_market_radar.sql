-- =============================================================================
-- Migration 411: Synthex Market Radar — Competitor Monitoring (Phase D45)
-- =============================================================================

-- Competitor watches (domains being monitored)
CREATE TABLE IF NOT EXISTS synthex_market_radar_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  domain TEXT NOT NULL,
  display_name TEXT,
  industry TEXT,
  monitor_seo BOOLEAN DEFAULT TRUE,
  monitor_content BOOLEAN DEFAULT TRUE,
  monitor_social BOOLEAN DEFAULT FALSE,
  monitor_pricing BOOLEAN DEFAULT FALSE,
  check_frequency TEXT DEFAULT 'weekly', -- daily, weekly, monthly
  status TEXT DEFAULT 'active',          -- active, paused, removed
  last_checked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots: point-in-time competitor data
CREATE TABLE IF NOT EXISTS synthex_market_radar_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  watch_id UUID NOT NULL REFERENCES synthex_market_radar_watches(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  snapshot_type TEXT NOT NULL, -- seo, content, social, pricing, full
  data JSONB NOT NULL DEFAULT '{}',
  authority_score INTEGER,
  organic_keywords INTEGER,
  estimated_traffic INTEGER,
  backlinks INTEGER,
  content_count INTEGER,
  social_followers INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts: changes detected
CREATE TABLE IF NOT EXISTS synthex_market_radar_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  watch_id UUID NOT NULL REFERENCES synthex_market_radar_watches(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- ranking_change, new_content, traffic_spike, backlink_surge, price_change
  severity TEXT DEFAULT 'info', -- info, warning, critical
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_radar_watches_tenant ON synthex_market_radar_watches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_radar_watches_status ON synthex_market_radar_watches(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_radar_snapshots_watch ON synthex_market_radar_snapshots(watch_id);
CREATE INDEX IF NOT EXISTS idx_radar_snapshots_tenant ON synthex_market_radar_snapshots(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_alerts_tenant ON synthex_market_radar_alerts(tenant_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_alerts_watch ON synthex_market_radar_alerts(watch_id);

-- RLS
ALTER TABLE synthex_market_radar_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_market_radar_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_market_radar_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_watches" ON synthex_market_radar_watches;
CREATE POLICY "tenant_isolation_watches" ON synthex_market_radar_watches
FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "tenant_isolation_snapshots" ON synthex_market_radar_snapshots;
CREATE POLICY "tenant_isolation_snapshots" ON synthex_market_radar_snapshots
FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "tenant_isolation_alerts" ON synthex_market_radar_alerts;
CREATE POLICY "tenant_isolation_alerts" ON synthex_market_radar_alerts
FOR ALL USING (TRUE);
