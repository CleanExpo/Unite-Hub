-- Create pipeline stages table
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create pipeline deals table
CREATE TABLE pipeline_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create pipeline deals comments table for collaboration
CREATE TABLE pipeline_deal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES pipeline_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on pipeline_deals for stage_id
CREATE INDEX idx_pipeline_deals_stage_id ON pipeline_deals(stage_id);

-- Create index on pipeline_deal_comments for deal_id
CREATE INDEX idx_pipeline_deal_comments_deal_id ON pipeline_deal_comments(deal_id);

-- Add assignee index
CREATE INDEX idx_pipeline_deals_assigned_to ON pipeline_deals(assigned_to);

-- Create automation rules table
CREATE TABLE pipeline_automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trigger_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('stage_entered', 'stage_exited', 'deal_created')),
  action_type TEXT NOT NULL CHECK (action_type IN ('assign_user', 'send_email', 'create_task', 'send_notification')),
  action_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
