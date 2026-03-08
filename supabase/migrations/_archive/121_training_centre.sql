-- Migration 121: On-Platform Training Centre
-- Phase 55: Micro-courses for client education

-- Training modules (courses)
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('platform_usage', 'ai_basics', 'seo_fundamentals', 'content_strategy', 'analytics', 'best_practices')),
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  is_published BOOLEAN DEFAULT FALSE,
  is_required BOOLEAN DEFAULT FALSE,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training lessons (within modules)
CREATE TABLE IF NOT EXISTS training_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'text', 'interactive', 'quiz')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  video_script TEXT,
  voice_script TEXT,
  duration_seconds INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User training progress
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES training_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,
  quiz_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id, lesson_id)
);

-- Training badges/achievements
CREATE TABLE IF NOT EXISTS training_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User earned badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES training_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_id)
);

-- Insert default training modules
INSERT INTO training_modules (title, slug, description, category, difficulty, estimated_minutes, is_published, is_required, order_index, learning_outcomes) VALUES
(
  'Getting Started with Unite-Hub',
  'getting-started',
  'Essential orientation for new users. Learn how to navigate the platform and complete initial setup.',
  'platform_usage',
  'beginner',
  8,
  TRUE,
  TRUE,
  1,
  '["Navigate the main dashboard", "Set up your profile", "Connect your first integration", "Understand the 90-day activation program"]'::jsonb
),
(
  'AI Basics for Business Owners',
  'ai-basics',
  'Understand how AI works in Unite-Hub without technical jargon. Learn to get better results from AI-generated content.',
  'ai_basics',
  'beginner',
  10,
  TRUE,
  FALSE,
  2,
  '["Understand what AI can and cannot do", "Write better prompts for AI", "Review and improve AI outputs", "Set realistic expectations"]'::jsonb
),
(
  'How to Brief the AI',
  'ai-briefing',
  'Learn to communicate effectively with AI for better content outputs. The quality of your brief determines the quality of results.',
  'ai_basics',
  'beginner',
  7,
  TRUE,
  FALSE,
  3,
  '["Structure an effective AI brief", "Provide useful context", "Give constructive feedback", "Iterate for better results"]'::jsonb
),
(
  'SEO & GEO Fundamentals',
  'seo-fundamentals',
  'Essential search engine optimization concepts for local service businesses. No technical background required.',
  'seo_fundamentals',
  'beginner',
  12,
  TRUE,
  FALSE,
  4,
  '["Understand how Google ranks local businesses", "Know the basics of keywords", "Learn about Google Business Profile", "Recognize realistic SEO timelines"]'::jsonb
),
(
  'Reading Your Dashboard',
  'reading-dashboard',
  'Make sense of your performance metrics and understand what the numbers mean for your business.',
  'analytics',
  'beginner',
  8,
  TRUE,
  TRUE,
  5,
  '["Interpret key metrics", "Identify trends", "Understand lead scoring", "Read performance reports"]'::jsonb
),
(
  'Understanding Your 90-Day Plan',
  'ninety-day-plan',
  'Deep dive into your activation timeline. Know what to expect and how to maximize each phase.',
  'best_practices',
  'beginner',
  10,
  TRUE,
  TRUE,
  6,
  '["Understand Phase 1, 2, and 3 goals", "Know your milestones", "Set realistic expectations", "Track your progress"]'::jsonb
);

-- Insert default badges
INSERT INTO training_badges (name, description, icon, criteria) VALUES
('Quick Starter', 'Completed the Getting Started module', 'rocket', '{"module_slug": "getting-started"}'::jsonb),
('AI Apprentice', 'Completed AI basics training', 'brain', '{"modules_completed": ["ai-basics", "ai-briefing"]}'::jsonb),
('SEO Scholar', 'Completed SEO fundamentals', 'search', '{"module_slug": "seo-fundamentals"}'::jsonb),
('Data Reader', 'Completed dashboard training', 'chart-bar', '{"module_slug": "reading-dashboard"}'::jsonb),
('Fully Onboarded', 'Completed all required training', 'check-badge', '{"all_required": true}'::jsonb),
('Knowledge Seeker', 'Completed 5+ training modules', 'book-open', '{"modules_count": 5}'::jsonb);

-- Enable RLS
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view published modules"
  ON training_modules FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Anyone can view lessons of published modules"
  ON training_lessons FOR SELECT
  USING (is_published = TRUE AND module_id IN (
    SELECT id FROM training_modules WHERE is_published = TRUE
  ));

CREATE POLICY "Users can view their own progress"
  ON training_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON training_progress FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view badges"
  ON training_badges FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can view their own earned badges"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_training_modules_category ON training_modules(category);
CREATE INDEX idx_training_modules_published ON training_modules(is_published);
CREATE INDEX idx_training_lessons_module ON training_lessons(module_id);
CREATE INDEX idx_training_progress_user ON training_progress(user_id);
CREATE INDEX idx_training_progress_module ON training_progress(module_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
