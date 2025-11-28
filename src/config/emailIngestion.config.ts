/**
 * Email Ingestion Configuration
 * Email account integration, message processing, and opportunity detection
 *
 * @module emailIngestion.config
 * @version 1.0.0
 */

/**
 * Email provider types
 */
export type EmailProvider = 'gmail' | 'outlook' | 'imap_generic';

/**
 * Thread clustering strategies
 */
export type ThreadClusteringStrategy = 'subject_line' | 'sender_recipients' | 'ml_semantic';

/**
 * Email ingestion status
 */
export type IngestionStatus = 'idle' | 'syncing' | 'processing' | 'error';

/**
 * Opportunity detection types
 */
export type OpportunityType =
  | 'inquiry'
  | 'support_issue'
  | 'complaint'
  | 'collaboration_request'
  | 'referral'
  | 'feedback'
  | 'urgent_action_needed'
  | 'sales_opportunity';

/**
 * Email metadata interface
 */
export interface EmailMetadata {
  provider: EmailProvider;
  messageId: string;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  receivedDate: Date;
  hasAttachments: boolean;
  attachmentCount: number;
  bodyLength: number;
  isThread: boolean;
}

/**
 * Email Ingestion configuration interface
 */
export interface EmailIngestionConfig {
  /** Enable/disable email ingestion system */
  EMAIL_INGESTION_ENABLED: boolean;

  /** Enable historical email ingestion */
  HISTORICAL_INGESTION_ENABLED: boolean;

  /** Maximum days of historical emails to ingest */
  MAX_HISTORICAL_DAYS: number;

  /** Enable thread clustering */
  THREAD_CLUSTERING_ENABLED: boolean;

  /** Thread clustering strategy */
  THREAD_CLUSTERING_STRATEGY: ThreadClusteringStrategy;

  /** Enable opportunity detection in emails */
  OPPORTUNITY_DETECTION_ENABLED: boolean;

  /** Enable sentiment analysis on email content */
  SENTIMENT_ANALYSIS_ENABLED: boolean;

  /** Enable automatic email categorization */
  EMAIL_CATEGORIZATION_ENABLED: boolean;

  /** Maximum emails to process per sync cycle */
  MAX_EMAILS_PER_SYNC: number;

  /** Email sync interval in minutes */
  EMAIL_SYNC_INTERVAL_MINUTES: number;

  /** Enable spam/junk filtering */
  SPAM_FILTERING_ENABLED: boolean;

  /** Enable attachment extraction and analysis */
  ATTACHMENT_EXTRACTION_ENABLED: boolean;

  /** Maximum attachment size to process (MB) */
  MAX_ATTACHMENT_SIZE_MB: number;

  /** Enable OCR for document attachments */
  OCR_ENABLED: boolean;

  /** Enable email signature detection and removal */
  SIGNATURE_DETECTION_ENABLED: boolean;

  /** Enable de-duplication of received emails */
  DEDUPLICATION_ENABLED: boolean;

  /** Enable relationship mapping from email data */
  RELATIONSHIP_MAPPING_ENABLED: boolean;

  /** Enable conversation flow analysis */
  CONVERSATION_FLOW_ANALYSIS_ENABLED: boolean;

  /** Cache email data for this many hours */
  EMAIL_CACHE_HOURS: number;

  /** Email retention days before archival */
  EMAIL_RETENTION_DAYS: number;

  /** Enable GDPR compliance checks */
  GDPR_COMPLIANCE_ENABLED: boolean;

  /** Enable PII (Personal Identifiable Information) detection */
  PII_DETECTION_ENABLED: boolean;

  /** Minimum confidence threshold for opportunities (0-1) */
  OPPORTUNITY_CONFIDENCE_THRESHOLD: number;
}

/**
 * Opportunity detection patterns
 */
export const OPPORTUNITY_PATTERNS: Record<OpportunityType, {
  keywords: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}> = {
  inquiry: {
    keywords: ['interested', 'inquiry', 'information', 'learn more', 'tell me about'],
    priority: 'high',
  },
  support_issue: {
    keywords: ['not working', 'broken', 'error', 'issue', 'problem', 'help', 'urgent'],
    priority: 'critical',
  },
  complaint: {
    keywords: ['disappointed', 'unhappy', 'unsatisfied', 'complain', 'poor', 'bad'],
    priority: 'high',
  },
  collaboration_request: {
    keywords: ['partnership', 'collaborate', 'partner with', 'work together', 'co-brand'],
    priority: 'medium',
  },
  referral: {
    keywords: ['recommend', 'refer', 'suggested', 'referred by', 'recommend you'],
    priority: 'high',
  },
  feedback: {
    keywords: ['feedback', 'suggestion', 'improvement', 'enhancement', 'feature request'],
    priority: 'medium',
  },
  urgent_action_needed: {
    keywords: ['urgent', 'ASAP', 'immediately', 'critical', 'emergency'],
    priority: 'critical',
  },
  sales_opportunity: {
    keywords: ['budget', 'purchase', 'buying', 'quote', 'proposal', 'deal'],
    priority: 'high',
  },
};

/**
 * Email Ingestion runtime configuration
 */
