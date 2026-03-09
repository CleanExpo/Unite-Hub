-- 513: Founder media captures for Phill OS
-- UNI-1294

CREATE TABLE IF NOT EXISTS founder_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  caption text,
  business_key text,
  file_size_bytes bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE founder_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY founder_media_owner ON founder_media
  FOR ALL USING (auth.uid() = owner_id);

CREATE INDEX idx_founder_media_owner ON founder_media(owner_id);
