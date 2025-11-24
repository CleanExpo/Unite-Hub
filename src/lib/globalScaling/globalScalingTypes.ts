/**
 * Global Region Scaling Types
 * Phase 92: GRSE - Region-level execution isolation and scaling
 */

export type ScalingMode = 'normal' | 'cautious' | 'throttled' | 'frozen';
export type PeriodType = 'hourly' | 'daily' | 'weekly';
export type TransactionType = 'allocation' | 'spend' | 'refund' | 'reset';

export interface RegionScalingState {
  regionId: string;
  updatedAt: string;

  // AI Budget (in cents)
  aiBudgetMonthly: number;
  aiBudgetRemaining: number;
  aiSpendToday: number;

  // Pressure scores (0-100)
  postingPressure: number;
  orchestrationPressure: number;
  creativePressure: number;
  intelPressure: number;

  // Health indicators
  warningIndex: number;
  capacityScore: number;
  fatigueScore: number;

  // Utilization
  activeAgencies: number;
  activeClients: number;
  jobsInQueue: number;

  // Mode
  scalingMode: ScalingMode;

  // Metadata
  metadata: Record<string, unknown>;
}

export interface RegionScalingHistory {
  id: string;
  createdAt: string;
  regionId: string;
  snapshot: Record<string, unknown>;
  periodType: PeriodType;
  avgCapacity: number | null;
  peakPressure: number | null;
  budgetUsed: number | null;
  metadata: Record<string, unknown>;
}

export interface RegionBudgetTransaction {
  id: string;
  createdAt: string;
  regionId: string;
  agencyId: string | null;
  transactionType: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  jobType: string | null;
  metadata: Record<string, unknown>;
}

export interface RegionHealthSummary {
  regionId: string;
  regionName: string;
  scalingMode: ScalingMode;
  capacityScore: number;
  overallPressure: number;
  budgetPercentRemaining: number;
  warningIndex: number;
}

export interface RegionScalingSummary {
  regionId: string;
  scalingMode: ScalingMode;
  capacityScore: number;
  warningIndex: number;
  pressures: {
    posting: number;
    orchestration: number;
    creative: number;
    intel: number;
  };
  budget: {
    monthly: number;
    remaining: number;
    spentToday: number;
    percentRemaining: number;
  };
  utilization: {
    activeAgencies: number;
    activeClients: number;
    jobsInQueue: number;
  };
  updatedAt: string;
}

export interface BudgetCheckResult {
  allowed: boolean;
  remaining: number;
  requested: number;
  message?: string;
}

export interface JobRoutingResult {
  regionId: string;
  shardKey: string;
  priority: number;
  estimatedWait: number;
  scalingMode: ScalingMode;
}

export interface CrossRegionConflict {
  type: 'budget_exceeded' | 'capacity_critical' | 'mode_frozen';
  regionId: string;
  regionName: string;
  severity: 'warning' | 'critical';
  message: string;
  detectedAt: string;
}

export interface GlobalRiskAssessment {
  overallRisk: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  conflicts: CrossRegionConflict[];
  recommendations: string[];
  assessedAt: string;
}
