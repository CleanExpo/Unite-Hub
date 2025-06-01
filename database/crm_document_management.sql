-- CRM Document Management Table
CREATE TABLE IF NOT EXISTS crm_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- 'contract', 'proposal', 'invoice', 'report'
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_confidential BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    metadata JSONB,
    
    -- Version history tracking
    previous_version UUID REFERENCES crm_documents(id) ON DELETE SET NULL,
    version_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_documents_client ON crm_documents(client_id);
CREATE INDEX idx_documents_project ON crm_documents(project_id);
CREATE INDEX idx_documents_type ON crm_documents(document_type);

-- Enable Row Level Security
ALTER TABLE crm_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their documents" ON crm_documents
FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can create documents" ON crm_documents
FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their documents" ON crm_documents
FOR UPDATE USING (auth.uid() = uploaded_by);

-- Full text search index for document content
CREATE INDEX idx_documents_content_search ON crm_documents
USING gin (to_tsvector('english', document_name || ' ' || description));
