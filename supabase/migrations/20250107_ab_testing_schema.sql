-- A/B Testing Framework Schema
-- This migration creates the necessary tables for A/B testing functionality

-- Experiments master table
CREATE TABLE IF NOT EXISTS experiments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  hypothesis TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  traffic_percentage DECIMAL(5,2) DEFAULT 100.00 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment variants table
CREATE TABLE IF NOT EXISTS experiment_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(3,2) DEFAULT 0.50 CHECK (weight >= 0 AND weight <= 1),
  config JSONB DEFAULT '{}',
  is_control BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experiment_id, name)
);

-- User assignments table
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES experiment_variants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experiment_id, user_id),
  UNIQUE(experiment_id, session_id)
);

-- Results tracking table
CREATE TABLE IF NOT EXISTS experiment_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES experiment_variants(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES experiment_assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  event_name VARCHAR(255) NOT NULL,
  event_value JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment goals table
CREATE TABLE IF NOT EXISTS experiment_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_name VARCHAR(255) NOT NULL,
  target_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experiment_id, name)
);

-- Create indexes for performance
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_dates ON experiments(start_date, end_date);
CREATE INDEX idx_experiment_variants_experiment ON experiment_variants(experiment_id);
CREATE INDEX idx_experiment_assignments_user ON experiment_assignments(user_id);
CREATE INDEX idx_experiment_assignments_session ON experiment_assignments(session_id);
CREATE INDEX idx_experiment_results_experiment ON experiment_results(experiment_id);
CREATE INDEX idx_experiment_results_variant ON experiment_results(variant_id);
CREATE INDEX idx_experiment_results_event ON experiment_results(event_name);
CREATE INDEX idx_experiment_results_created ON experiment_results(created_at);

-- Create views for analytics
CREATE VIEW experiment_variant_performance AS
SELECT 
  ev.experiment_id,
  ev.id AS variant_id,
  ev.name AS variant_name,
  ev.is_control,
  COUNT(DISTINCT ea.id) AS total_assignments,
  COUNT(DISTINCT er.assignment_id) AS engaged_users,
  COUNT(er.id) AS total_events,
  CASE 
    WHEN COUNT(DISTINCT ea.id) > 0 
    THEN COUNT(DISTINCT er.assignment_id)::DECIMAL / COUNT(DISTINCT ea.id) * 100
    ELSE 0 
  END AS engagement_rate
FROM experiment_variants ev
LEFT JOIN experiment_assignments ea ON ev.id = ea.variant_id
LEFT JOIN experiment_results er ON ea.id = er.assignment_id
GROUP BY ev.experiment_id, ev.id, ev.name, ev.is_control;

-- Create function to get random variant based on weights
CREATE OR REPLACE FUNCTION get_experiment_variant(p_experiment_id UUID)
RETURNS UUID AS $$
DECLARE
  v_variant_id UUID;
  v_random DECIMAL;
  v_cumulative_weight DECIMAL := 0;
BEGIN
  v_random := random();
  
  SELECT id INTO v_variant_id
  FROM (
    SELECT 
      id,
      SUM(weight) OVER (ORDER BY id) / SUM(weight) OVER () AS cumulative_weight
    FROM experiment_variants
    WHERE experiment_id = p_experiment_id
  ) weighted_variants
  WHERE v_random <= cumulative_weight
  ORDER BY cumulative_weight
  LIMIT 1;
  
  RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to assign user to experiment
