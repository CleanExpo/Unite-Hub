/**
 * Posting Execution Types
 * Phase 87: Cross-Channel Publishing Execution Layer
 */

export type PostingChannel = 'fb' | 'ig' | 'tiktok' | 'linkedin' | 'youtube' | 'gmb' | 'reddit' | 'email' | 'x';

export type ExecutionStatus = 'pending' | 'success' | 'failed' | 'rolled_back';

export type RollbackStatus = 'pending' | 'success' | 'failed' | 'not_supported';

export type RiskLevel = 'low' | 'medium' | 'high';

// Preflight check results
export interface PreflightCheckResult {
  passed: boolean;
  reason?: string;
  score?: number;
}

export interface PreflightChecks {
  earlyWarning: PreflightCheckResult;
  performanceReality: PreflightCheckResult;
  scalingMode: PreflightCheckResult;
  clientPolicy: PreflightCheckResult;
  fatigue: PreflightCheckResult;
  compliance: PreflightCheckResult;
  truthLayer: PreflightCheckResult;
}

export interface PreflightResult {
  id: string;
  scheduleId: string;
  clientId: string;
  workspaceId: string;
  channel: PostingChannel;
  checks: PreflightChecks;
  passed: boolean;
  confidenceScore: number;
  riskLevel: RiskLevel;
  truthNotes: string;
  truthCompliant: boolean;
  blockedBy?: string;
  blockReason?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

// Execution types
export interface ExecutionPayload {
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledTime?: string;
  targetAudience?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PlatformResponse {
  postId?: string;
  url?: string;
  status: string;
  message?: string;
  data?: Record<string, any>;
}

export interface ExecutionResult {
  id: string;
  preflightId: string;
  scheduleId: string;
  clientId: string;
  workspaceId: string;
  channel: PostingChannel;
  status: ExecutionStatus;
  externalPostId?: string;
  externalUrl?: string;
  platformResponse?: PlatformResponse;
  executionPayload?: ExecutionPayload;
  executedAt?: string;
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  truthNotes?: string;
  forcedBy?: string;
  forceReason?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

// Rollback types
export interface RollbackResult {
  id: string;
  executionId: string;
  channel: PostingChannel;
  externalPostId?: string;
  rollbackPayload?: Record<string, any>;
  status: RollbackStatus;
  attemptedAt?: string;
  completedAt?: string;
  platformResponse?: PlatformResponse;
  errorMessage?: string;
  requestedBy?: string;
  reason?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

// Channel adapter types
export interface ChannelExecutionRequest {
  channel: PostingChannel;
  payload: ExecutionPayload;
  credentials: ChannelCredentials;
  dryRun?: boolean;
}

export interface ChannelCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  pageId?: string;
  accountId?: string;
  metadata?: Record<string, any>;
}

export interface ChannelExecutionResponse {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  errorCode?: string;
  platformResponse?: Record<string, any>;
}

// Service input types
export interface RunPreflightInput {
  scheduleId: string;
  clientId: string;
  workspaceId: string;
  channel: PostingChannel;
  content: string;
}

export interface ExecutePostInput {
  preflightId: string;
  payload: ExecutionPayload;
  force?: boolean;
  forcedBy?: string;
  forceReason?: string;
}

export interface RollbackInput {
  executionId: string;
  requestedBy: string;
  reason: string;
}

// Stats and overview
export interface ExecutionStats {
  total: number;
  success: number;
  failed: number;
  rolledBack: number;
  pending: number;
}

export interface ExecutionOverview {
  stats: ExecutionStats;
  recentExecutions: ExecutionResult[];
  pendingPreflights: PreflightResult[];
  recentRollbacks: RollbackResult[];
}
