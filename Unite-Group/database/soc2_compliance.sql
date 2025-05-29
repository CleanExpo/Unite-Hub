-- SOC 2 Compliance Database Schema
-- Unite Group Enterprise Security System

-- Drop existing tables if they exist
DROP TABLE IF EXISTS soc2_monitoring_alerts CASCADE;
DROP TABLE IF EXISTS soc2_remediation_plans CASCADE;
DROP TABLE IF EXISTS soc2_audit_report_findings CASCADE;
DROP TABLE IF EXISTS soc2_audit_reports CASCADE;
DROP TABLE IF EXISTS soc2_risk_assessments CASCADE;
DROP TABLE IF EXISTS soc2_control_tests CASCADE;
DROP TABLE IF EXISTS soc2_control_evidence CASCADE;
DROP TABLE IF EXISTS soc2_security_controls CASCADE;
DROP TABLE IF EXISTS soc2_control_categories CASCADE;
DROP TABLE IF EXISTS soc2_configuration CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SOC 2 Configuration Table
CREATE TABLE soc2_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) NOT NULL,
    service_description TEXT NOT NULL,
    audit_period_start DATE NOT NULL,
    audit_period_end DATE NOT NULL,
    auditor_firm VARCHAR(255),
    auditor_contact VARCHAR(255),
    responsible_party VARCHAR(255) NOT NULL,
    control_environment_description TEXT,
    trust_services_categories TEXT[] NOT NULL DEFAULT '{}',
    automated_monitoring_enabled BOOLEAN DEFAULT true,
    evidence_retention_days INTEGER DEFAULT 2555, -- 7 years
    risk_assessment_frequency VARCHAR(50) DEFAULT 'annually',
    management_review_frequency VARCHAR(50) DEFAULT 'quarterly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Control Categories Table
CREATE TABLE soc2_control_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Security Controls Table
CREATE TABLE soc2_security_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    criteria VARCHAR(10) NOT NULL,
    control_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    evidence_requirements TEXT[] DEFAULT '{}',
    automated BOOLEAN DEFAULT false,
    last_tested TIMESTAMP WITH TIME ZONE,
    next_test_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES soc2_control_categories(id) ON DELETE CASCADE,
    
    CONSTRAINT valid_criteria CHECK (criteria IN ('CC6', 'A1', 'PI1', 'C1', 'P1')),
    CONSTRAINT valid_control_type CHECK (control_type IN ('preventive', 'detective', 'corrective', 'compensating')),
    CONSTRAINT valid_frequency CHECK (frequency IN ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'on_demand')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'testing', 'remediation', 'not_applicable'))
);

-- Control Evidence Table
CREATE TABLE soc2_control_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id UUID NOT NULL,
    evidence_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    file_path VARCHAR(500),
    file_hash VARCHAR(128),
    collected_by VARCHAR(255) NOT NULL,
    collection_date DATE NOT NULL,
    testing_period_start DATE NOT NULL,
    testing_period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (control_id) REFERENCES soc2_security_controls(id) ON DELETE CASCADE,
    
    CONSTRAINT valid_evidence_type CHECK (evidence_type IN (
        'screenshot', 'log_file', 'configuration', 'policy_document', 
        'procedure_document', 'training_record', 'vulnerability_scan', 
        'penetration_test', 'backup_verification', 'access_review', 
        'change_log', 'incident_report', 'monitoring_alert', 'system_report'
    )),
    CONSTRAINT valid_evidence_status CHECK (status IN ('pending', 'collected', 'reviewed', 'approved', 'rejected', 'expired'))
);

-- Control Tests Table
CREATE TABLE soc2_control_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id UUID NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    test_procedure TEXT NOT NULL,
    tester VARCHAR(255) NOT NULL,
    test_date DATE NOT NULL,
    test_period_start DATE NOT NULL,
    test_period_end DATE NOT NULL,
    result VARCHAR(50) DEFAULT 'not_tested',
    findings TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    evidence_ids UUID[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (control_id) REFERENCES soc2_security_controls(id) ON DELETE CASCADE,
    
    CONSTRAINT valid_test_type CHECK (test_type IN (
        'design_effectiveness', 'operating_effectiveness', 'walkthrough', 
        'inquiry', 'observation', 'inspection', 'reperformance'
    )),
    CONSTRAINT valid_test_result CHECK (result IN ('effective', 'ineffective', 'deficient', 'not_tested')),
    CONSTRAINT valid_test_status CHECK (status IN ('planned', 'in_progress', 'completed', 'reviewed', 'approved'))
);