CREATE OR REPLACE FUNCTION assign_user_to_experiment(
  p_experiment_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE(variant_id UUID, variant_name VARCHAR(255), is_new_assignment BOOLEAN) AS $$
DECLARE
  v_variant_id UUID;
  v_variant_name VARCHAR(255);
  v_existing_assignment UUID;
  v_is_new BOOLEAN := false;
BEGIN
  -- Check if user/session already assigned
  IF p_user_id IS NOT NULL THEN
    SELECT ea.variant_id INTO v_existing_assignment
    FROM experiment_assignments ea
    WHERE ea.experiment_id = p_experiment_id
      AND ea.user_id = p_user_id;
  ELSIF p_session_id IS NOT NULL THEN
    SELECT ea.variant_id INTO v_existing_assignment
    FROM experiment_assignments ea
    WHERE ea.experiment_id = p_experiment_id
      AND ea.session_id = p_session_id;
  END IF;
  
  IF v_existing_assignment IS NOT NULL THEN
    -- Return existing assignment
    SELECT ev.id, ev.name INTO v_variant_id, v_variant_name
    FROM experiment_variants ev
    WHERE ev.id = v_existing_assignment;
  ELSE
    -- Get random variant based on weights
    v_variant_id := get_experiment_variant(p_experiment_id);
    
    -- Create new assignment
    INSERT INTO experiment_assignments (experiment_id, variant_id, user_id, session_id)
    VALUES (p_experiment_id, v_variant_id, p_user_id, p_session_id);
    
    SELECT ev.name INTO v_variant_name
    FROM experiment_variants ev
    WHERE ev.id = v_variant_id;
    
    v_is_new := true;
  END IF;
  
  RETURN QUERY SELECT v_variant_id, v_variant_name, v_is_new;
END;
$$ LANGUAGE plpgsql;

-- Create function to track experiment event
CREATE OR REPLACE FUNCTION track_experiment_event(
  p_experiment_id UUID,
  p_event_name VARCHAR(255),
  p_event_value JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_assignment_id UUID;
  v_variant_id UUID;
BEGIN
  -- Find assignment
  SELECT ea.id, ea.variant_id INTO v_assignment_id, v_variant_id
  FROM experiment_assignments ea
  WHERE ea.experiment_id = p_experiment_id
    AND (
      (p_user_id IS NOT NULL AND ea.user_id = p_user_id)
      OR (p_session_id IS NOT NULL AND ea.session_id = p_session_id)
    );
  
  IF v_assignment_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Insert event
  INSERT INTO experiment_results (
    experiment_id, 
    variant_id, 
    assignment_id, 
    user_id, 
    session_id, 
    event_name, 
    event_value
  )
  VALUES (
    p_experiment_id,
    v_variant_id,
    v_assignment_id,
    p_user_id,
    p_session_id,
    p_event_name,
    p_event_value
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate experiment statistics
CREATE OR REPLACE FUNCTION calculate_experiment_stats(p_experiment_id UUID)
RETURNS TABLE(
  variant_id UUID,
  variant_name VARCHAR(255),
  is_control BOOLEAN,
  sample_size INTEGER,
  conversions INTEGER,
  conversion_rate DECIMAL,
  confidence_level DECIMAL,
  is_significant BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH variant_stats AS (
    SELECT 
      ev.id AS variant_id,
      ev.name AS variant_name,
      ev.is_control,
      COUNT(DISTINCT ea.id) AS sample_size,
      COUNT(DISTINCT CASE 
        WHEN er.event_name IN (
          SELECT eg.event_name 
          FROM experiment_goals eg 
          WHERE eg.experiment_id = p_experiment_id
        ) 
        THEN er.assignment_id 
      END) AS conversions
    FROM experiment_variants ev
    LEFT JOIN experiment_assignments ea ON ev.id = ea.variant_id
    LEFT JOIN experiment_results er ON ea.id = er.assignment_id
    WHERE ev.experiment_id = p_experiment_id
    GROUP BY ev.id, ev.name, ev.is_control
  ),
  control_stats AS (
    SELECT * FROM variant_stats WHERE is_control = true LIMIT 1
  )
  SELECT 
    vs.variant_id,
    vs.variant_name,
    vs.is_control,
    vs.sample_size,
    vs.conversions,
    CASE 
      WHEN vs.sample_size > 0 
      THEN vs.conversions::DECIMAL / vs.sample_size 
      ELSE 0 
    END AS conversion_rate,
    -- Simplified confidence calculation (would use proper statistical methods in production)
    CASE 
      WHEN vs.sample_size >= 100 AND cs.sample_size >= 100
      THEN 95.0
      WHEN vs.sample_size >= 30 AND cs.sample_size >= 30
      THEN 90.0
      ELSE 0.0
    END AS confidence_level,
    -- Simplified significance test
    CASE 
      WHEN vs.sample_size >= 30 AND cs.sample_size >= 30
        AND ABS(
          (vs.conversions::DECIMAL / NULLIF(vs.sample_size, 0)) - 
          (cs.conversions::DECIMAL / NULLIF(cs.sample_size, 0))
        ) > 0.05
      THEN true
      ELSE false
    END AS is_significant
  FROM variant_stats vs
  CROSS JOIN control_stats cs
  ORDER BY vs.is_control DESC, vs.variant_name;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_goals ENABLE ROW LEVEL SECURITY;

-- Policies for experiments (admin only for now)
CREATE POLICY "Admins can manage experiments" ON experiments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage variants" ON experiment_variants
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view assignments" ON experiment_assignments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can create assignments" ON experiment_assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view results" ON experiment_results
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can create results" ON experiment_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage goals" ON experiment_goals
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT ON experiments TO authenticated;
GRANT SELECT ON experiment_variants TO authenticated;
GRANT SELECT, INSERT ON experiment_assignments TO authenticated;
GRANT SELECT, INSERT ON experiment_results TO authenticated;
GRANT SELECT ON experiment_goals TO authenticated;
GRANT SELECT ON experiment_variant_performance TO authenticated;

-- Sample data for testing
INSERT INTO experiments (name, description, hypothesis, status)
VALUES 
  ('Homepage CTA Test', 'Test different CTA button colors', 'A green CTA button will increase conversions by 15%', 'draft'),
  ('Pricing Page Layout', 'Test grid vs list layout for pricing', 'Grid layout will improve plan selection by 20%', 'draft');
