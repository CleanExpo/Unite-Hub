-- Migration: 408_synthex_assistant_messages
-- Description: Create table for AI assistant chat messages
-- Created: 2025-12-06
-- Phase: B3 - Synthex Assistant

-- ============================================================================
-- Table: synthex_assistant_messages
-- ============================================================================
-- Stores chat history between users and the AI assistant.
-- Multi-tenant scoped by tenant_id with optional brand_id context.

CREATE TABLE IF NOT EXISTS synthex_assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant scope
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES synthex_brands(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message data
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Context tracking
  conversation_id UUID NULL, -- Group messages by conversation
  parent_message_id UUID REFERENCES synthex_assistant_messages(id) ON DELETE SET NULL,

  -- Metadata
  tokens_used INTEGER NULL,
  model_version TEXT NULL,
  meta JSONB NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_meta CHECK (meta IS NULL OR jsonb_typeof(meta) = 'object')
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Primary query: list messages by tenant + user ordered by date
DROP INDEX IF EXISTS idx_assistant_messages_tenant_user_created;
CREATE INDEX IF NOT EXISTS idx_assistant_messages_tenant_user_created
  ON synthex_assistant_messages(tenant_id, user_id, created_at DESC);

-- Filter by conversation
DROP INDEX IF EXISTS idx_assistant_messages_conversation;
CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation
  ON synthex_assistant_messages(conversation_id, created_at ASC)
  WHERE conversation_id IS NOT NULL;

-- Filter by brand context
DROP INDEX IF EXISTS idx_assistant_messages_tenant_brand;
CREATE INDEX IF NOT EXISTS idx_assistant_messages_tenant_brand
  ON synthex_assistant_messages(tenant_id, brand_id, created_at DESC)
  WHERE brand_id IS NOT NULL;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE synthex_assistant_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
DROP POLICY IF EXISTS "Users can view own messages" ON synthex_assistant_messages;
CREATE POLICY "Users can view own messages"
  ON synthex_assistant_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
DROP POLICY IF EXISTS "Users can insert own messages" ON synthex_assistant_messages;
CREATE POLICY "Users can insert own messages"
  ON synthex_assistant_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON synthex_assistant_messages;
CREATE POLICY "Users can delete own messages"
  ON synthex_assistant_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE synthex_assistant_messages IS 'AI assistant chat history for Synthex clients';
COMMENT ON COLUMN synthex_assistant_messages.tenant_id IS 'Synthex tenant this message belongs to';
COMMENT ON COLUMN synthex_assistant_messages.brand_id IS 'Optional brand context for the conversation';
COMMENT ON COLUMN synthex_assistant_messages.user_id IS 'User who sent/received the message';
COMMENT ON COLUMN synthex_assistant_messages.role IS 'Message role: user, assistant, or system';
COMMENT ON COLUMN synthex_assistant_messages.content IS 'Message content';
COMMENT ON COLUMN synthex_assistant_messages.conversation_id IS 'Groups messages into conversations';
COMMENT ON COLUMN synthex_assistant_messages.tokens_used IS 'Token count for AI responses';
COMMENT ON COLUMN synthex_assistant_messages.model_version IS 'AI model used (e.g., claude-sonnet-4-5)';
COMMENT ON COLUMN synthex_assistant_messages.meta IS 'Flexible metadata (context, attachments, etc.)';