-- Risk Assessments Table
CREATE TABLE soc2_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id UUID,
    risk_description TEXT NOT NULL,
    risk_category VARCHAR(50) NOT NULL,
    likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
    impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
    inherent_risk_rating INTEGER NOT NULL CHECK (inherent_risk_rating BETWEEN 1 AND 5),
    mitigation_controls TEXT[] DEFAULT '{}',
    residual_risk_rating INTEGER NOT NULL CHECK (residual_risk_rating BETWEEN 1 AND 5),
    risk_owner VARCHAR(255) NOT NULL,
    review_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'identified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (control_id) REFERENCES soc2_security_controls(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_risk_category CHECK (risk_category IN (
        'security', 'availability', 'processing_integrity', 'confidentiality', 
        'privacy', 'compliance', 'operational', 'financial', 'reputational'
    )),
    CONSTRAINT valid_risk_status CHECK (status IN (
        'identified', 'assessed', 'mitigated', 'accepted', 'transferred', 'avoided', 'monitored'
    ))
);

-- Audit Reports Table
CREATE TABLE soc2_audit_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    auditor VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    summary TEXT,
    recommendations TEXT[] DEFAULT '{}',
    management_response TEXT,
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_report_type CHECK (report_type IN (
        'soc2_type1', 'soc2_type2', 'internal_audit', 'management_review', 
        'quarterly_assessment', 'annual_assessment'
    )),
    CONSTRAINT valid_report_status CHECK (status IN (
        'draft', 'under_review', 'management_review', 'final', 'published'
    ))
);

-- Audit Report Findings Table
CREATE TABLE soc2_audit_report_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL,
    control_id UUID,
    finding_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    impact TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    management_response TEXT,
    status VARCHAR(50) DEFAULT 'open',
    identified_date DATE NOT NULL,
    target_resolution_date DATE,
    actual_resolution_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (report_id) REFERENCES soc2_audit_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (control_id) REFERENCES soc2_security_controls(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_finding_type CHECK (finding_type IN (
        'deficiency', 'material_weakness', 'significant_deficiency', 'observation', 'best_practice'
    )),
    CONSTRAINT valid_finding_severity CHECK (severity IN ('critical', 'high', 'medium', 'low', 'informational')),
    CONSTRAINT valid_finding_status CHECK (status IN (
        'open', 'in_remediation', 'pending_verification', 'closed', 'deferred'
    ))
);

-- Remediation Plans Table
CREATE TABLE soc2_remediation_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id UUID,
    risk_id UUID,
    finding_id UUID,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    progress_notes TEXT[] DEFAULT '{}',
    completion_date DATE,
    verification_evidence TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (control_id) REFERENCES soc2_security_controls(id) ON DELETE SET NULL,
    FOREIGN KEY (risk_id) REFERENCES soc2_risk_assessments(id) ON DELETE SET NULL,
    FOREIGN KEY (finding_id) REFERENCES soc2_audit_report_findings(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_remediation_priority CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT valid_remediation_status CHECK (status IN (
        'open', 'in_progress', 'pending_verification', 'completed', 'deferred', 'cancelled'
    ))
);

-- Monitoring Alerts Table
CREATE TABLE soc2_monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    control_id UUID,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    assigned_to VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (control_id) REFERENCES soc2_security_controls(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_alert_type CHECK (alert_type IN (
        'control_failure', 'evidence_missing', 'test_overdue', 'remediation_overdue',
        'configuration_change', 'security_incident', 'threshold_exceeded', 'manual_review_required'
    )),
    CONSTRAINT valid_alert_severity CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    CONSTRAINT valid_alert_status CHECK (status IN ('active', 'acknowledged', 'in_progress', 'resolved', 'dismissed'))
);

-- Create indexes for performance
CREATE INDEX idx_soc2_controls_category ON soc2_security_controls(category_id);
CREATE INDEX idx_soc2_controls_owner ON soc2_security_controls(owner);
CREATE INDEX idx_soc2_controls_status ON soc2_security_controls(status);
CREATE INDEX idx_soc2_controls_next_test ON soc2_security_controls(next_test_date);
CREATE INDEX idx_soc2_evidence_control ON soc2_control_evidence(control_id);
CREATE INDEX idx_soc2_evidence_date ON soc2_control_evidence(collection_date);
CREATE INDEX idx_soc2_evidence_status ON soc2_control_evidence(status);
CREATE INDEX idx_soc2_tests_control ON soc2_control_tests(control_id);
CREATE INDEX idx_soc2_tests_date ON soc2_control_tests(test_date);
CREATE INDEX idx_soc2_tests_result ON soc2_control_tests(result);
CREATE INDEX idx_soc2_risks_category ON soc2_risk_assessments(risk_category);
CREATE INDEX idx_soc2_risks_owner ON soc2_risk_assessments(risk_owner);
CREATE INDEX idx_soc2_risks_rating ON soc2_risk_assessments(residual_risk_rating);
CREATE INDEX idx_soc2_findings_severity ON soc2_audit_report_findings(severity);
CREATE INDEX idx_soc2_findings_status ON soc2_audit_report_findings(status);
CREATE INDEX idx_soc2_remediation_assigned ON soc2_remediation_plans(assigned_to);
CREATE INDEX idx_soc2_remediation_due ON soc2_remediation_plans(due_date);
CREATE INDEX idx_soc2_alerts_type ON soc2_monitoring_alerts(alert_type);
CREATE INDEX idx_soc2_alerts_severity ON soc2_monitoring_alerts(severity);
CREATE INDEX idx_soc2_alerts_status ON soc2_monitoring_alerts(status);

