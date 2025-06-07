-- Contact Submissions Table
-- Stores all contact form submissions from the website

CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    service VARCHAR(255),
    budget VARCHAR(50),
    timeline VARCHAR(50),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'archived')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    contacted_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_assigned ON contact_submissions(assigned_to);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only authenticated users can view contact submissions
CREATE POLICY "Authenticated users can view contact submissions" ON contact_submissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can update contact submissions
CREATE POLICY "Authenticated users can update contact submissions" ON contact_submissions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Anyone can insert (for public contact form)
CREATE POLICY "Anyone can submit contact form" ON contact_submissions
    FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_contact_submission_updated_at
BEFORE UPDATE ON contact_submissions
FOR EACH ROW
EXECUTE FUNCTION update_contact_submission_updated_at();

-- Create view for contact submission stats
CREATE OR REPLACE VIEW contact_submission_stats AS
SELECT 
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_submissions,
    COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_submissions,
    COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_submissions,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_submissions,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days
FROM contact_submissions;

-- Grant permissions
GRANT SELECT ON contact_submission_stats TO authenticated;
