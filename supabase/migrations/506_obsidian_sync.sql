-- Migration 506: Obsidian Vault Integration
-- Extends contacts table with Obsidian sync fields.
-- Adds founder_settings table for per-owner configuration.
-- IDEMPOTENT — safe to re-run if the table already exists.

-- ─── 1. Extend contacts table ─────────────────────────────────────────────────

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS obsidian_note_path  text,
  ADD COLUMN IF NOT EXISTS obsidian_synced_at  timestamptz;

COMMENT ON COLUMN contacts.obsidian_note_path IS
  'Relative path within the Obsidian vault, e.g. Contacts/John Smith.md';
COMMENT ON COLUMN contacts.obsidian_synced_at IS
  'Timestamp of last successful sync to the Obsidian vault via Google Drive';

-- ─── 2. Founder settings table ───────────────────────────────────────────────

-- Create table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS founder_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE founder_settings IS
  'Single-row per founder: stores tool config including Obsidian vault settings.';

-- Add all columns idempotently (handles tables created without these columns)
ALTER TABLE founder_settings
  ADD COLUMN IF NOT EXISTS owner_id                  uuid,
  ADD COLUMN IF NOT EXISTS obsidian_vault_folder_id  text,
  ADD COLUMN IF NOT EXISTS obsidian_vault_name       text,
  ADD COLUMN IF NOT EXISTS obsidian_enabled          boolean;

-- Default vault name where not set
UPDATE founder_settings
  SET obsidian_vault_name = 'Unite-Group Vault'
  WHERE obsidian_vault_name IS NULL;

-- Default obsidian_enabled where not set
UPDATE founder_settings
  SET obsidian_enabled = false
  WHERE obsidian_enabled IS NULL;

-- Add UNIQUE constraint on owner_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'founder_settings_owner_id_key'
      AND conrelid = 'founder_settings'::regclass
  ) THEN
    ALTER TABLE founder_settings
      ADD CONSTRAINT founder_settings_owner_id_key UNIQUE (owner_id);
  END IF;
END $$;

-- ─── 3. Updated_at trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_founder_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS founder_settings_updated_at ON founder_settings;
CREATE TRIGGER founder_settings_updated_at
  BEFORE UPDATE ON founder_settings
  FOR EACH ROW EXECUTE FUNCTION update_founder_settings_updated_at();

-- ─── 4. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE founder_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "founder_settings_owner_only"   ON founder_settings;
DROP POLICY IF EXISTS "founder_settings_service_role" ON founder_settings;

-- Owner can only access their own row
CREATE POLICY "founder_settings_owner_only"
  ON founder_settings FOR ALL
  USING (owner_id = auth.uid());

-- Service role bypass (for API routes using supabaseAdmin)
CREATE POLICY "founder_settings_service_role"
  ON founder_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
