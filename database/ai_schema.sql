-- AI System Schema for Version 14.0
-- This schema stores all AI-related metrics, predictions, threats, and deployments

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- AI SYSTEM METRICS TABLE
-- Stores system metrics collected by the AI monitoring system
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    environment VARCHAR(50) DEFAULT 'production',
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_system_metrics_component ON ai_system_metrics(component);
CREATE INDEX idx_ai_system_metrics_name ON ai_system_metrics(metric_name);
CREATE INDEX idx_ai_system_metrics_timestamp ON ai_system_metrics(timestamp DESC);
CREATE INDEX idx_ai_system_metrics_env ON ai_system_metrics(environment);

-- =====================================================
-- AI PREDICTIONS TABLE
-- Stores failure predictions made by the AI system
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_type VARCHAR(50) NOT NULL,
    component VARCHAR(100) NOT NULL,
    prediction JSONB NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    probability DECIMAL(3, 2) CHECK (probability >= 0 AND probability <= 1),
    time_to_failure INTEGER, -- Hours until predicted failure
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    recommendation TEXT,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false-positive', 'ignored')),
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX idx_ai_predictions_status ON ai_predictions(status);
CREATE INDEX idx_ai_predictions_severity ON ai_predictions(severity);
CREATE INDEX idx_ai_predictions_predicted ON ai_predictions(predicted_at DESC);

-- =====================================================
-- AI THREAT DETECTIONS TABLE
-- Stores security threats detected by the AI system
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_threat_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    source VARCHAR(100),
    target VARCHAR(100),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    indicators JSONB DEFAULT '[]',
    mitigation_status VARCHAR(30) DEFAULT 'detected' 
        CHECK (mitigation_status IN ('detected', 'analyzing', 'mitigating', 'mitigated', 'failed', 'ignored')),
    mitigation_actions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    mitigated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_threats_type ON ai_threats(threat_type);
CREATE INDEX idx_ai_threats_severity ON ai_threats(severity);
CREATE INDEX idx_ai_threats_status ON ai_threats(mitigation_status);
CREATE INDEX idx_ai_threats_detected ON ai_threats(detected_at DESC);

-- =====================================================
-- AI DEPLOYMENTS TABLE
-- Stores deployment history and status
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    version VARCHAR(50) NOT NULL,
    strategy VARCHAR(20) CHECK (strategy IN ('blue-green', 'canary', 'rolling', 'recreate')),
    status VARCHAR(20) CHECK (status IN ('pending', 'validating', 'deploying', 'verifying', 'completed', 'failed', 'rolled-back')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_phase VARCHAR(100),
    environment VARCHAR(20) CHECK (environment IN ('development', 'staging', 'production')),
    targets JSONB DEFAULT '[]',
    health_checks JSONB DEFAULT '[]',
    metrics JSONB DEFAULT '{}',
    issues JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_deployments_status ON ai_deployments(status);
CREATE INDEX idx_ai_deployments_environment ON ai_deployments(environment);
CREATE INDEX idx_ai_deployments_started ON ai_deployments(started_at DESC);

-- =====================================================
-- AI OPTIMIZATION TABLE
-- Stores performance optimizations performed
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    optimization_type VARCHAR(50) NOT NULL,
    component VARCHAR(100) NOT NULL,
    before_metrics JSONB DEFAULT '{}',
    after_metrics JSONB DEFAULT '{}',
    improvement_percentage DECIMAL(5, 2),
    actions_taken JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('suggested', 'applied', 'reverted', 'failed')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reverted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_optimizations_type ON ai_optimizations(optimization_type);
CREATE INDEX idx_ai_optimizations_status ON ai_optimizations(status);
CREATE INDEX idx_ai_optimizations_applied ON ai_optimizations(applied_at DESC);

-- =====================================================
-- AI EVENTS TABLE
-- Stores all AI system events for audit trail
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('metric', 'alert', 'threat', 'prediction', 'optimization', 'deployment')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    component VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_events_type ON ai_events(event_type);
CREATE INDEX idx_ai_events_severity ON ai_events(severity);
CREATE INDEX idx_ai_events_component ON ai_events(component);
CREATE INDEX idx_ai_events_created ON ai_events(created_at DESC);

-- =====================================================
-- AI SYSTEM HEALTH TABLE
-- Stores overall AI system health status
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_score DECIMAL(3, 2) NOT NULL CHECK (health_score >= 0 AND health_score <= 1),
    monitoring_status VARCHAR(20) CHECK (monitoring_status IN ('active', 'inactive', 'error')),
    active_predictions INTEGER DEFAULT 0,
    critical_predictions INTEGER DEFAULT 0,
    active_threats INTEGER DEFAULT 0,
    active_mitigations INTEGER DEFAULT 0,
    recent_optimizations INTEGER DEFAULT 0,
    active_deployments INTEGER DEFAULT 0,
    system_metrics JSONB DEFAULT '{}',
    component_status JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_ai_system_health_recorded ON ai_system_health(recorded_at DESC);

-- =====================================================
-- AI VALIDATION RULES TABLE
-- Stores custom validation rules for deployments
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_validation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(30) CHECK (rule_type IN ('pre-deployment', 'post-deployment', 'continuous')),
    category VARCHAR(30) CHECK (category IN ('security', 'performance', 'compatibility', 'compliance', 'reliability')),
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    description TEXT,
    check_logic JSONB NOT NULL,
    auto_remediate BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_validation_rules_type ON ai_validation_rules(rule_type);
CREATE INDEX idx_ai_validation_rules_category ON ai_validation_rules(category);
CREATE INDEX idx_ai_validation_rules_enabled ON ai_validation_rules(enabled);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ai_system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_threat_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_validation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Read access for all authenticated users
CREATE POLICY "Authenticated users can read AI system metrics" ON ai_system_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read AI predictions" ON ai_predictions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read AI threat detections" ON ai_threat_detections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read AI deployments" ON ai_deployments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read AI optimizations" ON ai_optimizations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read AI events" ON ai_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read AI system health" ON ai_system_health
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read AI validation rules" ON ai_validation_rules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Write access for service role only (server-side operations)
CREATE POLICY "Service role can insert AI system metrics" ON ai_system_metrics
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert AI predictions" ON ai_predictions
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update AI predictions" ON ai_predictions
    FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert AI threat detections" ON ai_threat_detections
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update AI threat detections" ON ai_threat_detections
    FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert AI deployments" ON ai_deployments
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update AI deployments" ON ai_deployments
    FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert AI optimizations" ON ai_optimizations
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update AI optimizations" ON ai_optimizations
    FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert AI events" ON ai_events
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert AI system health" ON ai_system_health
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage AI validation rules" ON ai_validation_rules
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- FUNCTIONS FOR DATA CLEANUP
-- =====================================================

-- Function to clean up old AI system metrics (keeps 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_ai_system_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_system_metrics 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old AI events (keeps 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_ai_events()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_events 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old system health records (keeps 7 days of detailed records)
CREATE OR REPLACE FUNCTION cleanup_old_ai_system_health()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_system_health 
    WHERE recorded_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEDULED CLEANUP (Optional - requires pg_cron extension)
-- =====================================================
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-ai-system-metrics', '0 2 * * *', 'SELECT cleanup_old_ai_system_metrics();');
-- SELECT cron.schedule('cleanup-ai-events', '0 3 * * *', 'SELECT cleanup_old_ai_events();');
-- SELECT cron.schedule('cleanup-ai-health', '0 4 * * *', 'SELECT cleanup_old_ai_system_health();');
