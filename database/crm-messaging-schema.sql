-- CRM Teams Messaging Schema
-- Complete messaging system for Unite Group CRM

-- Create channels table
CREATE TABLE IF NOT EXISTS crm_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create channel members table
CREATE TABLE IF NOT EXISTS crm_channel_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES crm_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    UNIQUE(channel_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS crm_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES crm_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'file', 'image', 'system')),
    parent_id UUID REFERENCES crm_messages(id) ON DELETE CASCADE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS crm_message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES crm_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Create file attachments table
CREATE TABLE IF NOT EXISTS crm_message_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES crm_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mentions table
CREATE TABLE IF NOT EXISTS crm_message_mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES crm_messages(id) ON DELETE CASCADE,
    mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, mentioned_user_id)
);

-- Create unread counts table
CREATE TABLE IF NOT EXISTS crm_unread_counts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES crm_channels(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    last_message_id UUID REFERENCES crm_messages(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, channel_id)
);

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS crm_typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES crm_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_messages_channel_created ON crm_messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_user ON crm_messages(user_id);
CREATE INDEX idx_channel_members_user ON crm_channel_members(user_id);
CREATE INDEX idx_mentions_user ON crm_message_mentions(mentioned_user_id);
CREATE INDEX idx_unread_user ON crm_unread_counts(user_id);
CREATE INDEX idx_typing_channel ON crm_typing_indicators(channel_id);

-- Create views for easier querying
CREATE OR REPLACE VIEW crm_channel_details AS
SELECT 
    c.*,
    COUNT(DISTINCT cm.user_id) as member_count,
    MAX(m.created_at) as last_message_at
FROM crm_channels c
LEFT JOIN crm_channel_members cm ON c.id = cm.channel_id
LEFT JOIN crm_messages m ON c.id = m.channel_id AND m.is_deleted = FALSE
GROUP BY c.id;

-- Create function to update last_read_at
CREATE OR REPLACE FUNCTION update_last_read_at(p_user_id UUID, p_channel_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE crm_channel_members
    SET last_read_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND channel_id = p_channel_id;
    
    -- Reset unread count
    UPDATE crm_unread_counts
    SET unread_count = 0, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND channel_id = p_channel_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment unread count
CREATE OR REPLACE FUNCTION increment_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment unread count for all members except the sender
    INSERT INTO crm_unread_counts (user_id, channel_id, unread_count, last_message_id)
    SELECT 
        cm.user_id,
        NEW.channel_id,
        1,
        NEW.id
    FROM crm_channel_members cm
    WHERE cm.channel_id = NEW.channel_id AND cm.user_id != NEW.user_id
    ON CONFLICT (user_id, channel_id) DO UPDATE
    SET 
        unread_count = crm_unread_counts.unread_count + 1,
        last_message_id = NEW.id,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for unread counts
CREATE TRIGGER trigger_increment_unread
AFTER INSERT ON crm_messages
FOR EACH ROW
WHEN (NEW.is_deleted = FALSE AND NEW.type != 'system')
EXECUTE FUNCTION increment_unread_counts();

-- Create function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM crm_typing_indicators
    WHERE started_at < CURRENT_TIMESTAMP - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE crm_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_unread_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Channels: Users can see channels they're members of
CREATE POLICY "Users can see their channels" ON crm_channels
    FOR SELECT USING (
        id IN (
            SELECT channel_id FROM crm_channel_members WHERE user_id = auth.uid()
        )
    );

-- Channel members: Users can see members of their channels
CREATE POLICY "Users can see channel members" ON crm_channel_members
    FOR SELECT USING (
        channel_id IN (
            SELECT channel_id FROM crm_channel_members WHERE user_id = auth.uid()
        )
    );

-- Messages: Users can see messages in their channels
CREATE POLICY "Users can see channel messages" ON crm_messages
    FOR SELECT USING (
        channel_id IN (
            SELECT channel_id FROM crm_channel_members WHERE user_id = auth.uid()
        )
    );

-- Messages: Users can create messages in their channels
CREATE POLICY "Users can create messages" ON crm_messages
    FOR INSERT WITH CHECK (
        channel_id IN (
            SELECT channel_id FROM crm_channel_members WHERE user_id = auth.uid()
        ) AND user_id = auth.uid()
    );

-- Messages: Users can edit their own messages
CREATE POLICY "Users can edit own messages" ON crm_messages
    FOR UPDATE USING (user_id = auth.uid());

-- Add sample data
INSERT INTO crm_channels (name, description, type, created_by) VALUES
    ('General', 'General discussion for all team members', 'public', NULL),
    ('Sales Team', 'Sales team collaboration', 'private', NULL),
    ('Support', 'Customer support coordination', 'public', NULL),
    ('Announcements', 'Company-wide announcements', 'public', NULL);
