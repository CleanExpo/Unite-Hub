-- Migration 153: Client Sites & Secrets Vault
-- Enables Unite-Hub to manage external client websites and apply automated fixes

-- Client Sites - stores website configurations
CREATE TABLE IF NOT EXISTS client_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Site Details
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  site_type VARCHAR(50) DEFAULT 'website', -- website, wordpress, shopify, etc.

  -- CMS Configuration
  cms_type VARCHAR(50), -- wordpress, drupal, shopify, wix, squarespace, custom
  cms_version VARCHAR(50),

  -- Access Configuration
  access_method VARCHAR(50) DEFAULT 'api', -- api, ftp, ssh, git
  repository_url TEXT,

  -- Health & Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, error, pending_setup
  last_scan_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),

  -- SEO Metrics (cached from scans)
  seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
  issues_count INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tenant_domain UNIQUE (workspace_id, domain)
);

-- Secrets Vault - encrypted credentials for client sites
CREATE TABLE IF NOT EXISTS site_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES client_sites(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Secret Details
  secret_name VARCHAR(255) NOT NULL, -- e.g., 'wordpress_api_key', 'ftp_password'
  secret_type VARCHAR(50) NOT NULL, -- api_key, password, token, ssh_key, certificate

  -- Encrypted Value (use pgcrypto in production)
  encrypted_value TEXT NOT NULL,

  -- Metadata
  description TEXT,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_rotated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_site_secret UNIQUE (site_id, secret_name)
);

-- Site Scan Results - stores audit results
CREATE TABLE IF NOT EXISTS site_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES client_sites(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Scan Details
  scan_type VARCHAR(50) NOT NULL, -- full, seo, performance, security
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed

  -- Results
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  issues JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated Fixes - tracks fixes applied to client sites
CREATE TABLE IF NOT EXISTS site_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES client_sites(id) ON DELETE CASCADE,
  scan_result_id UUID REFERENCES site_scan_results(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Fix Details
  fix_type VARCHAR(100) NOT NULL, -- schema_markup, meta_description, alt_tags, etc.
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low

  -- Fix Content
  original_content TEXT,
  fixed_content TEXT NOT NULL,
  file_path TEXT, -- path in CMS where fix is applied

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, applied, failed, rolled_back
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES user_profiles(id),

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE client_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_fixes ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY client_sites_workspace_policy ON client_sites
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

CREATE POLICY site_secrets_workspace_policy ON site_secrets
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

CREATE POLICY site_scan_results_workspace_policy ON site_scan_results
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

CREATE POLICY site_fixes_workspace_policy ON site_fixes
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_sites_tenant ON client_sites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_sites_domain ON client_sites(domain);
CREATE INDEX IF NOT EXISTS idx_client_sites_status ON client_sites(status);
CREATE INDEX IF NOT EXISTS idx_site_secrets_site ON site_secrets(site_id);
CREATE INDEX IF NOT EXISTS idx_site_scan_results_site ON site_scan_results(site_id);
CREATE INDEX IF NOT EXISTS idx_site_fixes_site ON site_fixes(site_id);
CREATE INDEX IF NOT EXISTS idx_site_fixes_status ON site_fixes(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_sites_updated_at BEFORE UPDATE ON client_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_secrets_updated_at BEFORE UPDATE ON site_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_fixes_updated_at BEFORE UPDATE ON site_fixes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
