-- Copywriting & Business Consistency Tables
-- Part of the Marketing Framework System

-- ============================================================================
-- Business Profile Table (Single Source of Truth)
-- Master document for NAP consistency
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Identity
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  abn TEXT,
  acn TEXT,

  -- Contact (Canonical NAP)
  phone TEXT NOT NULL,
  phone_format TEXT, -- e.g., "07 XXXX XXXX"
  email TEXT,
  website_url TEXT,

  -- Location
  street_address TEXT NOT NULL,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'Australia',
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  -- Hours (JSON for flexibility)
  business_hours JSONB DEFAULT '{}',

  -- Categories
  primary_category TEXT,
  secondary_categories TEXT[],

  -- Licenses
  licenses JSONB DEFAULT '{}', -- { "qbcc": "123", "electrical": "456" }

  -- Social
  social_profiles JSONB DEFAULT '{}', -- { "facebook": "url", "instagram": "url" }

  -- Descriptions
  description_short TEXT, -- 50 words
  description_medium TEXT, -- 100 words
  description_long TEXT, -- 250 words

  -- Service Areas
  service_areas TEXT[],
  service_radius_km INT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_state CHECK (state IN ('QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'))
);

-- ============================================================================
-- Platform Listings Table
-- Track listings across platforms
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,

  -- Platform Info
  platform_name TEXT NOT NULL,
  platform_url TEXT,
  platform_tier INT NOT NULL CHECK (platform_tier >= 1 AND platform_tier <= 5),

  -- Listing Status
  claimed BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  listing_url TEXT,

  -- Current Data on Platform
  current_name TEXT,
  current_address TEXT,
  current_phone TEXT,
  current_website TEXT,
  current_hours JSONB DEFAULT '{}',

  -- Consistency Check
  name_matches BOOLEAN DEFAULT FALSE,
  address_matches BOOLEAN DEFAULT FALSE,
  phone_matches BOOLEAN DEFAULT FALSE,
  website_matches BOOLEAN DEFAULT FALSE,
  hours_matches BOOLEAN DEFAULT FALSE,
  overall_consistent BOOLEAN DEFAULT FALSE,
  consistency_score INT DEFAULT 0 CHECK (consistency_score >= 0 AND consistency_score <= 100),

  -- Issues
  issues JSONB DEFAULT '[]',

  -- Timestamps
  last_checked TIMESTAMPTZ,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, platform_name)
);

-- ============================================================================
-- Consistency Audits Table
-- Store audit results
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consistency_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,

  -- Audit Info
  audit_type TEXT NOT NULL CHECK (audit_type IN ('weekly', 'monthly', 'quarterly', 'annual', 'manual')),
  auditor TEXT,

  -- Scores
  overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  tier_1_score INT CHECK (tier_1_score >= 0 AND tier_1_score <= 100),
  tier_2_score INT CHECK (tier_2_score >= 0 AND tier_2_score <= 100),
  tier_3_score INT CHECK (tier_3_score >= 0 AND tier_3_score <= 100),

  -- Counts
  platforms_audited INT NOT NULL DEFAULT 0,
  platforms_consistent INT NOT NULL DEFAULT 0,
  issues_found INT NOT NULL DEFAULT 0,
  critical_issues INT NOT NULL DEFAULT 0,

  -- Details
  findings JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  ai_visibility_results JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Schema Markup Table
-- Store generated schema markup
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schema_markup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,

  schema_type TEXT NOT NULL CHECK (schema_type IN ('LocalBusiness', 'Organization', 'FAQ', 'HowTo', 'Service')),
  schema_json JSONB NOT NULL,
  is_valid BOOLEAN DEFAULT FALSE,
  validation_errors JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Audience Research Table
-- Voice of Customer quotes and patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audience_research (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,

  -- Source
  source_type TEXT NOT NULL CHECK (source_type IN ('review', 'forum', 'interview', 'social', 'support', 'other')),
  source_url TEXT,
  source_name TEXT,

  -- Quote
  quote TEXT NOT NULL,
  quote_date DATE,

  -- Classification
  category TEXT NOT NULL CHECK (category IN ('pain_point', 'symptom', 'dream_outcome', 'failed_solution', 'buying_decision')),
  subcategory TEXT,

  -- Analysis
  keywords TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  pattern_frequency INT DEFAULT 1, -- How many times this pattern appears
  is_gold BOOLEAN DEFAULT FALSE, -- Appears 3+ times

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Competitor Analyses Table
-- Store competitor page breakdowns
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.competitor_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Competitor Info
  competitor_name TEXT NOT NULL,
  competitor_url TEXT NOT NULL,
  competitor_location TEXT,

  -- Page Analysis
  page_type TEXT NOT NULL CHECK (page_type IN ('homepage', 'services', 'about', 'contact', 'pricing', 'faq', 'other')),
  sections JSONB DEFAULT '[]', -- [ { "type": "hero", "order": 1, "notes": "..." } ]
  unique_features JSONB DEFAULT '[]',

  -- Assessment
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],

  -- Timestamps
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Content Pieces Table
-- Store generated copy
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,

  -- Content Info
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('homepage', 'services', 'about', 'contact', 'landing', 'blog', 'email', 'social', 'other')),

  -- Content
  content TEXT NOT NULL,

  -- Integrity Tracking
  integrity_passed BOOLEAN DEFAULT FALSE,
  uniqueness_score INT CHECK (uniqueness_score >= 0 AND uniqueness_score <= 100),
  verifiability_score INT CHECK (verifiability_score >= 0 AND verifiability_score <= 100),

  -- Claims Evidence
  claims_evidence JSONB DEFAULT '[]', -- [ { "claim": "...", "evidence": "...", "verified": true } ]

  -- Validation
  validation_results JSONB DEFAULT '{}',
  plagiarism_check_passed BOOLEAN DEFAULT FALSE,
  plagiarism_check_date TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),

  -- Research Links
  research_ids UUID[], -- Links to audience_research records used

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================================================
-- Brand Guidelines Table
-- Store brand voice and word lists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brand_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,

  -- Voice
  voice_description TEXT,
  tone_keywords TEXT[],

  -- Word Lists
  approved_words TEXT[],
  banned_words TEXT[],
  industry_terms JSONB DEFAULT '{}', -- { "term": "definition" }

  -- Examples
  do_examples TEXT[],
  dont_examples TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_abn ON public.businesses(abn);
