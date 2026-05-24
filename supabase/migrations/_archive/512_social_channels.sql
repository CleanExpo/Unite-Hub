-- 512: Social Channels table for per-business social platform management
-- UNI-1376

CREATE TABLE IF NOT EXISTS social_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_key text NOT NULL,
  platform text NOT NULL,
  handle text,
  profile_url text,
  connected boolean DEFAULT false,
  last_post_at timestamptz,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE social_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_channels_owner ON social_channels
  FOR ALL USING (auth.uid() = owner_id);

CREATE INDEX idx_social_channels_business ON social_channels(business_key);
CREATE INDEX idx_social_channels_owner ON social_channels(owner_id);
