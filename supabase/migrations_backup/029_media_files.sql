-- Migration: Media Files Table for Multimedia Input System (Phase 2B)
-- Created: 2025-01-17
-- Description: Stores uploaded media files with metadata, transcripts, and AI analysis

-- ============================================================================
-- 1. CREATE media_files TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,

  -- File Metadata
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('video', 'audio', 'document', 'image', 'sketch')),
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),

  -- Storage
  storage_path TEXT NOT NULL UNIQUE,
  storage_bucket TEXT NOT NULL DEFAULT 'media-uploads',
  public_url TEXT,

  -- Processing Status
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'transcribing', 'analyzing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,

  -- Media Metadata (for video/audio)
  duration_seconds DECIMAL(10, 2),
  width INTEGER,
  height INTEGER,
  fps DECIMAL(5, 2),
  bitrate INTEGER,
  codec TEXT,

  -- Transcription (for video/audio)
  transcript JSONB, -- { segments: [{ start, end, text, confidence }], language, full_text }
  transcript_language TEXT,
  transcript_confidence DECIMAL(3, 2),
  transcribed_at TIMESTAMPTZ,

  -- AI Analysis (for all media types)
  ai_analysis JSONB, -- { summary, key_points, entities, sentiment, topics, action_items }
  ai_analyzed_at TIMESTAMPTZ,
  ai_model_used TEXT,

  -- Search & Tags
  tags TEXT[] DEFAULT '{}',
  full_text_search TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(original_filename, '') || ' ' ||
                           COALESCE((ai_analysis->>'summary')::text, '') || ' ' ||
                           COALESCE((transcript->>'full_text')::text, ''))
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_media_files_workspace_id ON public.media_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_media_files_org_id ON public.media_files(org_id);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON public.media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_project_id ON public.media_files(project_id);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON public.media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_status ON public.media_files(status);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON public.media_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_full_text_search ON public.media_files USING GIN(full_text_search);
CREATE INDEX IF NOT EXISTS idx_media_files_tags ON public.media_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_media_files_ai_analysis ON public.media_files USING GIN(ai_analysis);

-- ============================================================================
-- 3. CREATE updated_at TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_files_updated_at ON public.media_files;
CREATE TRIGGER trigger_media_files_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_media_files_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view media files in their workspace" ON public.media_files;
DROP POLICY IF EXISTS "Users can insert media files in their workspace" ON public.media_files;
DROP POLICY IF EXISTS "Users can update their own media files" ON public.media_files;
DROP POLICY IF EXISTS "Users can delete their own media files" ON public.media_files;

-- SELECT: Users can view media files in their workspace
CREATE POLICY "Users can view media files in their workspace"
  ON public.media_files
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id
      FROM public.workspaces w
      JOIN public.user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- INSERT: Users can upload media files to their workspace
CREATE POLICY "Users can insert media files in their workspace"
  ON public.media_files
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND workspace_id IN (
      SELECT w.id
      FROM public.workspaces w
      JOIN public.user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update their own media files
CREATE POLICY "Users can update their own media files"
  ON public.media_files
  FOR UPDATE
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- DELETE: Users can soft-delete their own media files
CREATE POLICY "Users can delete their own media files"
  ON public.media_files
  FOR UPDATE
  USING (uploaded_by = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.media_files TO authenticated;
GRANT SELECT ON public.media_files TO anon;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.media_files IS 'Stores uploaded multimedia files with transcription and AI analysis metadata';
COMMENT ON COLUMN public.media_files.transcript IS 'Full transcription data from OpenAI Whisper';
COMMENT ON COLUMN public.media_files.ai_analysis IS 'AI-generated insights from Claude';
COMMENT ON COLUMN public.media_files.full_text_search IS 'Auto-generated search vector for filename, transcript, and AI summary';