export const EMAIL_INGESTION_CONFIG: EmailIngestionConfig = {
  EMAIL_INGESTION_ENABLED: process.env.EMAIL_INGESTION_ENABLED !== 'false',

  HISTORICAL_INGESTION_ENABLED:
    process.env.HISTORICAL_INGESTION_ENABLED !== 'false',

  MAX_HISTORICAL_DAYS: parseInt(
    process.env.MAX_HISTORICAL_DAYS || '365',
    10
  ),

  THREAD_CLUSTERING_ENABLED:
    process.env.THREAD_CLUSTERING_ENABLED !== 'false',

  THREAD_CLUSTERING_STRATEGY:
    (process.env.THREAD_CLUSTERING_STRATEGY as ThreadClusteringStrategy) ||
    'subject_line',

  OPPORTUNITY_DETECTION_ENABLED:
    process.env.OPPORTUNITY_DETECTION_ENABLED !== 'false',

  SENTIMENT_ANALYSIS_ENABLED:
    process.env.SENTIMENT_ANALYSIS_ENABLED !== 'false',

  EMAIL_CATEGORIZATION_ENABLED:
    process.env.EMAIL_CATEGORIZATION_ENABLED !== 'false',

  MAX_EMAILS_PER_SYNC: parseInt(
    process.env.MAX_EMAILS_PER_SYNC || '500',
    10
  ),

  EMAIL_SYNC_INTERVAL_MINUTES: parseInt(
    process.env.EMAIL_SYNC_INTERVAL_MINUTES || '15',
    10
  ),

  SPAM_FILTERING_ENABLED:
    process.env.SPAM_FILTERING_ENABLED !== 'false',

  ATTACHMENT_EXTRACTION_ENABLED:
    process.env.ATTACHMENT_EXTRACTION_ENABLED !== 'false',

  MAX_ATTACHMENT_SIZE_MB: parseInt(
    process.env.MAX_ATTACHMENT_SIZE_MB || '25',
    10
  ),

  OCR_ENABLED: process.env.OCR_ENABLED === 'true',

  SIGNATURE_DETECTION_ENABLED:
    process.env.SIGNATURE_DETECTION_ENABLED !== 'false',

  DEDUPLICATION_ENABLED:
    process.env.DEDUPLICATION_ENABLED !== 'false',

  RELATIONSHIP_MAPPING_ENABLED:
    process.env.RELATIONSHIP_MAPPING_ENABLED !== 'false',

  CONVERSATION_FLOW_ANALYSIS_ENABLED:
    process.env.CONVERSATION_FLOW_ANALYSIS_ENABLED !== 'false',

  EMAIL_CACHE_HOURS: parseInt(
    process.env.EMAIL_CACHE_HOURS || '4',
    10
  ),

  EMAIL_RETENTION_DAYS: parseInt(
    process.env.EMAIL_RETENTION_DAYS || '2555',
    10
  ), // ~7 years

  GDPR_COMPLIANCE_ENABLED:
    process.env.GDPR_COMPLIANCE_ENABLED !== 'false',

  PII_DETECTION_ENABLED:
    process.env.PII_DETECTION_ENABLED !== 'false',

  OPPORTUNITY_CONFIDENCE_THRESHOLD: parseFloat(
    process.env.OPPORTUNITY_CONFIDENCE_THRESHOLD || '0.65'
  ),
};

/**
 * Validate Email Ingestion configuration
 */
export function validateEmailIngestionConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (EMAIL_INGESTION_CONFIG.MAX_HISTORICAL_DAYS < 1) {
    errors.push('MAX_HISTORICAL_DAYS must be at least 1');
  }

  if (EMAIL_INGESTION_CONFIG.MAX_EMAILS_PER_SYNC < 1) {
    errors.push('MAX_EMAILS_PER_SYNC must be at least 1');
  }

  if (EMAIL_INGESTION_CONFIG.EMAIL_SYNC_INTERVAL_MINUTES < 1) {
    errors.push('EMAIL_SYNC_INTERVAL_MINUTES must be at least 1');
  }

  if (EMAIL_INGESTION_CONFIG.MAX_ATTACHMENT_SIZE_MB < 1) {
    errors.push('MAX_ATTACHMENT_SIZE_MB must be at least 1');
  }

  if (EMAIL_INGESTION_CONFIG.EMAIL_RETENTION_DAYS < 30) {
    errors.push('EMAIL_RETENTION_DAYS should be at least 30 for compliance');
  }

  if (
    EMAIL_INGESTION_CONFIG.OPPORTUNITY_CONFIDENCE_THRESHOLD < 0 ||
    EMAIL_INGESTION_CONFIG.OPPORTUNITY_CONFIDENCE_THRESHOLD > 1
  ) {
    errors.push(
      'OPPORTUNITY_CONFIDENCE_THRESHOLD must be between 0 and 1'
    );
  }

  const validStrategies = ['subject_line', 'sender_recipients', 'ml_semantic'];
  if (!validStrategies.includes(EMAIL_INGESTION_CONFIG.THREAD_CLUSTERING_STRATEGY)) {
    errors.push(
      `THREAD_CLUSTERING_STRATEGY must be one of: ${validStrategies.join(
        ', '
      )}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get opportunity patterns
 */
export function getOpportunityPatterns(): typeof OPPORTUNITY_PATTERNS {
  return OPPORTUNITY_PATTERNS;
}

/**
 * Get opportunity type by keyword
 */
export function detectOpportunityType(
  content: string
): OpportunityType | null {
  const lowerContent = content.toLowerCase();

  for (const [type, pattern] of Object.entries(OPPORTUNITY_PATTERNS)) {
    const found = pattern.keywords.some((keyword) =>
      lowerContent.includes(keyword.toLowerCase())
    );
    if (found) {
      return type as OpportunityType;
    }
  }

  return null;
}

/**
 * Get opportunity priority
 */
export function getOpportunityPriority(type: OpportunityType): 'low' | 'medium' | 'high' | 'critical' {
  return OPPORTUNITY_PATTERNS[type]?.priority || 'medium';
}
