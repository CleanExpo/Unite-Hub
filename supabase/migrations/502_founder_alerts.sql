BEGIN;

CREATE TABLE IF NOT EXISTS alert_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id  text NOT NULL,
  metric       text NOT NULL CHECK (metric IN ('mrr', 'invoice_count', 'xero_connected')),
  operator     text NOT NULL CHECK (operator IN ('lt', 'gt', 'lte', 'gte', 'eq')),
  threshold    numeric NOT NULL,
  label        text NOT NULL,
  enabled      boolean NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         uuid REFERENCES alert_rules(id) ON DELETE SET NULL,
  owner_id        uuid NOT NULL,
  business_id     text NOT NULL,
  metric          text NOT NULL,
  actual_value    numeric,
  threshold_value numeric,
  label           text,
  fired_at        timestamptz DEFAULT now()
);

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='alert_rules' AND policyname='alert_rules_owner') THEN
    CREATE POLICY alert_rules_owner ON alert_rules FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='alert_events' AND policyname='alert_events_owner_read') THEN
    CREATE POLICY alert_events_owner_read ON alert_events FOR SELECT USING (auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='alert_events' AND policyname='alert_events_service_role') THEN
    CREATE POLICY alert_events_service_role ON alert_events FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_alert_rules_owner    ON alert_rules(owner_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_business ON alert_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_owner   ON alert_events(owner_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_fired   ON alert_events(fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_rule    ON alert_events(rule_id);

CREATE OR REPLACE FUNCTION update_alert_rule_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_alert_rule_updated ON alert_rules;
CREATE TRIGGER trg_alert_rule_updated
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_alert_rule_updated_at();

COMMIT;
