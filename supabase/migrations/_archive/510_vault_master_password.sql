-- Migration 510: Vault Master Password + Agent Access Fields
-- UNI-1427: Master password hash storage
-- UNI-1426/1429: agent_accessible + tags columns

-- ─── founder_settings table (for vault_master_hash) ─────────────────────────

-- founder_settings may already exist from migration 506 — use ADD COLUMN IF NOT EXISTS
CREATE TABLE IF NOT EXISTS founder_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE founder_settings ADD COLUMN IF NOT EXISTS owner_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE founder_settings ADD COLUMN IF NOT EXISTS vault_master_hash text;
ALTER TABLE founder_settings ADD COLUMN IF NOT EXISTS obsidian_vault_folder_id text;
ALTER TABLE founder_settings ADD COLUMN IF NOT EXISTS obsidian_vault_name      text;
ALTER TABLE founder_settings ADD COLUMN IF NOT EXISTS obsidian_enabled         boolean DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'founder_settings'::regclass AND conname = 'founder_settings_owner_unique'
  ) THEN
    ALTER TABLE founder_settings ADD CONSTRAINT founder_settings_owner_unique UNIQUE (owner_id);
  END IF;
END $$;

ALTER TABLE founder_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_settings_owner ON founder_settings;
CREATE POLICY founder_settings_owner ON founder_settings
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS founder_settings_service_role ON founder_settings;
CREATE POLICY founder_settings_service_role ON founder_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_founder_settings_owner ON founder_settings(owner_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_founder_settings_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_founder_settings_updated_at ON founder_settings;
CREATE TRIGGER trg_founder_settings_updated_at
  BEFORE UPDATE ON founder_settings
  FOR EACH ROW EXECUTE FUNCTION update_founder_settings_updated_at();

-- ─── Add agent_accessible + tags to founder_vault_items ──────────────────────

ALTER TABLE founder_vault_items ADD COLUMN IF NOT EXISTS agent_accessible boolean DEFAULT false;
ALTER TABLE founder_vault_items ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_vault_items_agent ON founder_vault_items(agent_accessible) WHERE agent_accessible = true;