-- Add updated_at trigger for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_soc2_configuration_updated_at BEFORE UPDATE ON soc2_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soc2_control_categories_updated_at BEFORE UPDATE ON soc2_control_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soc2_security_controls_updated_at BEFORE UPDATE ON soc2_security_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soc2_control_evidence_updated_at BEFORE UPDATE ON soc2_control_evidence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soc2_control_tests_updated_at BEFORE UPDATE ON soc2_control_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soc2_risk_assessments_updated_at BEFORE UPDATE ON soc2_risk_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soc2_audit_reports_updated_at BEFORE UPDATE ON soc2_audit_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soc2_audit_report_findings_updated_at BEFORE UPDATE ON soc2_audit_report_findings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soc2_remediation_plans_updated_at BEFORE UPDATE ON soc2_remediation_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default control categories
INSERT INTO soc2_control_categories (id, name, description, criteria) VALUES
('access-control', 'Access Control', 'Controls for managing user access to systems and data', ARRAY['CC6', 'C1']),
('change-management', 'Change Management', 'Controls for managing changes to systems and processes', ARRAY['CC6', 'A1']),
('data-protection', 'Data Protection', 'Controls for protecting sensitive data', ARRAY['C1', 'P1']),
('monitoring', 'Monitoring and Logging', 'Controls for monitoring system activities and maintaining logs', ARRAY['CC6', 'A1']),
('incident-response', 'Incident Response', 'Controls for responding to security incidents', ARRAY['CC6', 'A1']),
('backup-recovery', 'Backup and Recovery', 'Controls for data backup and system recovery', ARRAY['A1', 'PI1']);

-- Insert default SOC 2 configuration
INSERT INTO soc2_configuration (
    organization_name,
    service_description,
    audit_period_start,
    audit_period_end,
    responsible_party,
    control_environment_description,
    trust_services_categories
) VALUES (
    'Unite Group',
    'Business consultation and digital transformation services platform',
    CURRENT_DATE - INTERVAL '6 months',
    CURRENT_DATE + INTERVAL '6 months',
    'Chief Technology Officer',
    'Unite Group maintains a comprehensive control environment designed to provide reasonable assurance regarding the achievement of objectives related to security, availability, processing integrity, confidentiality, and privacy of customer information.',
    ARRAY['CC6', 'A1', 'PI1', 'C1', 'P1']
);

-- Insert sample security controls
INSERT INTO soc2_security_controls (
    category_id, name, description, criteria, control_type, frequency, owner, 
    evidence_requirements, automated, next_test_date
) VALUES
(
    'access-control',
    'Multi-Factor Authentication Required',
    'All user accounts must use multi-factor authentication for system access',
    'CC6',
    'preventive',
    'continuous',
    'Security Team',
    ARRAY['MFA configuration screenshots', 'User access logs', 'Authentication policy document'],
    true,
    CURRENT_DATE + INTERVAL '90 days'
),
(
    'access-control',
    'Role-Based Access Control',
    'User access is granted based on job function and principle of least privilege',
    'CC6',
    'preventive',
    'quarterly',
    'IT Administrator',
    ARRAY['RBAC configuration', 'Access review reports', 'Role assignment documentation'],
    true,
    CURRENT_DATE + INTERVAL '90 days'
),
(
    'monitoring',
    'Security Event Monitoring',
    'Continuous monitoring of security events and anomalous activities',
    'CC6',
    'detective',
    'continuous',
    'SOC Team',
    ARRAY['SIEM alerts', 'Log analysis reports', 'Incident response procedures'],
    true,
    CURRENT_DATE + INTERVAL '30 days'
),
(
    'data-protection',
    'Data Encryption at Rest',
    'All sensitive data must be encrypted when stored',
    'C1',
    'preventive',
    'continuous',
    'Database Administrator',
    ARRAY['Encryption configuration', 'Key management procedures', 'Compliance scan results'],
    true,
    CURRENT_DATE + INTERVAL '90 days'
),
(
    'backup-recovery',
    'Data Backup and Recovery',
    'Regular backup of critical data with tested recovery procedures',
    'A1',
    'corrective',
    'daily',
    'Infrastructure Team',
    ARRAY['Backup logs', 'Recovery test results', 'Backup retention policy'],
    true,
    CURRENT_DATE + INTERVAL '30 days'
),
(
    'change-management',
    'Change Approval Process',
    'All system changes must be approved and documented',
    'CC6',
    'preventive',
    'on_demand',
    'Change Advisory Board',
    ARRAY['Change request forms', 'Approval records', 'Deployment logs'],
    false,
    CURRENT_DATE + INTERVAL '90 days'
);

