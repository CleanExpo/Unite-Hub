-- Create resource types enum
CREATE TYPE resource_type AS ENUM ('whitepaper', 'template', 'checklist', 'ebook', 'guide', 'case_study');

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type resource_type NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  file_size INTEGER, -- in bytes
  page_count INTEGER,
  download_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  requires_auth BOOLEAN DEFAULT FALSE,
  requires_form BOOLEAN DEFAULT TRUE, -- for gated content
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource downloads tracking table
CREATE TABLE IF NOT EXISTS resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource recommendations table
CREATE TABLE IF NOT EXISTS resource_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  recommended_resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  score DECIMAL(3, 2) DEFAULT 0.5, -- 0 to 1 relevance score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_id, recommended_resource_id)
);

-- Create indexes
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_category ON resources(category_id);
CREATE INDEX idx_resources_author ON resources(author_id);
CREATE INDEX idx_resources_slug ON resources(slug);
CREATE INDEX idx_resources_published_at ON resources(published_at DESC);
CREATE INDEX idx_resource_downloads_resource ON resource_downloads(resource_id);
CREATE INDEX idx_resource_downloads_user ON resource_downloads(user_id);
CREATE INDEX idx_resource_downloads_email ON resource_downloads(email);
CREATE INDEX idx_resource_recommendations_resource ON resource_recommendations(resource_id);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_recommendations ENABLE ROW LEVEL SECURITY;

-- Resources policies
CREATE POLICY "Resources are viewable by everyone" ON resources
  FOR SELECT USING (true);

CREATE POLICY "Authors can manage resources" ON resources
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM authors WHERE id = resources.author_id)
  );

-- Resource downloads policies
CREATE POLICY "Users can view their own downloads" ON resource_downloads
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can download resources" ON resource_downloads
  FOR INSERT WITH CHECK (true);

-- Resource recommendations policies
CREATE POLICY "Recommendations are viewable by everyone" ON resource_recommendations
  FOR SELECT USING (true);

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_resource_downloads(resource_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get related resources
CREATE OR REPLACE FUNCTION get_related_resources(
  p_resource_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  type resource_type,
  thumbnail_url TEXT,
  download_count INTEGER,
  relevance_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.slug,
    r.description,
    r.type,
    r.thumbnail_url,
    r.download_count,
    COALESCE(rr.score, 0.5) as relevance_score
  FROM resources r
  LEFT JOIN resource_recommendations rr 
    ON r.id = rr.recommended_resource_id 
    AND rr.resource_id = p_resource_id
  WHERE r.id != p_resource_id
    AND r.published_at <= NOW()
  ORDER BY 
    COALESCE(rr.score, 0.5) DESC,
    r.download_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Insert sample resources
INSERT INTO resources (title, slug, description, type, file_url, thumbnail_url, featured, requires_form) VALUES
  ('Digital Transformation Guide 2025', 'digital-transformation-guide-2025', 'Comprehensive guide to implementing digital transformation in your organization', 'guide', '/resources/digital-transformation-guide-2025.pdf', '/images/resources/digital-transformation-thumb.jpg', true, true),
  ('SEO Checklist for E-commerce', 'seo-checklist-ecommerce', 'Complete checklist for optimizing your e-commerce site for search engines', 'checklist', '/resources/seo-checklist-ecommerce.pdf', '/images/resources/seo-checklist-thumb.jpg', true, true),
  ('Business Strategy Template', 'business-strategy-template', 'Professional template for creating comprehensive business strategies', 'template', '/resources/business-strategy-template.docx', '/images/resources/strategy-template-thumb.jpg', false, true),
  ('Cloud Migration Whitepaper', 'cloud-migration-whitepaper', 'In-depth analysis of cloud migration strategies and best practices', 'whitepaper', '/resources/cloud-migration-whitepaper.pdf', '/images/resources/cloud-migration-thumb.jpg', false, true),
  ('Software Development Best Practices', 'software-development-best-practices-ebook', 'Essential guide to modern software development methodologies', 'ebook', '/resources/software-dev-best-practices.pdf', '/images/resources/software-dev-thumb.jpg', true, true)
ON CONFLICT (slug) DO NOTHING;

-- Create some sample recommendations
INSERT INTO resource_recommendations (resource_id, recommended_resource_id, score) 
SELECT 
  r1.id,
  r2.id,
  0.8
FROM resources r1, resources r2
WHERE r1.slug = 'digital-transformation-guide-2025' 
  AND r2.slug = 'cloud-migration-whitepaper'
ON CONFLICT DO NOTHING;

INSERT INTO resource_recommendations (resource_id, recommended_resource_id, score) 
SELECT 
  r1.id,
  r2.id,
  0.9
FROM resources r1, resources r2
WHERE r1.slug = 'seo-checklist-ecommerce' 
  AND r2.slug = 'business-strategy-template'
ON CONFLICT DO NOTHING;
