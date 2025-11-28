/**
 * Email Ingestion Configuration
 *
 * Configuration for email ingestion from Gmail and Microsoft Outlook/Office365.
 * Controls batch size, sync windows, polling cadence, and provider-specific options.
 */

// ============================================================================
// TYPES
// ============================================================================

export type EmailProvider = 'gmail' | 'outlook';

export interface SyncWindowConfig {
  defaultDays: number;
  maxDays: number;
  initialSyncDays: number;
}

export interface BatchConfig {
  messagesPerBatch: number;
  threadsPerBatch: number;
  maxConcurrentBatches: number;
  delayBetweenBatchesMs: number;
}

export interface PollingConfig {
  intervalMs: number;
  enableWebhooks: boolean;
  webhookSecret: string;
  maxRetries: number;
  retryDelayMs: number;
}

export interface IdeaExtractionConfig {
  enabled: boolean;
  minConfidence: number;
  extractActionItems: boolean;
  extractMeetingRequests: boolean;
  extractDeadlines: boolean;
  extractFollowups: boolean;
  aiModel: 'haiku' | 'sonnet' | 'opus';
}

export interface ClientMappingConfig {
  autoMapByEmail: boolean;
  autoMapByDomain: boolean;
  createUnmappedContacts: boolean;
  unmappedContactStatus: string;
}

export interface ProviderSpecificConfig {
  gmail: {
    labelFilters: string[];
    excludeLabels: string[];
    includeSpam: boolean;
    includeTrash: boolean;
  };
  outlook: {
    folderFilters: string[];
    excludeFolders: string[];
    includeJunk: boolean;
    includeDeleted: boolean;
  };
}

