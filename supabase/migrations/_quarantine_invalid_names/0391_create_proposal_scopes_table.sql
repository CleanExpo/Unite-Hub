-- Phase 3 Step 2: Create proposal_scopes table
-- Stores staff-generated scopes for client ideas
-- Date: 2025-11-19

-- Create proposal_scopes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'proposal_scopes'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'ideas'
    ) THEN
      EXECUTE $ddl$
        CREATE TABLE IF NOT EXISTS public.proposal_scopes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
          organization_id UUID NOT NULL REFERENCES public.organizations(id),
          client_id UUID REFERENCES public.contacts(id),
          scope_data JSONB NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('draft', 'sent')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by TEXT,
          updated_by TEXT,
          CONSTRAINT unique_idea_scope UNIQUE (idea_id)
        )
      $ddl$;
    ELSE
      EXECUTE $ddl$
        CREATE TABLE IF NOT EXISTS public.proposal_scopes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          idea_id UUID NOT NULL,
          organization_id UUID NOT NULL REFERENCES public.organizations(id),
          client_id UUID REFERENCES public.contacts(id),
          scope_data JSONB NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('draft', 'sent')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by TEXT,
          updated_by TEXT,
          CONSTRAINT unique_idea_scope UNIQUE (idea_id)
        )
      $ddl$;
    END IF;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposal_scopes_org ON proposal_scopes(organization_id);
CREATE INDEX IF NOT EXISTS idx_proposal_scopes_client ON proposal_scopes(client_id);
CREATE INDEX IF NOT EXISTS idx_proposal_scopes_status ON proposal_scopes(status);

-- RLS policies (workspace isolation)
ALTER TABLE proposal_scopes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view scopes from their organization" ON proposal_scopes;
DROP POLICY IF EXISTS "Users can create scopes for their organization" ON proposal_scopes;
DROP POLICY IF EXISTS "Users can update scopes from their organization" ON proposal_scopes;
DROP POLICY IF EXISTS "Users can delete scopes from their organization" ON proposal_scopes;

-- Create RLS policies
CREATE POLICY "Users can view scopes from their organization"
  ON proposal_scopes
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scopes for their organization"
  ON proposal_scopes
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scopes from their organization"
  ON proposal_scopes
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scopes from their organization"
  ON proposal_scopes
  FOR DELETE
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE proposal_scopes IS 'Phase 3 Step 2: Stores staff-generated proposal scopes for client ideas with Good/Better/Best packages';

-- Add comments to columns
COMMENT ON COLUMN proposal_scopes.scope_data IS 'Full ProposalScope object stored as JSONB (sections, packages, metadata)';
COMMENT ON COLUMN proposal_scopes.status IS 'draft = saved by staff, sent = sent to client';
COMMENT ON COLUMN proposal_scopes.created_by IS 'Email or user ID of staff member who created the scope';
COMMENT ON COLUMN proposal_scopes.updated_by IS 'Email or user ID of staff member who last updated the scope';
