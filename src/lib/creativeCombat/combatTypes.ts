/**
 * Creative Combat Types
 * Phase 88: A/B Intelligence Layer
 */

export type CombatChannel = 'fb' | 'ig' | 'tiktok' | 'linkedin' | 'youtube' | 'gmb' | 'reddit' | 'email' | 'x';

export type RoundStatus = 'pending' | 'running' | 'complete' | 'inconclusive';

export type CombatStrategy = 'classic_ab' | 'multivariate' | 'rapid_cycle';

export type EntryStatus = 'pending' | 'active' | 'winner' | 'loser' | 'tied';

export type ResultType = 'winner' | 'inconclusive' | 'tie';

export type ConfidenceBand = 'low' | 'medium' | 'high' | 'very_high';

export type Variant = 'A' | 'B' | 'C' | 'D';

// Combat round
export interface CombatRound {
  id: string;
  createdAt: string;
  clientId: string;
  workspaceId: string;
  channel: CombatChannel;
  roundStatus: RoundStatus;
  strategy: CombatStrategy;
  startedAt?: string;
  completedAt?: string;
  minConfidence: number;
  minSampleSize: number;
  truthNotes?: string;
  metadata: Record<string, any>;
}

// Combat entry
export interface CombatEntry {
  id: string;
  createdAt: string;
  roundId: string;
  creativeAssetId: string;
  postingExecutionId?: string;
  variant: Variant;
  rawMetrics: RawMetrics;
  realityAdjustedMetrics: AdjustedMetrics;
  confidence: number;
  score: number;
  impressions: number;
  clicks: number;
  conversions: number;
  engagementRate: number;
  entryStatus: EntryStatus;
  metadata: Record<string, any>;
}

// Combat result
export interface CombatResult {
  id: string;
  createdAt: string;
  roundId: string;
  winnerEntryId?: string;
  loserEntryId?: string;
  resultType: ResultType;
  confidenceBand: ConfidenceBand;
  statisticalSignificance: number;
  winnerScore?: number;
  loserScore?: number;
  scoreDifference?: number;
  scoreLiftPercent?: number;
  summaryMarkdown: string;
  truthComplete: boolean;
  truthNotes?: string;
  winnerPromoted: boolean;
  loserRetired: boolean;
  evolutionTriggered: boolean;
  metadata: Record<string, any>;
}

// Metrics types
export interface RawMetrics {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  saves?: number;
  reach?: number;
  cost?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  engagementRate?: number;
}

export interface AdjustedMetrics {
  adjustedImpressions?: number;
  adjustedClicks?: number;
  adjustedConversions?: number;
  confidenceAdjustment?: number;
  seasonalityFactor?: number;
  fatigueFactor?: number;
  compositeScore?: number;
}

// Input types
export interface CreateRoundInput {
  clientId: string;
  workspaceId: string;
  channel: CombatChannel;
  strategy?: CombatStrategy;
  minConfidence?: number;
  minSampleSize?: number;
}

export interface AttachEntryInput {
  roundId: string;
  creativeAssetId: string;
  postingExecutionId?: string;
  variant: Variant;
  rawMetrics?: RawMetrics;
}

// Stats types
export interface CombatStats {
  totalRounds: number;
  completed: number;
  running: number;
  pending: number;
  inconclusive: number;
}

export interface WinnerStats {
  totalResults: number;
  winnersFound: number;
  ties: number;
  inconclusive: number;
  winnersPromoted: number;
  losersRetired: number;
  avgLiftPercent: number;
}
