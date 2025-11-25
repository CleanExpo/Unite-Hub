import { create } from 'zustand';

export interface NegotiationSession {
  sessionId: string;
  objective: string;
  status: 'active' | 'resolved' | 'deadlocked' | 'escalated';
  participatingAgents: string[];
  proposalsCount: number;
  conflictsDetected: number;
  overallConsensus: number;
  createdAt: string;
}

export interface AgentProposal {
  agentId: string;
  action: string;
  confidence: number;
  riskScore: number;
  estimatedCost: number;
  estimatedBenefit: number;
  rationale: string;
}

export interface ConsensusScore {
  agentId: string;
  confidenceScore: number;
  riskAdjustedScore: number;
  weightedScore: number;
  overallConsensus: number;
}

export interface ArbitrationDecision {
  decisionId: string;
  selectedAgent: string;
  selectedAction: string;
  confidenceScore: number;
  riskScore: number;
  consensusPercentage: number;
  predictedOutcome: 'high_confidence' | 'moderate_confidence' | 'low_confidence';
}

interface NegotiationState {
  // Data
  activeSessions: NegotiationSession[];
  selectedSessionId: string | null;
  currentProposals: AgentProposal[];
  currentConsensusScores: ConsensusScore[];
  currentDecision: ArbitrationDecision | null;
  historicalSessions: NegotiationSession[];

  // Loading states
  isLoadingSessions: boolean;
  isLoadingDetails: boolean;
  isLoadingHistory: boolean;
  pollingActive: boolean;

  // Errors
  error: string | null;

  // Actions
  setActiveSessions: (sessions: NegotiationSession[]) => void;
  setSelectedSessionId: (id: string | null) => void;
  setCurrentProposals: (proposals: AgentProposal[]) => void;
  setCurrentConsensusScores: (scores: ConsensusScore[]) => void;
  setCurrentDecision: (decision: ArbitrationDecision | null) => void;
  setHistoricalSessions: (sessions: NegotiationSession[]) => void;
  setIsLoadingSessions: (loading: boolean) => void;
  setIsLoadingDetails: (loading: boolean) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  setPollingActive: (active: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useNegotiationStore = create<NegotiationState>((set) => ({
  // Initial state
  activeSessions: [],
  selectedSessionId: null,
  currentProposals: [],
  currentConsensusScores: [],
  currentDecision: null,
  historicalSessions: [],
  isLoadingSessions: false,
  isLoadingDetails: false,
  isLoadingHistory: false,
  pollingActive: false,
  error: null,

  // Actions
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),
  setSelectedSessionId: (id) => set({ selectedSessionId: id }),
  setCurrentProposals: (proposals) => set({ currentProposals: proposals }),
  setCurrentConsensusScores: (scores) => set({ currentConsensusScores: scores }),
  setCurrentDecision: (decision) => set({ currentDecision: decision }),
  setHistoricalSessions: (sessions) => set({ historicalSessions: sessions }),
  setIsLoadingSessions: (loading) => set({ isLoadingSessions: loading }),
  setIsLoadingDetails: (loading) => set({ isLoadingDetails: loading }),
  setIsLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
  setPollingActive: (active) => set({ pollingActive: active }),
  setError: (error) => set({ error }),
  reset: () => set({
    activeSessions: [],
    selectedSessionId: null,
    currentProposals: [],
    currentConsensusScores: [],
    currentDecision: null,
    historicalSessions: [],
    isLoadingSessions: false,
    isLoadingDetails: false,
    isLoadingHistory: false,
    pollingActive: false,
    error: null,
  }),
}));
