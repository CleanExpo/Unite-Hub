-- CEO Operating System: Boardroom tables
-- board_meetings, board_meeting_notes, ceo_decisions, team_members

CREATE TABLE board_meetings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_date date NOT NULL DEFAULT CURRENT_DATE,
  status       text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','acted','archived')),
  agenda       jsonb NOT NULL DEFAULT '{}',
  brief_md     text NOT NULL DEFAULT '',
  github_data  jsonb DEFAULT '{}',
  linear_data  jsonb DEFAULT '{}',
  xero_data    jsonb DEFAULT '{}',
  metrics      jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (founder_id, meeting_date)
);

CREATE TABLE board_meeting_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES board_meetings(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ceo_decisions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  type         text NOT NULL CHECK (type IN ('strategic','budget','timeline','shipping','hiring')),
  rationale    text,
  amount_aud   numeric(12,2),
  deadline     date,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','decided','completed','cancelled')),
  business_key text,
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE team_members (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  role           text NOT NULL CHECK (role IN ('ai-agent','developer','designer','advisor')),
  email          text,
  github_login   text,
  linear_user_id text,
  avatar_url     text,
  active         boolean NOT NULL DEFAULT true,
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX ON board_meetings (founder_id, meeting_date DESC);
CREATE INDEX ON board_meeting_notes (meeting_id, created_at);
CREATE INDEX ON ceo_decisions (founder_id, status, deadline);
CREATE INDEX ON team_members (founder_id, active);

ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder owns board_meetings" ON board_meetings
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY "founder owns board_meeting_notes" ON board_meeting_notes
  FOR ALL USING (
    meeting_id IN (SELECT id FROM board_meetings WHERE founder_id = auth.uid())
  );

CREATE POLICY "founder owns ceo_decisions" ON ceo_decisions
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY "founder owns team_members" ON team_members
  FOR ALL USING (founder_id = auth.uid());