-- Create views for reporting
CREATE VIEW soc2_control_effectiveness AS
SELECT 
    c.id,
    c.name,
    c.category_id,
    c.criteria,
    c.owner,
    c.status,
    COALESCE(t.latest_result, 'not_tested') as latest_test_result,
    t.latest_test_date,
    c.next_test_date,
    CASE 
        WHEN c.next_test_date < CURRENT_DATE THEN true 
        ELSE false 
    END as overdue,
    COUNT(e.id) as evidence_count
FROM soc2_security_controls c
LEFT JOIN (
    SELECT 
        control_id,
        result as latest_result,
        test_date as latest_test_date,
        ROW_NUMBER() OVER (PARTITION BY control_id ORDER BY test_date DESC) as rn
    FROM soc2_control_tests
) t ON c.id = t.control_id AND t.rn = 1
LEFT JOIN soc2_control_evidence e ON c.id = e.control_id AND e.status = 'approved'
GROUP BY c.id, c.name, c.category_id, c.criteria, c.owner, c.status, t.latest_result, t.latest_test_date, c.next_test_date;

CREATE VIEW soc2_compliance_metrics AS
SELECT 
    COUNT(*) as total_controls,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_controls,
    COUNT(CASE WHEN next_test_date < CURRENT_DATE THEN 1 END) as overdue_tests,
    ROUND(
        COUNT(CASE WHEN latest_test_result = 'effective' THEN 1 END)::numeric / 
        NULLIF(COUNT(CASE WHEN latest_test_result != 'not_tested' THEN 1 END), 0) * 100, 2
    ) as effectiveness_rate,
    COUNT(DISTINCT category_id) as categories_covered
FROM soc2_control_effectiveness;

-- Add row-level security policies
ALTER TABLE soc2_security_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_control_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_control_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_remediation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (will be refined based on user roles)
CREATE POLICY soc2_controls_policy ON soc2_security_controls FOR ALL USING (true);
CREATE POLICY soc2_evidence_policy ON soc2_control_evidence FOR ALL USING (true);
CREATE POLICY soc2_tests_policy ON soc2_control_tests FOR ALL USING (true);
CREATE POLICY soc2_risks_policy ON soc2_risk_assessments FOR ALL USING (true);
CREATE POLICY soc2_reports_policy ON soc2_audit_reports FOR ALL USING (true);
CREATE POLICY soc2_remediation_policy ON soc2_remediation_plans FOR ALL USING (true);
CREATE POLICY soc2_alerts_policy ON soc2_monitoring_alerts FOR ALL USING (true);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE soc2_configuration IS 'SOC 2 audit configuration and organizational settings';
COMMENT ON TABLE soc2_control_categories IS 'Categories for organizing security controls';
COMMENT ON TABLE soc2_security_controls IS 'Security controls mapped to SOC 2 trust service criteria';
COMMENT ON TABLE soc2_control_evidence IS 'Evidence collected to support control effectiveness';
COMMENT ON TABLE soc2_control_tests IS 'Testing activities performed on security controls';
COMMENT ON TABLE soc2_risk_assessments IS 'Risk assessments and mitigation strategies';
COMMENT ON TABLE soc2_audit_reports IS 'Audit reports and management communications';
COMMENT ON TABLE soc2_audit_report_findings IS 'Findings identified during audits and assessments';
COMMENT ON TABLE soc2_remediation_plans IS 'Plans for addressing findings and deficiencies';
COMMENT ON TABLE soc2_monitoring_alerts IS 'Real-time alerts for compliance monitoring';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'SOC 2 Compliance database schema created successfully!';
    RAISE NOTICE 'Default control categories and sample controls have been inserted.';
    RAISE NOTICE 'Views created: soc2_control_effectiveness, soc2_compliance_metrics';
END $$;
