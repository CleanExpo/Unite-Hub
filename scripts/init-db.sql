-- =============================================================================
-- NodeJS-Starter-V1 Database Initialization
-- PostgreSQL 15 with pgvector
-- Self-contained - No external dependencies
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- SECTION 1: Authentication Schema (Simple JWT-based auth)
-- =============================================================================

-- Users table for JWT authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMPTZ,

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for auth
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- SECTION 2: Helper Functions
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 3: Business Schema (Contractor Availability)
-- =============================================================================

-- Custom ENUM types
CREATE TYPE australian_state AS ENUM ('QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT');
CREATE TYPE availability_status AS ENUM ('available', 'booked', 'tentative', 'unavailable');

-- Contractors table
CREATE TABLE IF NOT EXISTS contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Optional link to user account
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    abn VARCHAR(20),
    email VARCHAR(255),
    specialisation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Australian mobile format: 04XX XXX XXX
    CONSTRAINT mobile_format CHECK (mobile ~ '^04\\d{2} \\d{3} \\d{3}$'),
    -- Australian ABN format: XX XXX XXX XXX
    CONSTRAINT abn_format CHECK (abn IS NULL OR abn ~ '^\\d{2} \\d{3} \\d{3} \\d{3}$')
);

-- Availability slots table
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    suburb VARCHAR(100) NOT NULL,
    state australian_state NOT NULL DEFAULT 'QLD',
    postcode VARCHAR(10),
    status availability_status DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- Triggers for updated_at
CREATE TRIGGER contractors_updated_at
    BEFORE UPDATE ON contractors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER availability_slots_updated_at
    BEFORE UPDATE ON availability_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for contractors
CREATE INDEX IF NOT EXISTS idx_contractors_mobile ON contractors(mobile);
CREATE INDEX IF NOT EXISTS idx_contractors_abn ON contractors(abn);
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON contractors(user_id);

-- Indexes for availability
CREATE INDEX IF NOT EXISTS idx_availability_contractor ON availability_slots(contractor_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_availability_contractor_date_status ON availability_slots(contractor_id, date, status);
CREATE INDEX IF NOT EXISTS idx_availability_location ON availability_slots(suburb, state);
CREATE INDEX IF NOT EXISTS idx_availability_status ON availability_slots(status);

-- =============================================================================
-- SECTION 4: AI/Embeddings Support (pgvector)
-- =============================================================================

-- Documents table for RAG/semantic search
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),  -- OpenAI/Anthropic embedding dimension
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_created ON documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN (metadata);

-- Trigger for documents
CREATE TRIGGER documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 5: Seed Data (Default Admin User)
-- =============================================================================

-- Insert default admin user
-- Password: "admin123" (bcrypt hash)
-- IMPORTANT: Change this password immediately in production!
INSERT INTO users (email, password_hash, full_name, is_admin)
VALUES (
    'admin@local.dev',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5Y7R.PZCjJxWe',  -- "admin123"
    'System Administrator',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- SECTION 6: Utility Views
-- =============================================================================

-- View for available contractors (users can query this)
CREATE OR REPLACE VIEW available_contractors AS
SELECT
    c.id,
    c.name,
    c.mobile,
    c.specialisation,
    COUNT(a.id) AS available_slots,
    MIN(a.date) AS next_available_date
FROM contractors c
LEFT JOIN availability_slots a ON c.id = a.contractor_id
    AND a.status = 'available'
    AND a.date >= CURRENT_DATE
GROUP BY c.id, c.name, c.mobile, c.specialisation;

-- =============================================================================
-- SECTION 7: Database Metadata
-- =============================================================================

-- Track database version for migration management
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0-init', 'Initial self-contained database setup')
ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- Initialization Complete
-- =============================================================================

-- Summary of created objects
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Database initialization complete!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Extensions: uuid-ossp, vector (pgvector)';
    RAISE NOTICE 'Tables: users, contractors, availability_slots, documents, schema_version';
    RAISE NOTICE 'Views: available_contractors';
    RAISE NOTICE 'Default admin: admin@local.dev / admin123 (CHANGE THIS!)';
    RAISE NOTICE '=============================================================================';
END $$;
