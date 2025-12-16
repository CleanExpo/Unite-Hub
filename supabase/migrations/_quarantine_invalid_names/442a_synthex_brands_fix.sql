-- =====================================================
-- Migration 442a: Fix synthex_brands schema
-- Adds ALL missing columns if they don't exist
-- =====================================================

-- Step 1: Add ALL potentially missing columns first
DO $$
BEGIN
    -- Core columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'name') THEN
        ALTER TABLE synthex_brands ADD COLUMN name TEXT DEFAULT 'Default Brand';
        UPDATE synthex_brands SET name = 'Default Brand' WHERE name IS NULL;
        ALTER TABLE synthex_brands ALTER COLUMN name SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'slug') THEN
        ALTER TABLE synthex_brands ADD COLUMN slug TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'description') THEN
        ALTER TABLE synthex_brands ADD COLUMN description TEXT;
    END IF;

    -- Visual branding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'primary_color') THEN
        ALTER TABLE synthex_brands ADD COLUMN primary_color TEXT DEFAULT '#ff6b35';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'secondary_color') THEN
        ALTER TABLE synthex_brands ADD COLUMN secondary_color TEXT DEFAULT '#1a1a2e';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'accent_color') THEN
        ALTER TABLE synthex_brands ADD COLUMN accent_color TEXT DEFAULT '#f39c12';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'text_color') THEN
        ALTER TABLE synthex_brands ADD COLUMN text_color TEXT DEFAULT '#ffffff';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'background_color') THEN
        ALTER TABLE synthex_brands ADD COLUMN background_color TEXT DEFAULT '#0f0f1a';
    END IF;

    -- Logos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'logo_url') THEN
        ALTER TABLE synthex_brands ADD COLUMN logo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'logo_dark_url') THEN
        ALTER TABLE synthex_brands ADD COLUMN logo_dark_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'favicon_url') THEN
        ALTER TABLE synthex_brands ADD COLUMN favicon_url TEXT;
    END IF;

    -- Domains
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'sending_domain') THEN
        ALTER TABLE synthex_brands ADD COLUMN sending_domain TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'custom_domain') THEN
        ALTER TABLE synthex_brands ADD COLUMN custom_domain TEXT;
    END IF;

    -- Email settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'from_name') THEN
        ALTER TABLE synthex_brands ADD COLUMN from_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'from_email') THEN
        ALTER TABLE synthex_brands ADD COLUMN from_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'reply_to_email') THEN
        ALTER TABLE synthex_brands ADD COLUMN reply_to_email TEXT;
    END IF;

    -- Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'is_default') THEN
        ALTER TABLE synthex_brands ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'is_active') THEN
        ALTER TABLE synthex_brands ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'metadata') THEN
        ALTER TABLE synthex_brands ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synthex_brands' AND column_name = 'updated_at') THEN
        ALTER TABLE synthex_brands ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Step 2: Generate slugs from names (now that name column exists)
UPDATE synthex_brands
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Step 3: Make slug NOT NULL
ALTER TABLE synthex_brands ALTER COLUMN slug SET NOT NULL;

-- Step 4: Add unique constraint if missing
DO $$
BEGIN
    ALTER TABLE synthex_brands ADD CONSTRAINT synthex_brands_tenant_id_slug_key UNIQUE(tenant_id, slug);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_synthex_brands_slug ON synthex_brands(slug);
CREATE INDEX IF NOT EXISTS idx_synthex_brands_tenant ON synthex_brands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_brands_default ON synthex_brands(tenant_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_synthex_brands_domain ON synthex_brands(custom_domain) WHERE custom_domain IS NOT NULL;
