-- Phase 10 Week 3-4: Collaborative Review
-- Adds threaded comments, consensus tracking, and conflict resolution

-- Review Comments Table
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES autonomy_proposals(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES operator_approval_queue(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

  -- Author
  author_id UUID NOT NULL REFERENCES auth.users(id),
  author_role TEXT NOT NULL CHECK (author_role IN ('OWNER', 'MANAGER', 'ANALYST')),

  -- Content
  content TEXT NOT NULL,

  -- Threading
  parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
  thread_depth INTEGER NOT NULL DEFAULT 0,

  -- Comment type
  comment_type TEXT NOT NULL DEFAULT 'COMMENT' CHECK (
    comment_type IN ('COMMENT', 'APPROVAL', 'REJECTION', 'QUESTION', 'SUGGESTION', 'RESOLUTION')
  ),

  -- Reactions
  reactions JSONB DEFAULT '{}',

  -- Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consensus Votes Table
CREATE TABLE IF NOT EXISTS consensus_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES operator_approval_queue(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES autonomy_proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

  -- Voter
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  voter_role TEXT NOT NULL CHECK (voter_role IN ('OWNER', 'MANAGER', 'ANALYST')),

  -- Vote
  vote TEXT NOT NULL CHECK (vote IN ('APPROVE', 'REJECT', 'ABSTAIN', 'DEFER')),
  vote_weight INTEGER NOT NULL DEFAULT 1,

  -- Reasoning
  reason TEXT,

  -- Override
  is_override BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One vote per user per queue item
  UNIQUE(queue_item_id, voter_id)
);

-- Review Conflicts Table
CREATE TABLE IF NOT EXISTS review_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES operator_approval_queue(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

  -- Conflict type
  conflict_type TEXT NOT NULL CHECK (
    conflict_type IN (
      'CONFLICTING_VOTES',
      'EXPIRED_REVIEW',
      'DOMAIN_DISPUTE',
      'QUORUM_DEADLOCK',
      'AUTHORITY_CONFLICT'
    )
  ),

  -- Details
  description TEXT NOT NULL,
  affected_voters UUID[],

  -- Resolution
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ESCALATED', 'RESOLVED', 'DISMISSED')),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operator Activity Stream Table
CREATE TABLE IF NOT EXISTS operator_activity_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

  -- Activity
  activity_type TEXT NOT NULL CHECK (
    activity_type IN (
      'COMMENT_ADDED',
      'VOTE_CAST',
      'CONSENSUS_REACHED',
      'CONFLICT_DETECTED',
      'CONFLICT_RESOLVED',
      'ESCALATION',
      'OVERRIDE_USED',
      'QUEUE_ITEM_EXPIRED'
    )
  ),

  -- Actor
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,

  -- Related entities
  queue_item_id UUID REFERENCES operator_approval_queue(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES autonomy_proposals(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES review_comments(id) ON DELETE SET NULL,
  vote_id UUID REFERENCES consensus_votes(id) ON DELETE SET NULL,

  -- Content
  summary TEXT NOT NULL,
  details JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_comments_proposal ON review_comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_queue ON review_comments(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_parent ON review_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_author ON review_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_consensus_votes_queue ON consensus_votes(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_consensus_votes_voter ON consensus_votes(voter_id);

CREATE INDEX IF NOT EXISTS idx_review_conflicts_queue ON review_conflicts(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_review_conflicts_status ON review_conflicts(status);

CREATE INDEX IF NOT EXISTS idx_activity_stream_org ON operator_activity_stream(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_stream_created ON operator_activity_stream(created_at DESC);

-- RLS Policies
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_activity_stream ENABLE ROW LEVEL SECURITY;

-- Review comments: operators can view and create
CREATE POLICY "Operators can view comments"
  ON review_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM operator_profiles
      WHERE user_id = auth.uid()
      AND organization_id = review_comments.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "Operators can create comments"
  ON review_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operator_profiles
      WHERE user_id = auth.uid()
      AND organization_id = review_comments.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "Authors can update own comments"
  ON review_comments FOR UPDATE
  USING (author_id = auth.uid());

-- Consensus votes: operators can view and vote
CREATE POLICY "Operators can view votes"
  ON consensus_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM operator_profiles
      WHERE user_id = auth.uid()
      AND organization_id = consensus_votes.organization_id
    )
  );

CREATE POLICY "Operators can cast votes"
  ON consensus_votes FOR INSERT
  WITH CHECK (voter_id = auth.uid());

-- Conflicts: operators can view
CREATE POLICY "Operators can view conflicts"
  ON review_conflicts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM operator_profiles
      WHERE user_id = auth.uid()
      AND organization_id = review_conflicts.organization_id
    )
  );

-- Activity stream: operators can view
CREATE POLICY "Operators can view activity"
  ON operator_activity_stream FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM operator_profiles
      WHERE user_id = auth.uid()
      AND organization_id = operator_activity_stream.organization_id
    )
  );

-- Triggers
CREATE TRIGGER update_review_comments_updated_at
  BEFORE UPDATE ON review_comments
  FOR EACH ROW EXECUTE FUNCTION update_operator_updated_at();

-- Consensus rules comment
COMMENT ON TABLE consensus_votes IS 'Consensus rules: OWNER can override (weight=10), MANAGER quorum (2 approvals needed, weight=2), ANALYST can only comment (weight=0)';
