/**
 * Draft-State Tracker
 *
 * Manages content lifecycle: draft → review → approved/rejected → published.
 * Integrates with the existing approval system and workforce hooks to create
 * a shadow-draft pipeline where AI-generated content is held in draft state
 * until human review.
 *
 * @module agents/draft-tracker
 */

import type { ApprovalSource } from '@/lib/approval/approvalTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DraftState =
  | 'draft'          // Initial AI generation
  | 'critic_review'  // Under critic agent review
  | 'pending_review' // Waiting for human review
  | 'revision'       // Human requested changes
  | 'approved'       // Human approved
  | 'rejected'       // Human rejected
  | 'published'      // Live / sent / deployed
  | 'archived';      // Removed from active use

export interface DraftEntry {
  id: string;
  workspaceId: string;
  agentId: string;
  contentType: string;
  title: string;
  content: string;
  state: DraftState;
  version: number;
  criticScore?: number;
  criticVerdict?: string;
  criticFeedback?: string[];
  approvalId?: string; // Links to client_approval_requests.id
  revisionHistory: DraftRevision[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DraftRevision {
  version: number;
  content: string;
  state: DraftState;
  changedBy: 'ai' | 'human' | 'critic';
  reason?: string;
  timestamp: string;
}

export interface DraftCreateInput {
  workspaceId: string;
  agentId: string;
  contentType: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface DraftStats {
  total: number;
  byState: Record<DraftState, number>;
  avgCriticScore: number;
  approvalRate: number;
  avgTimeToApproval: number; // ms
}

// ---------------------------------------------------------------------------
// State Machine
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<DraftState, DraftState[]> = {
  draft:          ['critic_review', 'pending_review', 'rejected', 'archived'],
  critic_review:  ['pending_review', 'revision', 'rejected', 'archived'],
  pending_review: ['approved', 'rejected', 'revision', 'archived'],
  revision:       ['critic_review', 'pending_review', 'archived'],
  approved:       ['published', 'revision', 'archived'],
  rejected:       ['revision', 'draft', 'archived'],
  published:      ['archived'],
  archived:       ['draft'], // Allow resurrection
};

// ---------------------------------------------------------------------------
// Draft Tracker
// ---------------------------------------------------------------------------

export class DraftTracker {
  private drafts: Map<string, DraftEntry> = new Map();
  private counter = 0;

  /**
   * Create a new draft.
   */
  create(input: DraftCreateInput): DraftEntry {
    const id = `draft_${Date.now()}_${this.counter++}`;
    const now = new Date().toISOString();

    const entry: DraftEntry = {
      id,
      workspaceId: input.workspaceId,
      agentId: input.agentId,
      contentType: input.contentType,
      title: input.title,
      content: input.content,
      state: 'draft',
      version: 1,
      revisionHistory: [
        {
          version: 1,
          content: input.content,
          state: 'draft',
          changedBy: 'ai',
          reason: 'Initial generation',
          timestamp: now,
        },
      ],
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    this.drafts.set(id, entry);
    return entry;
  }

  /**
   * Transition a draft to a new state.
   */
  transition(
    draftId: string,
    newState: DraftState,
    options?: {
      changedBy?: 'ai' | 'human' | 'critic';
      reason?: string;
      updatedContent?: string;
      criticScore?: number;
      criticVerdict?: string;
      criticFeedback?: string[];
      approvalId?: string;
    }
  ): DraftEntry {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    const allowed = VALID_TRANSITIONS[draft.state];
    if (!allowed.includes(newState)) {
      throw new Error(
        `Invalid transition: ${draft.state} → ${newState}. Allowed: ${allowed.join(', ')}`
      );
    }

    const now = new Date().toISOString();

    // Update content if provided (new revision)
    if (options?.updatedContent) {
      draft.version++;
      draft.content = options.updatedContent;
      draft.revisionHistory.push({
        version: draft.version,
        content: options.updatedContent,
        state: newState,
        changedBy: options.changedBy ?? 'human',
        reason: options.reason,
        timestamp: now,
      });
    } else {
      // State change without content change
      draft.revisionHistory.push({
        version: draft.version,
        content: draft.content,
        state: newState,
        changedBy: options?.changedBy ?? 'human',
        reason: options?.reason,
        timestamp: now,
      });
    }

    draft.state = newState;
    draft.updatedAt = now;

    if (options?.criticScore !== undefined) draft.criticScore = options.criticScore;
    if (options?.criticVerdict) draft.criticVerdict = options.criticVerdict;
    if (options?.criticFeedback) draft.criticFeedback = options.criticFeedback;
    if (options?.approvalId) draft.approvalId = options.approvalId;
    if (newState === 'published') draft.publishedAt = now;

    return draft;
  }

  /**
   * Record critic review results on a draft.
   */
  recordCriticReview(
    draftId: string,
    review: {
      score: number;
      verdict: string;
      feedback: string[];
    }
  ): DraftEntry {
    return this.transition(draftId, 'critic_review', {
      changedBy: 'critic',
      reason: `Critic verdict: ${review.verdict} (score: ${review.score})`,
      criticScore: review.score,
      criticVerdict: review.verdict,
      criticFeedback: review.feedback,
    });
  }

  /**
   * Submit draft for human review (creates approval request link).
   */
  submitForReview(draftId: string, approvalId?: string): DraftEntry {
    return this.transition(draftId, 'pending_review', {
      changedBy: 'ai',
      reason: 'Submitted for human review',
      approvalId,
    });
  }

  /**
   * Get a draft by ID.
   */
  get(draftId: string): DraftEntry | undefined {
    return this.drafts.get(draftId);
  }

  /**
   * List drafts with filters.
   */
  list(filters?: {
    workspaceId?: string;
    agentId?: string;
    state?: DraftState | DraftState[];
    contentType?: string;
    limit?: number;
  }): DraftEntry[] {
    let results = Array.from(this.drafts.values());

    if (filters?.workspaceId) {
      results = results.filter((d) => d.workspaceId === filters.workspaceId);
    }
    if (filters?.agentId) {
      results = results.filter((d) => d.agentId === filters.agentId);
    }
    if (filters?.state) {
      const states = Array.isArray(filters.state) ? filters.state : [filters.state];
      results = results.filter((d) => states.includes(d.state));
    }
    if (filters?.contentType) {
      results = results.filter((d) => d.contentType === filters.contentType);
    }

    // Sort by most recent first
    results.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Get approval source mapping for a draft's content type.
   */
  getApprovalSource(contentType: string): ApprovalSource | string {
    const mapping: Record<string, ApprovalSource | string> = {
      email: 'email_campaign',
      social_post: 'content_optimization',
      landing_page: 'content_optimization',
      proposal: 'ai_phill',
      blog: 'content_optimization',
      ad_copy: 'ads_optimization',
      seo_content: 'seo_audit',
    };
    return mapping[contentType] ?? 'manual';
  }

  /**
   * Get aggregate statistics.
   */
  getStats(workspaceId?: string): DraftStats {
    let drafts = Array.from(this.drafts.values());
    if (workspaceId) {
      drafts = drafts.filter((d) => d.workspaceId === workspaceId);
    }

    const byState = {} as Record<DraftState, number>;
    const allStates: DraftState[] = [
      'draft', 'critic_review', 'pending_review', 'revision',
      'approved', 'rejected', 'published', 'archived',
    ];
    for (const s of allStates) byState[s] = 0;

    let totalCriticScore = 0;
    let criticCount = 0;
    let approvedCount = 0;
    let reviewedCount = 0;
    let totalApprovalTime = 0;
    let approvalTimeCount = 0;

    for (const draft of drafts) {
      byState[draft.state]++;

      if (draft.criticScore !== undefined) {
        totalCriticScore += draft.criticScore;
        criticCount++;
      }

      if (draft.state === 'approved' || draft.state === 'published') {
        approvedCount++;
      }
      if (
        draft.state === 'approved' ||
        draft.state === 'rejected' ||
        draft.state === 'published'
      ) {
        reviewedCount++;
      }

      // Calculate time to approval
      if (draft.publishedAt || draft.state === 'approved') {
        const created = new Date(draft.createdAt).getTime();
        const approved = new Date(draft.updatedAt).getTime();
        totalApprovalTime += approved - created;
        approvalTimeCount++;
      }
    }

    return {
      total: drafts.length,
      byState,
      avgCriticScore: criticCount > 0 ? Math.round(totalCriticScore / criticCount) : 0,
      approvalRate: reviewedCount > 0 ? Math.round((approvedCount / reviewedCount) * 100) : 0,
      avgTimeToApproval: approvalTimeCount > 0 ? Math.round(totalApprovalTime / approvalTimeCount) : 0,
    };
  }

  /**
   * Delete a draft (only archived/rejected drafts).
   */
  delete(draftId: string): boolean {
    const draft = this.drafts.get(draftId);
    if (!draft) return false;
    if (draft.state !== 'archived' && draft.state !== 'rejected') {
      throw new Error(
        `Cannot delete draft in state "${draft.state}". Archive or reject first.`
      );
    }
    return this.drafts.delete(draftId);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const draftTracker = new DraftTracker();
