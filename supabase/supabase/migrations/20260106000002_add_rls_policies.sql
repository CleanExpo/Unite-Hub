-- Row Level Security (RLS) Policies
-- Enables secure access control for contractors

-- Enable RLS on tables
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Contractors: Public read access (for now)
-- In production, add authentication and restrict based on user roles
CREATE POLICY "Allow public read access to contractors"
  ON contractors
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert contractors"
  ON contractors
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update contractors"
  ON contractors
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete contractors"
  ON contractors
  FOR DELETE
  USING (true);

-- Availability Slots: Public read access (for now)
CREATE POLICY "Allow public read access to availability slots"
  ON availability_slots
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert availability slots"
  ON availability_slots
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update availability slots"
  ON availability_slots
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete availability slots"
  ON availability_slots
  FOR DELETE
  USING (true);

-- TODO: In production, replace with authenticated policies:
-- 1. Contractors can only update their own records
-- 2. Admins can manage all contractors
-- 3. Public can only read available slots
--
-- Example authenticated policy:
-- CREATE POLICY "Contractors can update own records"
--   ON contractors
--   FOR UPDATE
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);