CREATE INDEX IF NOT EXISTS idx_businesses_suburb ON public.businesses(suburb);

-- Platform listings indexes
CREATE INDEX IF NOT EXISTS idx_platform_listings_business_id ON public.platform_listings(business_id);
CREATE INDEX IF NOT EXISTS idx_platform_listings_platform_name ON public.platform_listings(platform_name);
CREATE INDEX IF NOT EXISTS idx_platform_listings_tier ON public.platform_listings(platform_tier);
CREATE INDEX IF NOT EXISTS idx_platform_listings_consistent ON public.platform_listings(overall_consistent);

-- Consistency audits indexes
CREATE INDEX IF NOT EXISTS idx_consistency_audits_business_id ON public.consistency_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_consistency_audits_score ON public.consistency_audits(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_consistency_audits_created_at ON public.consistency_audits(created_at DESC);

-- Schema markup indexes
CREATE INDEX IF NOT EXISTS idx_schema_markup_business_id ON public.schema_markup(business_id);
CREATE INDEX IF NOT EXISTS idx_schema_markup_type ON public.schema_markup(schema_type);

-- Audience research indexes
CREATE INDEX IF NOT EXISTS idx_audience_research_user_id ON public.audience_research(user_id);
CREATE INDEX IF NOT EXISTS idx_audience_research_category ON public.audience_research(category);
CREATE INDEX IF NOT EXISTS idx_audience_research_is_gold ON public.audience_research(is_gold);
CREATE INDEX IF NOT EXISTS idx_audience_research_keywords ON public.audience_research USING GIN(keywords);

-- Competitor analyses indexes
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_id ON public.competitor_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_page_type ON public.competitor_analyses(page_type);

-- Content pieces indexes
CREATE INDEX IF NOT EXISTS idx_content_pieces_user_id ON public.content_pieces(user_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_business_id ON public.content_pieces(business_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_type ON public.content_pieces(content_type);
CREATE INDEX IF NOT EXISTS idx_content_pieces_status ON public.content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_integrity ON public.content_pieces(integrity_passed);

-- Brand guidelines indexes
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_business_id ON public.brand_guidelines(business_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schema_markup_updated_at
  BEFORE UPDATE ON public.schema_markup
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pieces_updated_at
  BEFORE UPDATE ON public.content_pieces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_guidelines_updated_at
  BEFORE UPDATE ON public.brand_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consistency_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_markup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_guidelines ENABLE ROW LEVEL SECURITY;

-- Businesses: Users can only access their own
CREATE POLICY "Users can view own businesses"
  ON public.businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses"
  ON public.businesses FOR DELETE
  USING (auth.uid() = user_id);

-- Platform listings: Via business ownership
CREATE POLICY "Users can view own platform listings"
  ON public.platform_listings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage own platform listings"
  ON public.platform_listings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

-- Consistency audits: Via business ownership
CREATE POLICY "Users can view own consistency audits"
  ON public.consistency_audits FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage own consistency audits"
  ON public.consistency_audits FOR ALL
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

-- Schema markup: Via business ownership
CREATE POLICY "Users can view own schema markup"
  ON public.schema_markup FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage own schema markup"
  ON public.schema_markup FOR ALL
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

-- Audience research: Users can only access their own
CREATE POLICY "Users can view own audience research"
  ON public.audience_research FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own audience research"
  ON public.audience_research FOR ALL
  USING (auth.uid() = user_id);

-- Competitor analyses: Users can only access their own
CREATE POLICY "Users can view own competitor analyses"
  ON public.competitor_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own competitor analyses"
  ON public.competitor_analyses FOR ALL
  USING (auth.uid() = user_id);

-- Content pieces: Users can only access their own
CREATE POLICY "Users can view own content pieces"
  ON public.content_pieces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own content pieces"
  ON public.content_pieces FOR ALL
  USING (auth.uid() = user_id);

-- Brand guidelines: Via business ownership
CREATE POLICY "Users can view own brand guidelines"
  ON public.brand_guidelines FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage own brand guidelines"
  ON public.brand_guidelines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.businesses IS 'Single source of truth for business NAP data';
COMMENT ON TABLE public.platform_listings IS 'Track business listings across platforms for consistency';
COMMENT ON TABLE public.consistency_audits IS 'Store NAP consistency audit results';
COMMENT ON TABLE public.schema_markup IS 'Store generated JSON-LD schema markup';
COMMENT ON TABLE public.audience_research IS 'Voice of Customer quotes and patterns from research';
COMMENT ON TABLE public.competitor_analyses IS 'Competitor page structure analysis';
COMMENT ON TABLE public.content_pieces IS 'Generated copy with integrity tracking';
COMMENT ON TABLE public.brand_guidelines IS 'Brand voice and word list guidelines';
