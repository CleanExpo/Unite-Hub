/**
 * Types and interfaces for privacy and compliance features
 */

/**
 * Consent types supported by the system
 */
export enum ConsentType {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  PROFILING = 'profiling',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  COOKIES = 'cookies',
  PRIVACY_POLICY = 'privacy_policy',
  TERMS_OF_SERVICE = 'terms_of_service'
}

/**
 * Status of data deletion/export requests
 */
export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DENIED = 'denied'
}

/**
 * Types of data that can be deleted or exported
 */
export enum DataCategory {
  PROFILE = 'profile',
  COMMUNICATIONS = 'communications',
  ACTIVITY = 'activity',
  ANALYTICS = 'analytics',
  CONSULTATIONS = 'consultations',
  PAYMENTS = 'payments',
  PREFERENCES = 'preferences',
  ALL = 'all'
}

/**
 * Export format options
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf'
}

/**
 * User consent record
 */
export interface UserConsent {
  id: number;
  userId: string;
  consentType: ConsentType;
  consented: boolean;
  consentVersion: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cookie consent preferences
 */
export interface CookieConsent {
  id: number;
  sessionId: string;
  userId?: string;
  necessary: boolean; // Always true
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data deletion request
 */
export interface DataDeletionRequest {
  id: number;
  userId: string;
  requestType: 'partial' | 'full';
  status: RequestStatus;
  requestReason?: string;
  dataCategories?: DataCategory[];
  adminNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Data export request
 */
export interface DataExportRequest {
  id: number;
  userId: string;
  exportFormat: ExportFormat;
  status: RequestStatus;
  dataCategories?: DataCategory[];
  downloadUrl?: string;
  downloadExpiry?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * User communication preferences
 */
export interface CommunicationPreferences {
  marketingEmails: boolean;
  productUpdates: boolean;
  newsletter: boolean;
}

/**
 * User data processing preferences
 */
export interface DataProcessingPreferences {
  analytics: boolean;
  profiling: boolean;
  thirdPartySharing: boolean;
}

/**
 * User privacy settings
 */
export interface UserPrivacySettings {
  userId: string;
  communicationPreferences: CommunicationPreferences;
  dataProcessingPreferences: DataProcessingPreferences;
  lastPrivacyConsentDate?: Date;
}

/**
 * Compliance audit log entry
 */
export interface ComplianceAuditLogEntry {
  id: number;
  userId?: string;
  actionType: string;
  actionDetails: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  adminId?: string;
  createdAt: Date;
}

/**
 * Privacy policy version
 */
export interface PrivacyPolicyVersion {
  id: number;
  version: string;
  content: string;
  active: boolean;
  publishedAt: Date;
  createdBy?: string;
  createdAt: Date;
}

/**
 * Terms of service version
 */
export interface TermsOfServiceVersion {
  id: number;
  version: string;
  content: string;
  active: boolean;
  publishedAt: Date;
  createdBy?: string;
  createdAt: Date;
}

/**
 * User agreement record
 */
export interface UserAgreement {
  id: number;
  userId: string;
  agreementType: ConsentType.PRIVACY_POLICY | ConsentType.TERMS_OF_SERVICE;
  version: string;
  agreed: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * User preferences form data
 */
export interface UserPreferencesFormData {
  communicationPreferences: CommunicationPreferences;
  dataProcessingPreferences: DataProcessingPreferences;
}

/**
 * Cookie consent form data
 */
export interface CookieConsentFormData {
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

/**
 * Data deletion request form data
 */
export interface DataDeletionRequestFormData {
  requestType: 'partial' | 'full';
  requestReason?: string;
  dataCategories?: DataCategory[];
}

/**
 * Data export request form data
 */
export interface DataExportRequestFormData {
  exportFormat: ExportFormat;
  dataCategories?: DataCategory[];
}