export interface EmailIngestionConfig {
  enabled: boolean;
  sync: SyncWindowConfig;
  batch: BatchConfig;
  polling: PollingConfig;
  ideaExtraction: IdeaExtractionConfig;
  clientMapping: ClientMappingConfig;
  providerSpecific: ProviderSpecificConfig;
  storage: {
    retentionDays: number;
    maxStoragePerUserMb: number;
    compressOlderThanDays: number;
  };
  security: {
    encryptAtRest: boolean;
    encryptionKey: string;
    redactSensitiveData: boolean;
    sensitivePatterns: string[];
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const emailIngestionConfig: EmailIngestionConfig = {
  // Master toggle for email ingestion
  enabled: process.env.EMAIL_INGESTION_ENABLED !== 'false',

  // Sync Window Configuration
  sync: {
    defaultDays: parseInt(process.env.EMAIL_SYNC_DEFAULT_DAYS || '30', 10),
    maxDays: parseInt(process.env.EMAIL_SYNC_MAX_DAYS || '365', 10),
    initialSyncDays: parseInt(process.env.EMAIL_INITIAL_SYNC_DAYS || '90', 10),
  },

  // Batch Processing Configuration
  batch: {
    messagesPerBatch: parseInt(process.env.EMAIL_MESSAGES_PER_BATCH || '50', 10),
    threadsPerBatch: parseInt(process.env.EMAIL_THREADS_PER_BATCH || '25', 10),
    maxConcurrentBatches: parseInt(process.env.EMAIL_MAX_CONCURRENT_BATCHES || '3', 10),
    delayBetweenBatchesMs: parseInt(process.env.EMAIL_BATCH_DELAY_MS || '1000', 10),
  },

  // Polling Configuration
  polling: {
    intervalMs: parseInt(process.env.EMAIL_POLLING_INTERVAL_MS || '300000', 10), // 5 minutes
    enableWebhooks: process.env.EMAIL_ENABLE_WEBHOOKS === 'true',
    webhookSecret: process.env.EMAIL_WEBHOOK_SECRET || '',
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.EMAIL_RETRY_DELAY_MS || '5000', 10),
  },

  // AI Idea Extraction Configuration
  ideaExtraction: {
    enabled: process.env.EMAIL_IDEA_EXTRACTION !== 'false',
    minConfidence: parseFloat(process.env.EMAIL_IDEA_MIN_CONFIDENCE || '0.7'),
    extractActionItems: process.env.EMAIL_EXTRACT_ACTION_ITEMS !== 'false',
    extractMeetingRequests: process.env.EMAIL_EXTRACT_MEETINGS !== 'false',
    extractDeadlines: process.env.EMAIL_EXTRACT_DEADLINES !== 'false',
    extractFollowups: process.env.EMAIL_EXTRACT_FOLLOWUPS !== 'false',
    aiModel: (process.env.EMAIL_IDEA_AI_MODEL as 'haiku' | 'sonnet' | 'opus') || 'haiku',
  },

  // Client Mapping Configuration
  clientMapping: {
    autoMapByEmail: process.env.EMAIL_AUTO_MAP_BY_EMAIL !== 'false',
    autoMapByDomain: process.env.EMAIL_AUTO_MAP_BY_DOMAIN !== 'false',
    createUnmappedContacts: process.env.EMAIL_CREATE_UNMAPPED_CONTACTS === 'true',
    unmappedContactStatus: process.env.EMAIL_UNMAPPED_CONTACT_STATUS || 'lead',
  },

  // Provider-Specific Configuration
  providerSpecific: {
    gmail: {
      labelFilters: (process.env.GMAIL_LABEL_FILTERS || 'INBOX,SENT')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      excludeLabels: (process.env.GMAIL_EXCLUDE_LABELS || 'SPAM,TRASH,CATEGORY_PROMOTIONS')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      includeSpam: process.env.GMAIL_INCLUDE_SPAM === 'true',
      includeTrash: process.env.GMAIL_INCLUDE_TRASH === 'true',
    },
    outlook: {
      folderFilters: (process.env.OUTLOOK_FOLDER_FILTERS || 'inbox,sentitems')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      excludeFolders: (process.env.OUTLOOK_EXCLUDE_FOLDERS || 'junkemail,deleteditems')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      includeJunk: process.env.OUTLOOK_INCLUDE_JUNK === 'true',
      includeDeleted: process.env.OUTLOOK_INCLUDE_DELETED === 'true',
    },
  },

  // Storage Configuration
  storage: {
    retentionDays: parseInt(process.env.EMAIL_RETENTION_DAYS || '365', 10),
    maxStoragePerUserMb: parseInt(process.env.EMAIL_MAX_STORAGE_MB || '500', 10),
    compressOlderThanDays: parseInt(process.env.EMAIL_COMPRESS_AFTER_DAYS || '90', 10),
  },

  // Security Configuration
  security: {
    encryptAtRest: process.env.EMAIL_ENCRYPT_AT_REST !== 'false',
    encryptionKey: process.env.EMAIL_INGESTION_ENCRYPTION_KEY || '',
    redactSensitiveData: process.env.EMAIL_REDACT_SENSITIVE !== 'false',
    sensitivePatterns: [
      // Credit card patterns
      '\\b(?:\\d{4}[- ]?){3}\\d{4}\\b',
      // SSN patterns
      '\\b\\d{3}-\\d{2}-\\d{4}\\b',
      // API key patterns
      '\\b(?:sk|pk)_[a-zA-Z0-9]{20,}\\b',
      // Password patterns in text
      'password[:\\s]+[^\\s]+',
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if email ingestion is properly configured
 */
export function isEmailIngestionConfigured(): boolean {
  return (
    emailIngestionConfig.enabled &&
    !!emailIngestionConfig.security.encryptionKey
  );
}

/**
 * Check if idea extraction is enabled
 */
export function isIdeaExtractionEnabled(): boolean {
  return (
    emailIngestionConfig.enabled &&
    emailIngestionConfig.ideaExtraction.enabled
  );
}

/**
 * Get sync date range for initial sync
 */
export function getInitialSyncDateRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - emailIngestionConfig.sync.initialSyncDays);
  return { from, to };
}

/**
 * Get sync date range for incremental sync
 */
export function getIncrementalSyncDateRange(lastSyncDate?: Date): { from: Date; to: Date } {
  const to = new Date();
  const from = lastSyncDate || new Date();
  if (!lastSyncDate) {
    from.setDate(from.getDate() - emailIngestionConfig.sync.defaultDays);
  }
  return { from, to };
}

/**
 * Check if a Gmail label should be synced
 */
export function shouldSyncGmailLabel(label: string): boolean {
  const config = emailIngestionConfig.providerSpecific.gmail;
  const normalizedLabel = label.toUpperCase();

  // Check exclude list first
  if (config.excludeLabels.some((l) => normalizedLabel.includes(l.toUpperCase()))) {
    return false;
  }

  // Check include list
  if (config.labelFilters.length > 0) {
    return config.labelFilters.some((l) => normalizedLabel.includes(l.toUpperCase()));
  }

  return true;
}

/**
 * Check if an Outlook folder should be synced
 */
export function shouldSyncOutlookFolder(folder: string): boolean {
  const config = emailIngestionConfig.providerSpecific.outlook;
  const normalizedFolder = folder.toLowerCase();

  // Check exclude list first
  if (config.excludeFolders.some((f) => normalizedFolder.includes(f.toLowerCase()))) {
    return false;
  }

  // Check include list
  if (config.folderFilters.length > 0) {
    return config.folderFilters.some((f) => normalizedFolder.includes(f.toLowerCase()));
  }

  return true;
}

/**
 * Redact sensitive data from email content
 */
export function redactSensitiveData(content: string): string {
  if (!emailIngestionConfig.security.redactSensitiveData) {
    return content;
  }

  let redacted = content;
  for (const pattern of emailIngestionConfig.security.sensitivePatterns) {
    const regex = new RegExp(pattern, 'gi');
    redacted = redacted.replace(regex, '[REDACTED]');
  }
  return redacted;
}

/**
 * Get configuration summary for logging (excludes secrets)
 */
export function getConfigSummary(): Record<string, unknown> {
  return {
    enabled: emailIngestionConfig.enabled,
    syncWindow: emailIngestionConfig.sync,
    batchConfig: emailIngestionConfig.batch,
    pollingInterval: emailIngestionConfig.polling.intervalMs,
    webhooksEnabled: emailIngestionConfig.polling.enableWebhooks,
    ideaExtraction: {
      enabled: emailIngestionConfig.ideaExtraction.enabled,
      model: emailIngestionConfig.ideaExtraction.aiModel,
    },
    clientMapping: emailIngestionConfig.clientMapping,
    storageRetentionDays: emailIngestionConfig.storage.retentionDays,
    encryptionConfigured: !!emailIngestionConfig.security.encryptionKey,
  };
}

/**
 * Get the AI model to use for idea extraction
 */
export function getIdeaExtractionModel(): string {
  const modelMap = {
    haiku: 'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-5-20250929',
    opus: 'claude-opus-4-5-20251101',
  };
  return modelMap[emailIngestionConfig.ideaExtraction.aiModel];
}

export default emailIngestionConfig;
