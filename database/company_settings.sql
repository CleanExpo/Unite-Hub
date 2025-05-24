-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view company settings
CREATE POLICY "Company settings are viewable by authenticated users"
ON company_settings FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert/update company settings
CREATE POLICY "Company settings are editable by admins"
ON company_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Company assets are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Company assets are uploadable by authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Company assets are updatable by authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets');

CREATE POLICY "Company assets are deletable by authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');
