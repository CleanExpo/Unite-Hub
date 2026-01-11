/**
 * Type definitions for Authority Intelligence agents (Scout + Auditor)
 */

export type PathwayType = 'geographic' | 'content' | 'hybrid';

export type VacuumType = 'geographic' | 'content';

export interface ScoutTaskPayload {
  clientId: string;
  pathway: PathwayType; // Client's chosen analysis pathway
  targetState?: string; // Filter to specific AU state
  targetService?: string; // Service category (e.g., "plumber", "electrician")
  maxGaps?: number; // Limit number of gaps to find (default 20)
}

export interface GeographicVacuum {
  suburb: string;
  state: string;
  keyword: string;
  gapSeverity: number; // 0-100 (higher = bigger gap)
  authorityScore: number; // 0-100 (lower = less client presence)
  competitorCount: number;
  competitionLevel: 'none' | 'low' | 'medium' | 'high';
  topCompetitors: string[];
  opportunityScore: number; // Calculated opportunity potential
  localKeywords: string[];
}

export interface ContentVacuum {
  suburb: string;
  state: string;
  totalJobs: number;
  missingProofTypes: string[]; // ['before_after_photo', 'client_review', etc.]
  contentGapScore: number; // 0-1 (higher = more gaps)
  schemaReadyJobs: number;
  recommendedActions: string[];
}

export interface ScoutResult {
  pathway: PathwayType;
  geographicVacuums?: GeographicVacuum[];
  contentVacuums?: ContentVacuum[];
  totalVacuumsFound: number;
  analysisComplete: boolean;
  costUsd: number;
  processingTimeMs: number;
}

export interface AuditorTaskPayload {
  informationVacuumId: string; // Reference to discovered vacuum
  vacuumType: VacuumType;
  keyword: string;
  suburb: string;
  state: string;
  clientId: string;
  clientProofPhotos: string[]; // URLs to overlay
  clientName: string;
  outputFormats: ('video' | 'static')[]; // Default: both
}

export interface AuditorResult {
  informationVacuumId: string;
  visualAuditId: string; // UUID of created synthex_visual_audits row
  videoUrl?: string; // Loom-style walkthrough
  staticPageUrl?: string; // Static diagnostic page
  searchGapScreenshots: string[];
  recordingDurationMs: number;
  costUsd: number;
}

export interface AgentSession {
  id: string;
  workspaceId: string;
  clientId: string;
  pathway: PathwayType;
  status: 'initializing' | 'scouting' | 'auditing' | 'completed' | 'failed';
  currentStage: string;
  scoutResult?: ScoutResult;
  auditorResults?: AuditorResult[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}
