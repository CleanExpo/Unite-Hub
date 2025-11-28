/**
 * Email Ingestion Module
 *
 * Email synchronization from Gmail and Outlook with AI-powered idea extraction.
 */

// Gmail Client
export {
  createGoogleGmailClient,
  default as GoogleGmailClient,
  type GmailMessage,
  type GmailThread,
  type GmailListResponse,
  type GmailSyncResult,
  type ParsedEmailMessage as GmailParsedMessage,
} from './googleGmailClient';

// Microsoft Graph Client
export {
  createMicrosoftGraphClient,
  default as MicrosoftGraphClient,
  type OutlookMessage,
  type OutlookAttachment,
  type OutlookConversation,
  type OutlookListResponse,
  type ParsedOutlookMessage,
} from './microsoftGraphClient';

// Idea Extractor
export {
  getEmailIdeaExtractor,
  default as EmailIdeaExtractor,
  type IdeaType,
  type Priority,
  type ExtractedIdea,
  type EmailContent,
  type ExtractionResult,
} from './emailIdeaExtractor';

// Client Mapper
export {
  getClientEmailMapper,
  default as ClientEmailMapper,
  type Contact,
  type EmailAddress,
  type MappingResult,
  type BulkMappingResult,
} from './clientEmailMapper';

// Ingestion Service
export {
  getEmailIngestionService,
  default as EmailIngestionService,
  type SyncOptions,
  type SyncProgress,
  type EmailThread,
} from './emailIngestionService';

// ============================================================================
// Historical Email Identity Engine
// ============================================================================

// History Ingestion Service
export {
  historyIngestionService,
  type IngestionConfig,
  type IngestionJob,
  type IngestionProgress,
  type IngestionResult,
} from './historyIngestionService';

// Thread Cluster Service
export {
  threadClusterService,
  type ThreadClusterConfig,
  type ClusteredThread,
  type ThemeClassification,
  type MessageForClustering,
  type ThemeCategory,
} from './threadClusterService';

// Relationship Timeline Service
export {
  relationshipTimelineService,
  type TimelineEvent,
  type EventType,
  type RelationshipSummary,
  type RelationshipPhase,
} from './relationshipTimelineService';

// Opportunity Detector Service
export {
  opportunityDetectorService,
  type InsightCategory,
  type InsightPriority,
  type InsightStatus,
  type DetectedInsight,
  type OpportunityAnalysis,
  type OpportunityExtractionResult,
  type ExtractedItem,
} from './opportunityDetectorService';

// Pre-Client Mapper Service
export {
  preClientMapperService,
  type PreClientProfile,
  type PreClientStatus,
  type EmailIdentity,
  type DiscoveryResult,
  type ConversionResult,
} from './preClientMapperService';
