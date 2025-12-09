-- =====================================================================
-- Phase D57: Multi-Brand Template Library & Provisioning
-- =====================================================================
-- Tables: unite_templates, unite_template_blocks, unite_template_bindings
--
-- Purpose:
-- - Reusable template library for emails, socials, campaigns
-- - Block-based template composition
-- - Template bindings to campaigns/journeys
-- - AI-powered template generation
--
-- Key Concepts:
-- - Templates have a scope (tenant or global)
-- - Templates are composed of ordered blocks
-- - Bindings link templates to campaigns/journeys
-- - AI can generate templates from descriptions
-- - Uses RLS for tenant isolation
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08
-- Migration: 485

-- =====================================================================
-- 1. Tables
-- =====================================================================

-- Templates table
CREATE TABLE IF NOT EXISTS unite_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, -- NULL for global templates

  -- Template identification
  scope text NOT NULL, -- 'tenant', 'global'
  slug text NOT NULL,
  name text NOT NULL,
  description text,

  -- Template classification
  category text, -- 'email', 'social', 'campaign', 'journey', etc.
  channel text, -- 'email', 'sms', 'social_facebook', 'social_instagram', etc.
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'

  -- Template structure
  structure jsonb, -- High-level template configuration
  ai_profile jsonb, -- AI generation settings

  -- Metadata
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Template blocks table (ordered components)
CREATE TABLE IF NOT EXISTS unite_template_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES unite_templates(id) ON DELETE CASCADE,

  -- Block details
  kind text NOT NULL, -- 'text', 'image', 'cta', 'hero', 'footer', etc.
  order_index integer NOT NULL, -- Ordering within template
  label text, -- Human-readable label

  -- Block payload
  payload jsonb, -- Block-specific configuration

  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- Template bindings table (links templates to targets)
CREATE TABLE IF NOT EXISTS unite_template_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  template_id uuid NOT NULL REFERENCES unite_templates(id) ON DELETE CASCADE,

  -- Binding target
  target_type text NOT NULL, -- 'campaign', 'journey', 'sequence', etc.
  target_id uuid, -- ID of the campaign/journey/sequence

  -- Binding configuration
  config jsonb, -- Binding-specific settings (variable mappings, etc.)

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. Indexes
-- =====================================================================

-- Templates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unite_templates_tenant_scope_slug
  ON unite_templates(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), scope, slug);

CREATE INDEX IF NOT EXISTS idx_unite_templates_category
  ON unite_templates(category, status);

CREATE INDEX IF NOT EXISTS idx_unite_templates_channel
  ON unite_templates(channel, status);

CREATE INDEX IF NOT EXISTS idx_unite_templates_tags
  ON unite_templates USING gin(tags);

-- Template Blocks
CREATE INDEX IF NOT EXISTS idx_unite_template_blocks_template
  ON unite_template_blocks(template_id, order_index);

-- Template Bindings
CREATE INDEX IF NOT EXISTS idx_unite_template_bindings_tenant
  ON unite_template_bindings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_unite_template_bindings_template
  ON unite_template_bindings(template_id);

CREATE INDEX IF NOT EXISTS idx_unite_template_bindings_target
  ON unite_template_bindings(tenant_id, target_type, target_id);

-- =====================================================================
-- 3. RLS Policies
-- =====================================================================

ALTER TABLE unite_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_template_bindings ENABLE ROW LEVEL SECURITY;

-- Templates (tenant-scoped OR global)
DROP POLICY IF EXISTS "tenant_or_global" ON unite_templates;
CREATE POLICY "tenant_or_global" ON unite_templates
  USING (
    tenant_id IS NULL OR
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- Template Bindings (tenant-scoped OR global)
DROP POLICY IF EXISTS "tenant_or_global" ON unite_template_bindings;
CREATE POLICY "tenant_or_global" ON unite_template_bindings
  USING (
    tenant_id IS NULL OR
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- =====================================================================
-- 4. Helper Functions
-- =====================================================================

/**
 * Get template with blocks
 */
CREATE OR REPLACE FUNCTION unite_get_template_with_blocks(
  p_template_id uuid
) RETURNS TABLE(
  template_id uuid,
  template_name text,
  template_category text,
  template_channel text,
  blocks jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS template_id,
    t.name AS template_name,
    t.category AS template_category,
    t.channel AS template_channel,
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'kind', b.kind,
        'order_index', b.order_index,
        'label', b.label,
        'payload', b.payload
      ) ORDER BY b.order_index
    ) AS blocks
  FROM unite_templates t
  LEFT JOIN unite_template_blocks b ON t.id = b.template_id
  WHERE t.id = p_template_id
  GROUP BY t.id, t.name, t.category, t.channel;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get templates by target binding
 */
CREATE OR REPLACE FUNCTION unite_get_templates_by_target(
  p_tenant_id uuid,
  p_target_type text,
  p_target_id uuid
) RETURNS TABLE(
  template_id uuid,
  template_name text,
  template_slug text,
  binding_id uuid,
  binding_config jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS template_id,
    t.name AS template_name,
    t.slug AS template_slug,
    b.id AS binding_id,
    b.config AS binding_config
  FROM unite_template_bindings b
  JOIN unite_templates t ON b.template_id = t.id
  WHERE (b.tenant_id = p_tenant_id OR b.tenant_id IS NULL)
    AND b.target_type = p_target_type
    AND b.target_id = p_target_id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION unite_get_template_with_blocks IS 'Get template with all blocks in order';
COMMENT ON FUNCTION unite_get_templates_by_target IS 'Get templates bound to a specific target (campaign/journey)';
