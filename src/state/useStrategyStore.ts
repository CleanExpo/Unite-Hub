import { create } from 'zustand';

export interface StrategyHierarchyItem {
  id: string;
  title: string;
  description: string;
  resourcesRequired: string[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  owner?: string;
}

export interface StrategyLevel {
  level: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  items: StrategyHierarchyItem[];
}

export interface StrategyHierarchy {
  id: string;
  objectiveId: string;
  L1_Strategic_Objective: StrategyLevel;
  L2_Strategic_Pillars: StrategyLevel;
  L3_Strategic_Tactics: StrategyLevel;
  L4_Operational_Tasks: StrategyLevel;
  hierarchyScore: number;
  status: 'draft' | 'validated' | 'executing' | 'completed';
  createdAt: string;
  validatedAt?: string;
}

export interface AgentValidation {
  agentId: string;
  validationScore: number;
  riskAssessment: number;
  concerns: string[];
  supportingPoints: string[];
  recommendation: 'approve' | 'needs_revision' | 'reject';
  reasoning: string;
}

export interface StrategyConflict {
  type: 'contradiction' | 'circular_dependency' | 'resource_conflict' | 'timing_conflict' | 'capability_mismatch';
  level: number;
  items: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface StrategyValidation {
  validationScore: number;
  overallStatus: 'approved' | 'needs_revision' | 'rejected';
  consensusLevel: number;
  agentValidations: AgentValidation[];
  conflictingViews: string[];
  recommendations: string[];
  conflicts: StrategyConflict[];
}

export interface DecompositionMetrics {
  completeness: number;
  balance: number;
  coherence: number;
  clarity: number;
  overall: number;
}

export interface HistoricalStrategy {
  id: string;
  outcome: 'successful' | 'partial_success' | 'failed';
  completionRate: number;
  timeEfficiency: number;
  costEfficiency: number;
  patterns: string[];
  archivedAt: string;
}

interface StrategyStore {
  // State
  activeStrategy: StrategyHierarchy | null;
  validation: StrategyValidation | null;
  decompositionMetrics: DecompositionMetrics | null;
  historicalStrategies: HistoricalStrategy[];
  pollingActive: boolean;
  pollingInterval: number;
  isLoadingStrategy: boolean;
  isLoadingValidation: boolean;
  isLoadingHistory: boolean;
  errorMessage: string | null;

  // Setters
  setActiveStrategy: (strategy: StrategyHierarchy | null) => void;
  setValidation: (validation: StrategyValidation | null) => void;
  setDecompositionMetrics: (metrics: DecompositionMetrics | null) => void;
  setHistoricalStrategies: (strategies: HistoricalStrategy[]) => void;
  setPollingActive: (active: boolean) => void;
  setPollingInterval: (interval: number) => void;
  setIsLoadingStrategy: (loading: boolean) => void;
  setIsLoadingValidation: (loading: boolean) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  setErrorMessage: (message: string | null) => void;

  // Computed selectors
  isStrategyActive: () => boolean;
  getHierarchyHealth: () => number;
  getDecompositionQuality: () => 'excellent' | 'good' | 'fair' | 'poor';
  getValidationStatus: () => 'approved' | 'needs_revision' | 'rejected' | 'not_validated';
  getTotalItems: () => number;
  getRiskDistribution: () => { low: number; medium: number; high: number; critical: number };
  getAverageEfficiency: () => number;
}

export const useStrategyStore = create<StrategyStore>((set, get) => ({
  // Initial state
  activeStrategy: null,
  validation: null,
  decompositionMetrics: null,
  historicalStrategies: [],
  pollingActive: false,
  pollingInterval: 2000,
  isLoadingStrategy: false,
  isLoadingValidation: false,
  isLoadingHistory: false,
  errorMessage: null,

  // Setters
  setActiveStrategy: (strategy) => set({ activeStrategy: strategy }),
  setValidation: (validation) => set({ validation }),
  setDecompositionMetrics: (metrics) => set({ decompositionMetrics: metrics }),
  setHistoricalStrategies: (strategies) => set({ historicalStrategies: strategies }),
  setPollingActive: (active) => set({ pollingActive: active }),
  setPollingInterval: (interval) => set({ pollingInterval: interval }),
  setIsLoadingStrategy: (loading) => set({ isLoadingStrategy: loading }),
  setIsLoadingValidation: (loading) => set({ isLoadingValidation: loading }),
  setIsLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
  setErrorMessage: (message) => set({ errorMessage: message }),

  // Computed selectors
  isStrategyActive: () => {
    const { activeStrategy } = get();
    return activeStrategy !== null && activeStrategy.status !== 'completed';
  },

  getHierarchyHealth: () => {
    const { activeStrategy, validation } = get();
    if (!activeStrategy || !validation) {
return 0;
}

    // Health = 60% hierarchy score + 40% validation score
    return activeStrategy.hierarchyScore * 0.6 + validation.validationScore * 0.4;
  },

  getDecompositionQuality: () => {
    const { decompositionMetrics } = get();
    if (!decompositionMetrics) {
return 'poor';
}

    const score = decompositionMetrics.overall;
    if (score >= 85) {
return 'excellent';
}
    if (score >= 70) {
return 'good';
}
    if (score >= 50) {
return 'fair';
}
    return 'poor';
  },

  getValidationStatus: () => {
    const { validation } = get();
    if (!validation) {
return 'not_validated';
}
    return validation.overallStatus;
  },

  getTotalItems: () => {
    const { activeStrategy } = get();
    if (!activeStrategy) {
return 0;
}

    return (
      activeStrategy.L1_Strategic_Objective.items.length +
      activeStrategy.L2_Strategic_Pillars.items.length +
      activeStrategy.L3_Strategic_Tactics.items.length +
      activeStrategy.L4_Operational_Tasks.items.length
    );
  },

  getRiskDistribution: () => {
    const { activeStrategy } = get();
    if (!activeStrategy) {
return { low: 0, medium: 0, high: 0, critical: 0 };
}

    const allItems = [
      ...activeStrategy.L2_Strategic_Pillars.items,
      ...activeStrategy.L3_Strategic_Tactics.items,
      ...activeStrategy.L4_Operational_Tasks.items,
    ];

    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const item of allItems) {
      distribution[item.riskLevel]++;
    }

    return distribution;
  },

  getAverageEfficiency: () => {
    const { historicalStrategies } = get();
    if (historicalStrategies.length === 0) {
return 0;
}

    const avgTime = historicalStrategies.reduce((sum, s) => sum + s.timeEfficiency, 0) / historicalStrategies.length;
    const avgCost = historicalStrategies.reduce((sum, s) => sum + s.costEfficiency, 0) / historicalStrategies.length;

    // Efficiency = 50% time + 50% cost
    return (avgTime * 0.5 + avgCost * 0.5);
  },
}));
