-- Extended CRM Messaging Schema for Teams-like functionality
-- This extends the existing messaging schema with advanced features

-- Message Reactions Table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- File Attachments Table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Typing Indicators Table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 seconds',
  UNIQUE(channel_id, user_id)
);

-- Read Receipts Table
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Channel Permissions Table
CREATE TABLE IF NOT EXISTS channel_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT true,
  can_manage BOOLEAN DEFAULT false,
  can_invite BOOLEAN DEFAULT false,
  can_delete_messages BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Message Threads Table
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reply_at TIMESTAMP WITH TIME ZONE,
  reply_count INTEGER DEFAULT 0,
  participant_count INTEGER DEFAULT 0
);

-- Thread Participants Table
CREATE TABLE IF NOT EXISTS thread_participants (
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY(thread_id, user_id)
);

-- Pinned Messages Table
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES auth.users(id),
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, message_id)
);

-- User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Mentions Table
CREATE TABLE IF NOT EXISTS message_mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_at INTEGER NOT NULL, -- Position in message where mention occurs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, mentioned_user_id)
);

-- Add thread_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES message_threads(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS formatted_content JSONB;

-- Add channel settings
ALTER TABLE channels ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "notifications": true,
  "allow_threads": true,
  "allow_reactions": true,
  "allow_file_uploads": true,
  "max_file_size": 10485760,
  "allowed_file_types": ["image/*", "application/pdf", "text/*"],
  "message_retention_days": null
}';

-- Create indexes for performance
CREATE INDEX idx_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_reactions_user ON message_reactions(user_id);
CREATE INDEX idx_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_typing_channel ON typing_indicators(channel_id);
CREATE INDEX idx_typing_expires ON typing_indicators(expires_at);
CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON message_read_receipts(user_id);
CREATE INDEX idx_permissions_channel ON channel_permissions(channel_id);
CREATE INDEX idx_permissions_user ON channel_permissions(user_id);
CREATE INDEX idx_threads_parent ON message_threads(parent_message_id);
CREATE INDEX idx_threads_channel ON message_threads(channel_id);
CREATE INDEX idx_pinned_channel ON pinned_messages(channel_id);
CREATE INDEX idx_presence_status ON user_presence(status);
CREATE INDEX idx_presence_expires ON user_presence(expires_at);
CREATE INDEX idx_mentions_message ON message_mentions(message_id);
CREATE INDEX idx_mentions_user ON message_mentions(mentioned_user_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reactions
CREATE POLICY "Users can view reactions in their channels" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.id = message_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages in their channels" ON message_reactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.id = message_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions" ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments in their channels" ON message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.id = message_attachments.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload attachments to their messages" ON message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for typing indicators
CREATE POLICY "Users can view typing indicators in their channels" ON typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = typing_indicators.channel_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can set their own typing indicators" ON typing_indicators
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for read receipts
CREATE POLICY "Users can view read receipts for their messages" ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_read_receipts.message_id
      AND (m.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM channel_members cm
        WHERE cm.channel_id = m.channel_id
        AND cm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can mark messages as read" ON message_read_receipts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Functions for real-time features
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id IS NOT NULL THEN
    UPDATE message_threads
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_stats_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_stats();

-- Function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id UUID,
  p_status VARCHAR(50),
  p_status_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, status_message, last_active, expires_at)
  VALUES (
    p_user_id,
    p_status,
    p_status_message,
    NOW(),
    CASE 
      WHEN p_status = 'online' THEN NOW() + INTERVAL '5 minutes'
      ELSE NULL
    END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET status = EXCLUDED.status,
      status_message = EXCLUDED.status_message,
      last_active = EXCLUDED.last_active,
      expires_at = EXCLUDED.expires_at;
END;
$$ LANGUAGE plpgsql;
