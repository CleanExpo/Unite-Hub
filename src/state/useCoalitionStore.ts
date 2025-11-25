'use client';

import { create } from 'zustand';

export interface CoalitionMember {
  agentId: string;
  primaryRole: 'leader' | 'planner' | 'executor' | 'validator';
  secondaryRoles: string[];
  capabilityMatch: number;
  successRate: number;
  status: 'active' | 'failed' | 'inactive';
}

export interface CoalitionProposal {
  proposalId: string;
  taskId: string;
  taskComplexity: number;
  agentIds: string[];
  synergySc ore: number;
  recommendedLeader: string;
  estimatedOutcome: number;
  safetyApproved: boolean;
  safetyVetoes: string[];
  status: 'proposed' | 'accepted' | 'rejected' | 'executing';
  createdAt: string;
}

export interface CoalitionRole {
  agentId: string;
  role: 'leader' | 'planner' | 'executor' | 'validator';
  conflictDetected: boolean;
  arbitrationUsed: boolean;
  allocationScore: number;
}

export interface HistoricalCoalition {
  taskId: string;
  agentCount: number;
  synergySc ore: number;
  outcome: 'success' | 'partial_success' | 'failure';
  completedAt: string;
  patternType?: string;
}

interface CoalitionStore {
  // State
  activeCoalition: CoalitionProposal | null;
  coalitionMembers: CoalitionMember[];
  roleAssignments: CoalitionRole[];
  historicalCoalitions: HistoricalCoalition[];

  // Loading & Status
  isLoadingCoalition: boolean;
  isLoadingMembers: boolean;
  isLoadingHistory: boolean;
  pollingActive: boolean;
  pollingInterval: number;
  errorMessage: string | null;

  // Actions
  setActiveCoalition: (coalition: CoalitionProposal | null) => void;
  setCoalitionMembers: (members: CoalitionMember[]) => void;
  setRoleAssignments: (roles: CoalitionRole[]) => void;
  setHistoricalCoalitions: (coalitions: HistoricalCoalition[]) => void;

  setLoadingCoalition: (loading: boolean) => void;
  setLoadingMembers: (loading: boolean) => void;
  setLoadingHistory: (loading: boolean) => void;
  setPollingActive: (active: boolean) => void;
  setPollingInterval: (interval: number) => void;
  setErrorMessage: (message: string | null) => void;

  // Computed
  isCoalitionActive: () => boolean;
  synergyStatus: () => 'high' | 'medium' | 'low' | 'none';
  hasRoleConflicts: () => boolean;
  getActiveMemberCount: () => number;
}

export const useCoalitionStore = create<CoalitionStore>((set, get) => (
  {
    // Initial state
    activeCoalition: null,
    coalitionMembers: [],
    roleAssignments: [],
    historicalCoalitions: [],

    isLoadingCoalition: false,
    isLoadingMembers: false,
    isLoadingHistory: false,
    pollingActive: false,
    pollingInterval: 2000,
    errorMessage: null,

    // Actions
    setActiveCoalition: (coalition) => set({ activeCoalition: coalition }),
    setCoalitionMembers: (members) => set({ coalitionMembers: members }),
    setRoleAssignments: (roles) => set({ roleAssignments: roles }),
    setHistoricalCoalitions: (coalitions) => set({ historicalCoalitions: coalitions }),

    setLoadingCoalition: (loading) => set({ isLoadingCoalition: loading }),
    setLoadingMembers: (loading) => set({ isLoadingMembers: loading }),
    setLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
    setPollingActive: (active) => set({ pollingActive: active }),
    setPollingInterval: (interval) => set({ pollingInterval: interval }),
    setErrorMessage: (message) => set({ errorMessage: message }),

    // Computed
    isCoalitionActive: () => {
      const { activeCoalition } = get();
      return activeCoalition !== null && activeCoalition.status !== 'rejected';
    },

    synergyStatus: () => {
      const { activeCoalition } = get();
      if (!activeCoalition) return 'none';

      const score = activeCoalition.synergySc ore;
      if (score >= 80) return 'high';
      if (score >= 65) return 'medium';
      return 'low';
    },

    hasRoleConflicts: () => {
      const { roleAssignments } = get();
      return roleAssignments.some((r) => r.conflictDetected);
    },

    getActiveMemberCount: () => {
      const { coalitionMembers } = get();
      return coalitionMembers.filter((m) => m.status === 'active').length;
    },
  }
));
