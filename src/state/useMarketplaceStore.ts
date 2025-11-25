'use client';

import { create } from 'zustand';

export interface AuctionBid {
  agentId: string;
  rawScore: number;
  finalBid: number;
  risk: number;
  confidence: number;
  loadFactor: number;
  capabilityMatch: number;
  successRate: number;
  contextRelevance: number;
  disqualified: boolean;
  disqualificationReason?: string;
}

export interface AuctionSession {
  auctionId: string;
  taskId: string;
  taskTitle: string;
  taskComplexity: number;
  status: 'PENDING' | 'BIDDING' | 'EVALUATING' | 'COMPLETED' | 'CANCELLED';
  winningAgentId?: string;
  winningBid?: number;
  pricePaid?: number;
  totalBidsReceived: number;
  disqualifiedCount: number;
  bundleUsed: boolean;
  safetyFilterTriggered: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface AuctionWinner {
  decisionId: string;
  selectedAgent: string;
  selectedAction: string;
  confidenceScore: number;
  riskScore: number;
  consensusPercentage: number;
  rationale: string;
  alternativeActions?: Array<{
    agentId: string;
    bid: number;
    reason: string;
    margin: number;
  }>;
}

export interface HistoricalAuction {
  auctionId: string;
  taskTitle: string;
  taskComplexity: number;
  winningAgent: string;
  winningBid: number;
  outcome: 'success' | 'partial_success' | 'failure';
  completedAt: string;
  safetyFilterTriggered: boolean;
  bundleUsed: boolean;
}

interface MarketplaceStore {
  // State
  activeAuction: AuctionSession | null;
  currentBids: AuctionBid[];
  currentWinner: AuctionWinner | null;
  historicalAuctions: HistoricalAuction[];

  // Loading & Status
  isLoadingAuction: boolean;
  isLoadingBids: boolean;
  isLoadingWinner: boolean;
  isLoadingHistory: boolean;
  pollingActive: boolean;
  errorMessage: string | null;

  // Actions
  setActiveAuction: (auction: AuctionSession | null) => void;
  setCurrentBids: (bids: AuctionBid[]) => void;
  setCurrentWinner: (winner: AuctionWinner | null) => void;
  setHistoricalAuctions: (auctions: HistoricalAuction[]) => void;

  setLoadingAuction: (loading: boolean) => void;
  setLoadingBids: (loading: boolean) => void;
  setLoadingWinner: (loading: boolean) => void;
  setLoadingHistory: (loading: boolean) => void;
  setPollingActive: (active: boolean) => void;
  setErrorMessage: (message: string | null) => void;

  // Computed
  hasActiveAuction: () => boolean;
  getQualifiedBids: () => AuctionBid[];
  getDisqualifiedBids: () => AuctionBid[];
}

export const useMarketplaceStore = create<MarketplaceStore>((set, get) => ({
  // Initial state
  activeAuction: null,
  currentBids: [],
  currentWinner: null,
  historicalAuctions: [],

  isLoadingAuction: false,
  isLoadingBids: false,
  isLoadingWinner: false,
  isLoadingHistory: false,
  pollingActive: false,
  errorMessage: null,

  // Actions
  setActiveAuction: (auction) => set({ activeAuction: auction }),
  setCurrentBids: (bids) => set({ currentBids: bids }),
  setCurrentWinner: (winner) => set({ currentWinner: winner }),
  setHistoricalAuctions: (auctions) => set({ historicalAuctions: auctions }),

  setLoadingAuction: (loading) => set({ isLoadingAuction: loading }),
  setLoadingBids: (loading) => set({ isLoadingBids: loading }),
  setLoadingWinner: (loading) => set({ isLoadingWinner: loading }),
  setLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
  setPollingActive: (active) => set({ pollingActive: active }),
  setErrorMessage: (message) => set({ errorMessage: message }),

  // Computed
  hasActiveAuction: () => {
    const { activeAuction } = get();
    return activeAuction !== null && activeAuction.status !== 'COMPLETED' && activeAuction.status !== 'CANCELLED';
  },

  getQualifiedBids: () => {
    const { currentBids } = get();
    return currentBids.filter((bid) => !bid.disqualified);
  },

  getDisqualifiedBids: () => {
    const { currentBids } = get();
    return currentBids.filter((bid) => bid.disqualified);
  },
}));
