-- Chat schema for Unite Group live chat system

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_email TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
    operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operator_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'operator', 'system')),
    sender_name TEXT,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat operators table
CREATE TABLE IF NOT EXISTS chat_operators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'away')),
    department TEXT,
    languages TEXT[] DEFAULT ARRAY['en'],
    specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_conversations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat templates for quick responses
CREATE TABLE IF NOT EXISTS chat_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID REFERENCES chat_operators(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    shortcuts TEXT[] DEFAULT ARRAY[]::TEXT[],
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat ratings table
CREATE TABLE IF NOT EXISTS chat_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE UNIQUE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_operator_id ON chat_conversations(operator_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_operators_status ON chat_operators(status);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE
    ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_operators_updated_at BEFORE UPDATE
    ON chat_operators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_templates_updated_at BEFORE UPDATE
    ON chat_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_message_at in conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_at_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message_at();

-- Row Level Security (RLS)
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations
CREATE POLICY "Users can view their own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = operator_id);

CREATE POLICY "Users can create conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Operators can update conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = operator_id OR auth.uid() IN (
        SELECT user_id FROM chat_operators WHERE status != 'offline'
    ));

-- Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM chat_conversations 
            WHERE user_id = auth.uid() OR operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM chat_conversations 
            WHERE user_id = auth.uid() OR operator_id = auth.uid()
        )
    );

-- Policies for chat_operators
CREATE POLICY "Anyone can view online operators" ON chat_operators
    FOR SELECT USING (status != 'offline');

CREATE POLICY "Operators can update their own profile" ON chat_operators
    FOR UPDATE USING (user_id = auth.uid());

-- Policies for chat_templates
CREATE POLICY "Operators can manage their own templates" ON chat_templates
    FOR ALL USING (operator_id IN (
        SELECT id FROM chat_operators WHERE user_id = auth.uid()
    ));

-- Policies for chat_ratings
CREATE POLICY "Users can rate their own conversations" ON chat_ratings
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM chat_conversations WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON chat_conversations TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_operators TO authenticated;
GRANT ALL ON chat_templates TO authenticated;
GRANT ALL ON chat_ratings TO authenticated;
