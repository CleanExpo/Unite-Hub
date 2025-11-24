/**
 * Compliance Types
 * Phase 93: GCCAE - Global Compliance & Cultural Adaptation
 */

export type PolicySeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'warning' | 'blocked' | 'overridden';
export type SpellingVariant = 'australian' | 'american' | 'british' | 'canadian';

export interface CompliancePolicy {
  id: string;
  regionSlug: string;
  platform: string;
  policyCode: string;
  severity: PolicySeverity;
  descriptionMarkdown: string;
  examplePatterns: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocaleProfile {
  id: string;
  regionSlug: string;
  localeCode: string;
  spellingVariant: SpellingVariant;
  toneGuidelines: {
    formality: string;
    directness: string;
    humor: string;
    notes: string;
  };
  holidayCalendar: Array<{
    name: string;
    date: string;
    note?: string;
  }>;
  sensitivityFlags: string[];
}

export interface ComplianceIncident {
  id: string;
  createdAt: string;
  agencyId: string;
  regionId: string | null;
  clientId: string | null;
  platform: string;
  policyCode: string;
  severity: PolicySeverity;
  status: IncidentStatus;
  contentRef: {
    type?: string;
    id?: string;
    preview?: string;
  };
  notesMarkdown: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface PolicyViolation {
  policyCode: string;
  severity: PolicySeverity;
  matchedPatterns: string[];
  confidence: number;
  description: string;
}

export interface ComplianceCheckResult {
  passed: boolean;
  violations: PolicyViolation[];
  warnings: string[];
  blockedReason: string | null;
  regionSlug: string;
  platform: string;
  checkedAt: string;
}

export interface AdaptedCopyResult {
  originalText: string;
  adaptedText: string;
  changes: Array<{
    type: 'spelling' | 'tone' | 'sensitivity';
    original: string;
    adapted: string;
    reason: string;
  }>;
  localeCode: string;
}

export interface CulturalNotes {
  suggestions: Array<{
    type: string;
    suggestion: string;
    reason: string;
  }>;
  sensitivityWarnings: string[];
  upcomingHolidays: Array<{
    name: string;
    date: string;
    note?: string;
  }>;
}

export interface IncidentSummary {
  total: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byStatus: {
    warning: number;
    blocked: number;
    overridden: number;
  };
  unresolved: number;
  last30Days: number;
}
