-- =====================================================================================
-- Migration 564: RLS Policies for F21-F24
-- =====================================================================================
-- Purpose: Row Level Security policies for Founder Intelligence phases 21-24
-- Dependencies: Migrations 560-563 (F21-F24 tables)
-- Tables: founder_stability_horizon, founder_preemptive_risk_grid,
--         founder_performance_envelope, founder_focus_windows
-- =====================================================================================

-- =====================================================================================
-- F21: Stability Horizon Scanner
-- =====================================================================================

ALTER TABLE founder_stability_horizon ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_horizon_signals ENABLE ROW LEVEL SECURITY;

-- Stability Horizon Policies
CREATE POLICY "tenant_select_stability_horizon"
  ON founder_stability_horizon
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_insert_stability_horizon"
  ON founder_stability_horizon
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "tenant_update_stability_horizon"
  ON founder_stability_horizon
  FOR UPDATE
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_delete_stability_horizon"
  ON founder_stability_horizon
  FOR DELETE
  USING (tenant_id = auth.uid());

-- Horizon Signals Policies
CREATE POLICY "tenant_select_horizon_signals"
  ON founder_horizon_signals
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_insert_horizon_signals"
  ON founder_horizon_signals
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================================================
-- F22: Pre-Emptive Risk Grid
-- =====================================================================================

ALTER TABLE founder_preemptive_risk_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_risk_factors ENABLE ROW LEVEL SECURITY;

-- Preemptive Risk Grid Policies
CREATE POLICY "tenant_select_preemptive_risk"
  ON founder_preemptive_risk_grid
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_insert_preemptive_risk"
  ON founder_preemptive_risk_grid
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "tenant_update_preemptive_risk"
  ON founder_preemptive_risk_grid
  FOR UPDATE
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_delete_preemptive_risk"
  ON founder_preemptive_risk_grid
  FOR DELETE
  USING (tenant_id = auth.uid());

-- Risk Factors Policies
CREATE POLICY "tenant_select_risk_factors"
  ON founder_risk_factors
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_insert_risk_factors"
  ON founder_risk_factors
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================================================
-- F23: Performance Envelope
-- =====================================================================================

ALTER TABLE founder_performance_envelope ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_performance_envelope"
  ON founder_performance_envelope
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_insert_performance_envelope"
  ON founder_performance_envelope
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "tenant_update_performance_envelope"
  ON founder_performance_envelope
  FOR UPDATE
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_delete_performance_envelope"
  ON founder_performance_envelope
  FOR DELETE
  USING (tenant_id = auth.uid());

-- =====================================================================================
-- F24: Predictive Focus Window Engine
-- =====================================================================================

ALTER TABLE founder_focus_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_focus_windows"
  ON founder_focus_windows
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_insert_focus_windows"
  ON founder_focus_windows
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "tenant_update_focus_windows"
  ON founder_focus_windows
  FOR UPDATE
  USING (tenant_id = auth.uid());

CREATE POLICY "tenant_delete_focus_windows"
  ON founder_focus_windows
  FOR DELETE
  USING (tenant_id = auth.uid());

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON POLICY "tenant_select_stability_horizon" ON founder_stability_horizon
  IS 'F21: Allows tenants to view their own stability horizon forecasts';

COMMENT ON POLICY "tenant_select_preemptive_risk" ON founder_preemptive_risk_grid
  IS 'F22: Allows tenants to view their own preemptive risk assessments';

COMMENT ON POLICY "tenant_select_performance_envelope" ON founder_performance_envelope
  IS 'F23: Allows tenants to view their own performance envelope data';

COMMENT ON POLICY "tenant_select_focus_windows" ON founder_focus_windows
  IS 'F24: Allows tenants to view their own focus window predictions';
