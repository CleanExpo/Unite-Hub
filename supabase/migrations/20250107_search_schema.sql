-- Enable full-text search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create search indices table
CREATE TABLE IF NOT EXISTS search_indices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'page', 'service', 'blog', 'resource', 'case_study'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT NOT NULL,
  meta_description TEXT,
  tags TEXT[],
  category TEXT,
  locale TEXT DEFAULT 'en',
  priority INTEGER DEFAULT 50,
  last_indexed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search queries table for analytics
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  clicked_result TEXT,
  search_filters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search suggestions table
CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  frequency INTEGER DEFAULT 1,
  type TEXT, -- 'query', 'product', 'service', 'topic'
  related_terms TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GIN indices for full-text search
CREATE INDEX idx_search_indices_content_gin ON search_indices USING gin(to_tsvector('english', content));
CREATE INDEX idx_search_indices_title_gin ON search_indices USING gin(to_tsvector('english', title));
CREATE INDEX idx_search_indices_tags_gin ON search_indices USING gin(tags);
CREATE INDEX idx_search_indices_type ON search_indices(type);
CREATE INDEX idx_search_indices_locale ON search_indices(locale);

-- Create trigram indices for fuzzy search
CREATE INDEX idx_search_indices_title_trgm ON search_indices USING gin(title gin_trgm_ops);
CREATE INDEX idx_search_indices_content_trgm ON search_indices USING gin(content gin_trgm_ops);

-- Create index for search queries
CREATE INDEX idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX idx_search_queries_query ON search_queries(query);

-- Create index for search suggestions
CREATE INDEX idx_search_suggestions_term ON search_suggestions(term);
CREATE INDEX idx_search_suggestions_frequency ON search_suggestions(frequency DESC);

-- Function to search content
CREATE OR REPLACE FUNCTION search_content(
  search_query TEXT,
  search_type TEXT DEFAULT NULL,
  search_locale TEXT DEFAULT 'en',
  limit_results INTEGER DEFAULT 10,
  offset_results INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  content TEXT,
  url TEXT,
  meta_description TEXT,
  tags TEXT[],
  category TEXT,
  rank REAL,
  highlight TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_results AS (
    SELECT 
      si.id,
      si.type,
      si.title,
      si.content,
      si.url,
      si.meta_description,
      si.tags,
      si.category,
      ts_rank(
        to_tsvector('english', si.title || ' ' || si.content),
        plainto_tsquery('english', search_query)
      ) + 
      CASE 
        WHEN si.title ILIKE '%' || search_query || '%' THEN 2.0
        ELSE 0.0
      END AS rank,
      ts_headline(
        'english',
        si.content,
        plainto_tsquery('english', search_query),
        'MaxWords=50, MinWords=25, StartSel=<mark>, StopSel=</mark>'
      ) AS highlight
    FROM search_indices si
    WHERE 
      si.locale = search_locale
      AND (search_type IS NULL OR si.type = search_type)
      AND (
        to_tsvector('english', si.title || ' ' || si.content) @@ plainto_tsquery('english', search_query)
        OR si.title ILIKE '%' || search_query || '%'
        OR si.content ILIKE '%' || search_query || '%'
        OR search_query = ANY(si.tags)
      )
  )
  SELECT * FROM ranked_results
  ORDER BY rank DESC, title
  LIMIT limit_results
  OFFSET offset_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  partial_query TEXT,
  limit_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  term TEXT,
  type TEXT,
  frequency INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.term,
    ss.type,
    ss.frequency
  FROM search_suggestions ss
  WHERE ss.term ILIKE partial_query || '%'
  ORDER BY 
    CASE WHEN ss.term ILIKE partial_query || '%' THEN 0 ELSE 1 END,
    ss.frequency DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Function to record search query
CREATE OR REPLACE FUNCTION record_search_query(
  query_text TEXT,
  results INTEGER,
  user_uuid UUID DEFAULT NULL,
  session TEXT DEFAULT NULL,
  filters JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  query_id UUID;
BEGIN
  INSERT INTO search_queries (query, results_count, user_id, session_id, search_filters)
  VALUES (query_text, results, user_uuid, session, filters)
  RETURNING id INTO query_id;
  
  -- Update suggestion frequency
  INSERT INTO search_suggestions (term, frequency)
  VALUES (LOWER(query_text), 1)
  ON CONFLICT (term) 
  DO UPDATE SET 
    frequency = search_suggestions.frequency + 1,
    updated_at = NOW();
    
  RETURN query_id;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_indices_updated_at
  BEFORE UPDATE ON search_indices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_suggestions_updated_at
  BEFORE UPDATE ON search_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial search indices (sample data)
INSERT INTO search_indices (type, title, content, url, meta_description, tags, category, locale) VALUES
  ('page', 'Home', 'Unite Group - Software Engineering & SEO Experts. Transform your business with our comprehensive digital solutions.', '/', 'Transform your business with Unite Group''s expert software engineering and SEO services.', ARRAY['home', 'software', 'seo', 'consulting'], 'main', 'en'),
  ('service', 'Software Development', 'Custom software development services tailored to your business needs. We build scalable, secure, and innovative solutions.', '/services/software-development', 'Expert software development services by Unite Group.', ARRAY['software', 'development', 'custom', 'solutions'], 'services', 'en'),
  ('service', 'Strategic SEO', 'Boost your online visibility with our strategic SEO services. We help you rank higher and attract more customers.', '/services/strategic-seo', 'Strategic SEO services to boost your online presence.', ARRAY['seo', 'search', 'optimization', 'ranking'], 'services', 'en'),
  ('page', 'About Us', 'Learn about Unite Group''s mission, values, and expert team. We''re dedicated to helping businesses succeed.', '/about-us', 'About Unite Group - Your trusted technology partner.', ARRAY['about', 'team', 'company', 'mission'], 'main', 'en'),
  ('page', 'Blog', 'Insights and articles about software development, SEO, and business strategy from Unite Group experts.', '/blog', 'Unite Group Blog - Expert insights on technology and business.', ARRAY['blog', 'articles', 'insights', 'news'], 'content', 'en'),
  ('page', 'Resources', 'Free resources, templates, and guides to help your business grow.', '/resources', 'Free business resources and templates by Unite Group.', ARRAY['resources', 'templates', 'guides', 'downloads'], 'content', 'en');

-- Grant permissions
GRANT SELECT ON search_indices TO anon;
GRANT SELECT ON search_suggestions TO anon;
GRANT INSERT ON search_queries TO anon;
GRANT EXECUTE ON FUNCTION search_content TO anon;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO anon;
GRANT EXECUTE ON FUNCTION record_search_query TO anon;
