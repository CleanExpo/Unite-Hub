-- Migration: brand_profiles
-- Stores extracted brand DNA for any scanned website (internal or external clients).
-- Used by the Synthex Campaign Engine to generate on-brand marketing campaigns.

-- Ensure moddatetime extension exists (used for updated_at triggers)
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ─── brand_profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brand_profiles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_key      TEXT        NULL,          -- links to Unite-Group business (NULL for external clients)
  client_name       TEXT        NOT NULL,
  website_url       TEXT        NOT NULL,
  logo_url          TEXT        NULL,
  colours           JSONB       NOT NULL DEFAULT '{"primary":"#000000","secondary":"#ffffff","accent":"#0000ff","neutrals":[]}',
  fonts             JSONB       NOT NULL DEFAULT '{"heading":"sans-serif","body":"sans-serif","accent":null}',
  tone_of_voice     TEXT        NULL,
  brand_values      TEXT[]      NOT NULL DEFAULT '{}',
  tagline           TEXT        NULL,
  target_audience   TEXT        NULL,
  industry          TEXT        NULL,
  imagery_style     TEXT        NULL,
  reference_images  TEXT[]      NOT NULL DEFAULT '{}',
  raw_scrape        JSONB       NOT NULL DEFAULT '{}',
  status            TEXT        NOT NULL DEFAULT 'scanning'
                    CHECK (status IN ('scanning', 'ready', 'failed')),
  scan_error        TEXT        NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one profile per founder per website
ALTER TABLE brand_profiles
  ADD CONSTRAINT brand_profiles_founder_url_unique
  UNIQUE (founder_id, website_url);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS brand_profiles_founder_status_idx
  ON brand_profiles (founder_id, status);

CREATE INDEX IF NOT EXISTS brand_profiles_founder_business_idx
  ON brand_profiles (founder_id, business_key)
  WHERE business_key IS NOT NULL;

-- Auto-update updated_at
CREATE TRIGGER set_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users see only their own profiles
CREATE POLICY "brand_profiles_select_own"
  ON brand_profiles
  FOR SELECT
  TO authenticated
  USING (founder_id = auth.uid());

CREATE POLICY "brand_profiles_insert_own"
  ON brand_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (founder_id = auth.uid());

CREATE POLICY "brand_profiles_update_own"
  ON brand_profiles
  FOR UPDATE
  TO authenticated
  USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

CREATE POLICY "brand_profiles_delete_own"
  ON brand_profiles
  FOR DELETE
  TO authenticated
  USING (founder_id = auth.uid());

-- Service role bypasses RLS (used by CRONs and server-side operations)
CREATE POLICY "brand_profiles_service_role"
  ON brand_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
