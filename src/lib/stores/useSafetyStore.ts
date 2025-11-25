/**
 * useSafetyStore - Zustand store for real-time safety system state
 *
 * Manages:
 * - Current safety status (risk levels, cascade analysis)
 * - Recent events, predictions, and interventions
 * - Live polling with exponential backoff
 * - User actions (executing interventions, dismissing alerts)
 */

import { create } from 'zustand';

export interface SafetyEvent {
  id: string;
  type: string;
  severity: number;
  riskLevel: number;
  source: string;
  createdAt: string;
}

export interface SafetyPrediction {
  id: string;
  type: string;
  probability: number;
  confidence: number;
  affectedAgents: string[];
  recommendedAction: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface SafetyLedgerEntry {
  id: string;
  action: string;
  riskBefore: number;
  riskAfter: number;
  riskReduction: number;
  reason: string;
  createdAt: string;
}

export interface CascadeFactors {
  vulnerableAgents: string[];
  deadlockedAgents: string[];
  activeFailureChains: number;
  primaryRiskFactor: string;
  cascadeFactors: Array<{
    type: string;
    severity: number;
    description: string;
  }>;
}

export interface SafetyStatus {
  level: 'green' | 'yellow' | 'orange' | 'red';
  overallRiskScore: number;
  cascadeRiskScore: number;
  deadlockRiskScore: number;
  memoryCorruptionScore: number;
  orchestrationComplexityScore: number;
}

export interface SafetyStoreState {
  // Data
  workspaceId: string | null;
  timestamp: string | null;
  status: SafetyStatus | null;
  events: SafetyEvent[];
  predictions: SafetyPrediction[];
  ledger: SafetyLedgerEntry[];
  cascade: CascadeFactors | null;

  // UI State
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  selectedEvent: SafetyEvent | null;
  expandedPredictionId: string | null;

  // Control
  pollIntervalMs: number;
  pollRetries: number;
  maxBackoffMs: number;

  // Actions
  setWorkspaceId: (id: string) => void;
  startPolling: (workspaceId: string, token: string) => void;
  stopPolling: () => void;
  fetchSafetyStatus: (workspaceId: string, token: string) => Promise<void>;
  selectEvent: (event: SafetyEvent | null) => void;
  expandPrediction: (predictionId: string | null) => void;
  executeIntervention: (
    action: string,
    reason: string,
    targetAgent?: string,
    targetWorkflow?: string
  ) => Promise<void>;
  clearError: () => void;
}

let pollTimeoutId: NodeJS.Timeout | null = null;
let currentBackoffMs = 1000; // Start with 1 second backoff

export const useSafetyStore = create<SafetyStoreState>((set, get) => ({
  // Initial state
  workspaceId: null,
  timestamp: null,
  status: null,
  events: [],
  predictions: [],
  ledger: [],
  cascade: null,

  isLoading: false,
  isPolling: false,
  error: null,
  selectedEvent: null,
  expandedPredictionId: null,

  pollIntervalMs: 5000, // 5 second base interval
  pollRetries: 3,
  maxBackoffMs: 30000, // 30 second max backoff

  // Set workspace ID
  setWorkspaceId: (id: string) => {
    set({ workspaceId: id });
  },

  // Fetch safety status from API
  fetchSafetyStatus: async (workspaceId: string, token: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(
        `/api/safety/status?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Safety status request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        set({
          timestamp: data.timestamp,
          status: {
            level: data.status.level,
            overallRiskScore: data.status.overallRiskScore,
            cascadeRiskScore: data.status.cascadeRiskScore,
            deadlockRiskScore: data.status.deadlockRiskScore,
            memoryCorruptionScore: data.status.memoryCorruptionScore,
            orchestrationComplexityScore: data.status.orchestrationComplexityScore,
          },
          events: data.events.recent || [],
          predictions: data.predictions.recent || [],
          ledger: data.ledger.recent || [],
          cascade: {
            vulnerableAgents: data.cascade.vulnerableAgents,
            deadlockedAgents: data.cascade.deadlockedAgents,
            activeFailureChains: data.cascade.activeFailureChains,
            primaryRiskFactor: data.cascade.primaryRiskFactor,
            cascadeFactors: data.cascade.cascadeFactors,
          },
          isLoading: false,
          error: null,
        });

        // Reset backoff on success
        currentBackoffMs = 1000;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch safety status';
      set({
        isLoading: false,
        error: message,
      });

      // Increase backoff exponentially on failure
      const state = get();
      currentBackoffMs = Math.min(
        state.maxBackoffMs,
        currentBackoffMs * 1.5
      );
    }
  },

  // Start polling for updates
  startPolling: (workspaceId: string, token: string) => {
    const state = get();

    // Prevent duplicate polling
    if (state.isPolling) {
      return;
    }

    set({ isPolling: true, workspaceId });

    // Initial fetch
    state.fetchSafetyStatus(workspaceId, token);

    // Set up polling loop
    const poll = async () => {
      const currentState = get();
      if (currentState.isPolling && currentState.workspaceId) {
        // Calculate delay with exponential backoff
        const delay = currentState.pollIntervalMs + currentBackoffMs;

        // Schedule next poll
        pollTimeoutId = setTimeout(() => {
          state.fetchSafetyStatus(currentState.workspaceId!, token).then(() => {
            poll();
          });
        }, delay);
      }
    };

    poll();
  },

  // Stop polling
  stopPolling: () => {
    if (pollTimeoutId) {
      clearTimeout(pollTimeoutId);
      pollTimeoutId = null;
    }
    set({ isPolling: false });
    currentBackoffMs = 1000; // Reset backoff
  },

  // Select an event for details
  selectEvent: (event: SafetyEvent | null) => {
    set({ selectedEvent: event });
  },

  // Expand/collapse a prediction
  expandPrediction: (predictionId: string | null) => {
    set({ expandedPredictionId: predictionId });
  },

  // Execute a safety intervention
  executeIntervention: async (
    action: string,
    reason: string,
    targetAgent?: string,
    targetWorkflow?: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      const state = get();
      if (!state.workspaceId) {
        throw new Error('No workspace selected');
      }

      // Get token from localStorage (implicit auth)
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/safety/intervene', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: state.workspaceId,
          action,
          reason,
          targetAgent,
          targetWorkflow,
        }),
      });

      if (!response.ok) {
        throw new Error(`Intervention failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        set({ isLoading: false, error: null });

        // Immediately refresh safety status
        await state.fetchSafetyStatus(state.workspaceId, token);
      } else {
        throw new Error(data.error || 'Intervention failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute intervention';
      set({
        isLoading: false,
        error: message,
      });
      throw err;
    }
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },
}));
