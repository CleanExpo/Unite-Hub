-- 514: Obsidian vault integration
-- Adds obsidian sync columns to contacts and founder_settings.
-- Vault auth reuses founder_drive_tokens (migration 515 adds drive.file scope upgrade).

-- ─── contacts: obsidian sync columns ─────────────────────────────────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS obsidian_note_path text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS obsidian_synced_at timestamptz;

-- ─── founder_settings: obsidian vault settings ───────────────────────────────
-- founder_settings created in migration 510
ALTER TABLE founder_settings ADD COLUMN IF NOT EXISTS obsidian_vault_folder_id text;
ALTER TABLE founder_settings ADD COLUMN IF NOT EXISTS obsidian_vault_name text DEFAULT 'Unite-Group Vault';
ALTER TABLE founder_settings ADD COLUMN IF NOT EXISTS obsidian_enabled boolean DEFAULT false;
