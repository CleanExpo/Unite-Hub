-- Migration 500: Founder Credential Vault
-- Encryption handled at application layer (AES-256-GCM via VAULT_ENCRYPTION_KEY env var).
-- No database extensions required. Secrets stored as encrypted blobs in the table itself.

BEGIN;

-- Metadata + encrypted secret table
CREATE TABLE IF NOT EXISTS founder_vault_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id        text NOT NULL,  -- 'disaster-recovery', 'nrpg', 'unite-group', etc.
  category           text NOT NULL CHECK (category IN ('login', 'api-key', 'banking', 'licence', 'other')),
  label              text NOT NULL,
  url                text,
  notes              text,
  secret_encrypted   text NOT NULL,  -- AES-256-GCM encrypted JSON: { iv, tag, ciphertext } base64
  last_accessed_at   timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS founder_vault_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      uuid REFERENCES founder_vault_items(id) ON DELETE SET NULL,
  owner_id     uuid,
  action       text NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete')),
  ip_address   text,
  occurred_at  timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE founder_vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_vault_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies: owner-only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_vault_items' AND policyname = 'vault_items_owner') THEN
    CREATE POLICY vault_items_owner ON founder_vault_items
      FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_vault_audit_log' AND policyname = 'vault_audit_owner') THEN
    CREATE POLICY vault_audit_owner ON founder_vault_audit_log
      FOR SELECT USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Service role: unrestricted (for audit writes + admin ops)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_vault_audit_log' AND policyname = 'vault_audit_service_role') THEN
    CREATE POLICY vault_audit_service_role ON founder_vault_audit_log
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vault_items_owner    ON founder_vault_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_business ON founder_vault_items(business_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_category ON founder_vault_items(category);
CREATE INDEX IF NOT EXISTS idx_vault_audit_item     ON founder_vault_audit_log(item_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_owner    ON founder_vault_audit_log(owner_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_vault_item_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_vault_item_updated_at ON founder_vault_items;
CREATE TRIGGER trg_vault_item_updated_at
  BEFORE UPDATE ON founder_vault_items
  FOR EACH ROW EXECUTE FUNCTION update_vault_item_updated_at();

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 500: Founder Credential Vault created (AES-256-GCM, no extensions required)';
  RAISE NOTICE '🔑 Set VAULT_ENCRYPTION_KEY in .env.local (64 hex chars = 32 bytes)';
  RAISE NOTICE '   Generate with: node -e "console.log(require(''crypto'').randomBytes(32).toString(''hex''))"';
END $$;
