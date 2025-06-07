-- Create industry enum
CREATE TYPE industry_type AS ENUM (
  'technology',
  'healthcare',
  'finance',
  'retail',
  'manufacturing',
  'education',
  'real_estate',
  'hospitality',
  'logistics',
  'other'
);

-- Create case studies table
CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_logo TEXT,
  industry industry_type NOT NULL,
  services_used UUID[] DEFAULT '{}', -- Array of service IDs
  challenge TEXT NOT NULL,
  solution TEXT NOT NULL,
  results TEXT NOT NULL,
  implementation_time TEXT, -- e.g., "3 months", "6 weeks"
  project_value DECIMAL(10, 2),
  featured_image TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  demo_url TEXT,
  video_url TEXT,
  pdf_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT TRUE,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create case study metrics table
CREATE TABLE IF NOT EXISTS case_study_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_study_id UUID REFERENCES case_studies(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_improvement TEXT, -- e.g., "+150%", "3x faster"
  metric_icon TEXT, -- icon name for display
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create case study testimonials table
CREATE TABLE IF NOT EXISTS case_study_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_study_id UUID REFERENCES case_studies(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_title TEXT NOT NULL,
  author_company TEXT NOT NULL,
  author_photo TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create case study technologies table
CREATE TABLE IF NOT EXISTS case_study_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_study_id UUID REFERENCES case_studies(id) ON DELETE CASCADE,
  technology_name TEXT NOT NULL,
  technology_logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table (if not exists)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_case_studies_slug ON case_studies(slug);
CREATE INDEX idx_case_studies_industry ON case_studies(industry);
CREATE INDEX idx_case_studies_featured ON case_studies(featured);
CREATE INDEX idx_case_studies_published ON case_studies(published);
CREATE INDEX idx_case_study_metrics_case_study ON case_study_metrics(case_study_id);
CREATE INDEX idx_case_study_testimonials_case_study ON case_study_testimonials(case_study_id);
CREATE INDEX idx_case_study_technologies_case_study ON case_study_technologies(case_study_id);

-- Enable RLS
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_study_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_study_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_study_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Case studies policies
CREATE POLICY "Case studies are viewable by everyone" ON case_studies
  FOR SELECT USING (published = true);

CREATE POLICY "Admin can manage case studies" ON case_studies
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Case study metrics policies
CREATE POLICY "Metrics are viewable by everyone" ON case_study_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM case_studies 
      WHERE id = case_study_metrics.case_study_id 
      AND published = true
    )
  );

-- Case study testimonials policies
CREATE POLICY "Testimonials are viewable by everyone" ON case_study_testimonials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM case_studies 
      WHERE id = case_study_testimonials.case_study_id 
      AND published = true
    )
  );

-- Case study technologies policies
CREATE POLICY "Technologies are viewable by everyone" ON case_study_technologies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM case_studies 
      WHERE id = case_study_technologies.case_study_id 
      AND published = true
    )
  );

-- Services policies
CREATE POLICY "Services are viewable by everyone" ON services
  FOR SELECT USING (true);

-- Insert sample services
INSERT INTO services (name, slug, description, icon) VALUES
  ('Initial Consultation', 'initial-consultation', 'Strategic assessment and planning', 'Lightbulb'),
  ('Software Development', 'software-development', 'Custom software solutions', 'Code'),
  ('Strategic SEO', 'strategic-seo', 'Search engine optimization', 'Search'),
  ('Business Strategy', 'business-strategy', 'Business growth strategies', 'TrendingUp'),
  ('Quality Assurance', 'quality-assurance', 'Testing and quality control', 'Shield'),
  ('Expert Education', 'expert-education', 'Training and development', 'GraduationCap')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample case studies
WITH service_ids AS (
  SELECT 
    (SELECT id FROM services WHERE slug = 'software-development') as software_dev,
    (SELECT id FROM services WHERE slug = 'strategic-seo') as seo,
    (SELECT id FROM services WHERE slug = 'business-strategy') as strategy
)
INSERT INTO case_studies (
  title, 
  slug, 
  client_name, 
  industry, 
  services_used, 
  challenge, 
  solution, 
  results,
  implementation_time,
  featured
) 
SELECT 
  'E-commerce Platform Transformation',
  'ecommerce-platform-transformation',
  'TechRetail Corp',
  'retail',
  ARRAY[software_dev, seo],
  'Legacy platform couldn''t handle increased traffic and lacked modern features',
  'Complete platform rebuild using Next.js and cloud infrastructure with integrated SEO optimization',
  'Achieved 300% increase in conversion rate and 50% reduction in page load time',
  '4 months',
  true
FROM service_ids
ON CONFLICT (slug) DO NOTHING;

-- Insert sample metrics
INSERT INTO case_study_metrics (case_study_id, metric_name, metric_value, metric_improvement, metric_icon, display_order)
SELECT 
  cs.id,
  metric.name,
  metric.value,
  metric.improvement,
  metric.icon,
  metric.order
FROM case_studies cs
CROSS JOIN (
  VALUES 
    ('Conversion Rate', '8.2%', '+300%', 'TrendingUp', 1),
    ('Page Load Time', '1.2s', '-50%', 'Zap', 2),
    ('Monthly Revenue', '$2.5M', '+250%', 'DollarSign', 3),
    ('User Engagement', '12 min', '+180%', 'Users', 4)
) AS metric(name, value, improvement, icon, order)
WHERE cs.slug = 'ecommerce-platform-transformation'
ON CONFLICT DO NOTHING;

-- Insert sample testimonial
INSERT INTO case_study_testimonials (
  case_study_id, 
  author_name, 
  author_title, 
  author_company, 
  testimonial_text, 
  rating
)
SELECT 
  id,
  'Sarah Johnson',
  'CEO',
  'TechRetail Corp',
  'UNITE Group transformed our business. Their technical expertise and strategic approach delivered results beyond our expectations. The new platform has revolutionized how we serve our customers.',
  5
FROM case_studies
WHERE slug = 'ecommerce-platform-transformation'
ON CONFLICT DO NOTHING;

-- Insert sample technologies
INSERT INTO case_study_technologies (case_study_id, technology_name)
SELECT 
  cs.id,
  tech.name
FROM case_studies cs
CROSS JOIN (
  VALUES 
    ('Next.js'),
    ('TypeScript'),
    ('PostgreSQL'),
    ('AWS'),
    ('Stripe'),
    ('Vercel')
) AS tech(name)
WHERE cs.slug = 'ecommerce-platform-transformation'
ON CONFLICT DO NOTHING;
