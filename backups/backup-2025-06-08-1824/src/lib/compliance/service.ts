import { supabaseAdmin } from '@/lib/supabase/admin';
import { 
  ConsentType, 
  RequestStatus, 
  DataCategory,
  ExportFormat,
  UserConsent,
  CookieConsent,
  DataDeletionRequest,
  DataExportRequest,
  UserPrivacySettings,
  ComplianceAuditLogEntry,
  PrivacyPolicyVersion,
  TermsOfServiceVersion,
  UserAgreement,
  UserPreferencesFormData,
  CookieConsentFormData,
  DataDeletionRequestFormData,
  DataExportRequestFormData
} from './types';

/**
 * Service for handling GDPR/CCPA compliance-related operations
 */
export class ComplianceService {
  /**
   * Record a user's consent
   * @param userId User ID
   * @param consentType Type of consent
   * @param consented Whether user consented
   * @param consentVersion Version of the consent form
   * @param ipAddress User's IP address
   * @param userAgent User's browser/device information
   * @returns The created consent record
   */
  static async recordConsent(
    userId: string,
    consentType: ConsentType,
    consented: boolean,
    consentVersion: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_consents')
        .insert({
          user_id: userId,
          consent_type: consentType,
          consented,
          consent_version: consentVersion,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording consent:', error);
        return null;
      }

      // Log the compliance action
      await this.logComplianceAction(
        userId,
        consented ? 'consent_given' : 'consent_withdrawn',
        {
          consentType,
          consentVersion,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      );

      // If it's a privacy policy consent, update the user's last consent date
      if (consentType === ConsentType.PRIVACY_POLICY && consented) {
        await supabaseAdmin
          .from('users')
          .update({
            last_privacy_consent_date: new Date().toISOString()
          })
          .eq('id', userId);
      }

      return this.mapUserConsent(data);
    } catch (error) {
      console.error('Error in recordConsent:', error);
      return null;
    }
  }

  /**
   * Get a user's latest consent for a specific type
   * @param userId User ID
   * @param consentType Type of consent
   * @returns The latest consent record
   */
  static async getUserConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<UserConsent | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        console.error('Error getting user consent:', error);
        return null;
      }

      return this.mapUserConsent(data);
    } catch (error) {
      console.error('Error in getUserConsent:', error);
      return null;
    }
  }

  /**
   * Get all consents for a user
   * @param userId User ID
   * @returns Array of consent records
   */
  static async getAllUserConsents(userId: string): Promise<UserConsent[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all user consents:', error);
        return [];
      }

      return data.map(this.mapUserConsent);
    } catch (error) {
      console.error('Error in getAllUserConsents:', error);
      return [];
    }
  }

  /**
   * Record cookie consent preferences
   * @param sessionId Browser session ID
   * @param preferences Cookie consent preferences
   * @param userId Optional user ID for logged-in users
   * @param ipAddress User's IP address
   * @param userAgent User's browser/device information
   * @returns The created cookie consent record
   */
  static async recordCookieConsent(
    sessionId: string,
    preferences: CookieConsentFormData,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<CookieConsent | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cookie_consents')
        .insert({
          session_id: sessionId,
          user_id: userId,
          necessary: true, // Always true
          preferences: preferences.preferences,
          analytics: preferences.analytics,
          marketing: preferences.marketing,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording cookie consent:', error);
        return null;
      }

      // Log the compliance action
      await this.logComplianceAction(
        userId,
        'cookie_consent_updated',
        {
          sessionId,
          preferences: preferences,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      );

      return this.mapCookieConsent(data);
    } catch (error) {
      console.error('Error in recordCookieConsent:', error);
      return null;
    }
  }

  /**
   * Get cookie consent for a session or user
   * @param sessionId Browser session ID
   * @param userId Optional user ID for logged-in users
   * @returns The latest cookie consent record
   */
  static async getCookieConsent(
    sessionId: string,
    userId?: string
  ): Promise<CookieConsent | null> {
    try {
      let query = supabaseAdmin
        .from('cookie_consents')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        console.error('Error getting cookie consent:', error);
        return null;
      }

      return this.mapCookieConsent(data);
    } catch (error) {
      console.error('Error in getCookieConsent:', error);
      return null;
    }
  }

  /**
   * Create a data deletion request
   * @param userId User ID
   * @param formData Data deletion request details
   * @param ipAddress User's IP address
   * @param userAgent User's browser/device information
   * @returns The created data deletion request
   */
  static async createDataDeletionRequest(
    userId: string,
    formData: DataDeletionRequestFormData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DataDeletionRequest | null> {
    try {
      // Check if there's already a pending or processing request
      const { data: existingRequests, error: checkError } = await supabaseAdmin
        .from('data_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', [RequestStatus.PENDING, RequestStatus.PROCESSING]);

      if (checkError) {
        console.error('Error checking existing deletion requests:', checkError);
        return null;
      }

      if (existingRequests && existingRequests.length > 0) {
        console.warn('User already has a pending or processing deletion request');
        throw new Error('You already have a pending or processing data deletion request');
      }

      // Create the new request
      const { data, error } = await supabaseAdmin
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          request_type: formData.requestType,
          status: RequestStatus.PENDING,
          request_reason: formData.requestReason,
          data_categories: formData.dataCategories && formData.dataCategories.length 
            ? formData.dataCategories 
            : null,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating data deletion request:', error);
        return null;
      }

      // Log the compliance action
      await this.logComplianceAction(
        userId,
        'data_deletion_requested',
        {
          requestId: data.id,
          requestType: formData.requestType,
          dataCategories: formData.dataCategories,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      );

      return this.mapDataDeletionRequest(data);
    } catch (error) {
      console.error('Error in createDataDeletionRequest:', error);
      if (error instanceof Error) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Get data deletion requests for a user
   * @param userId User ID
   * @returns Array of data deletion requests
   */
  static async getDataDeletionRequests(userId: string): Promise<DataDeletionRequest[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('data_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting data deletion requests:', error);
        return [];
      }

      return data.map(this.mapDataDeletionRequest);
    } catch (error) {
      console.error('Error in getDataDeletionRequests:', error);
      return [];
    }
  }

  /**
   * Create a data export request
   * @param userId User ID
   * @param formData Data export request details
   * @param ipAddress User's IP address
   * @param userAgent User's browser/device information
   * @returns The created data export request
   */
  static async createDataExportRequest(
    userId: string,
    formData: DataExportRequestFormData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DataExportRequest | null> {
    try {
      // Check if there's already a pending or processing request
      const { data: existingRequests, error: checkError } = await supabaseAdmin
        .from('data_export_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', [RequestStatus.PENDING, RequestStatus.PROCESSING]);

      if (checkError) {
        console.error('Error checking existing export requests:', checkError);
        return null;
      }

      if (existingRequests && existingRequests.length > 0) {
        console.warn('User already has a pending or processing export request');
        throw new Error('You already have a pending or processing data export request');
      }

      // Create the new request
      const { data, error } = await supabaseAdmin
        .from('data_export_requests')
        .insert({
          user_id: userId,
          export_format: formData.exportFormat,
          status: RequestStatus.PENDING,
          data_categories: formData.dataCategories && formData.dataCategories.length 
            ? formData.dataCategories 
            : null,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating data export request:', error);
        return null;
      }

      // Log the compliance action
      await this.logComplianceAction(
        userId,
        'data_export_requested',
        {
          requestId: data.id,
          exportFormat: formData.exportFormat,
          dataCategories: formData.dataCategories,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      );

      return this.mapDataExportRequest(data);
    } catch (error) {
      console.error('Error in createDataExportRequest:', error);
      if (error instanceof Error) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Get data export requests for a user
   * @param userId User ID
   * @returns Array of data export requests
   */
  static async getDataExportRequests(userId: string): Promise<DataExportRequest[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('data_export_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting data export requests:', error);
        return [];
      }

      return data.map(this.mapDataExportRequest);
    } catch (error) {
      console.error('Error in getDataExportRequests:', error);
      return [];
    }
  }

  /**
   * Update user privacy settings/preferences
   * @param userId User ID
   * @param formData Updated preferences
   * @param ipAddress User's IP address
   * @param userAgent User's browser/device information
   * @returns Success status
   */
  static async updateUserPrivacySettings(
    userId: string,
    formData: UserPreferencesFormData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          communication_preferences: formData.communicationPreferences,
          data_processing_preferences: formData.dataProcessingPreferences
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user privacy settings:', error);
        return false;
      }

      // Log the compliance action
      await this.logComplianceAction(
        userId,
        'privacy_settings_updated',
        {
          settings: formData,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      );

      return true;
    } catch (error) {
      console.error('Error in updateUserPrivacySettings:', error);
      return false;
    }
  }

  /**
   * Get user privacy settings
   * @param userId User ID
   * @returns User privacy settings
   */
  static async getUserPrivacySettings(userId: string): Promise<UserPrivacySettings | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, communication_preferences, data_processing_preferences, last_privacy_consent_date')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting user privacy settings:', error);
        return null;
      }

      return {
        userId: data.id,
        communicationPreferences: data.communication_preferences || {
          marketingEmails: false,
          productUpdates: false,
          newsletter: false
        },
        dataProcessingPreferences: data.data_processing_preferences || {
          analytics: false,
          profiling: false,
          thirdPartySharing: false
        },
        lastPrivacyConsentDate: data.last_privacy_consent_date 
          ? new Date(data.last_privacy_consent_date) 
          : undefined
      };
    } catch (error) {
      console.error('Error in getUserPrivacySettings:', error);
      return null;
    }
  }

  /**
   * Get the active privacy policy version
   * @returns Active privacy policy version
   */
  static async getActivePrivacyPolicy(): Promise<PrivacyPolicyVersion | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('privacy_policy_versions')
        .select('*')
        .eq('active', true)
        .single();

      if (error) {
        console.error('Error getting active privacy policy:', error);
        return null;
      }

      return {
        id: data.id,
        version: data.version,
        content: data.content,
        active: data.active,
        publishedAt: new Date(data.published_at),
        createdBy: data.created_by,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error in getActivePrivacyPolicy:', error);
      return null;
    }
  }

  /**
   * Get the active terms of service version
   * @returns Active terms of service version
   */
  static async getActiveTermsOfService(): Promise<TermsOfServiceVersion | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('terms_of_service_versions')
        .select('*')
        .eq('active', true)
        .single();

      if (error) {
        console.error('Error getting active terms of service:', error);
        return null;
      }

      return {
        id: data.id,
        version: data.version,
        content: data.content,
        active: data.active,
        publishedAt: new Date(data.published_at),
        createdBy: data.created_by,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error in getActiveTermsOfService:', error);
      return null;
    }
  }

  /**
   * Record user agreement to privacy policy or terms of service
   * @param userId User ID
   * @param agreementType Type of agreement (privacy policy or terms of service)
   * @param version Version of the document agreed to
   * @param agreed Whether user agreed
   * @param ipAddress User's IP address
   * @param userAgent User's browser/device information
   * @returns The created agreement record
   */
  static async recordUserAgreement(
    userId: string,
    agreementType: ConsentType.PRIVACY_POLICY | ConsentType.TERMS_OF_SERVICE,
    version: string,
    agreed: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserAgreement | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_agreements')
        .insert({
          user_id: userId,
          agreement_type: agreementType,
          version,
          agreed,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording user agreement:', error);
        return null;
      }

      // Log the compliance action
      await this.logComplianceAction(
        userId,
        agreed ? 'agreement_accepted' : 'agreement_declined',
        {
          agreementType,
          version,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      );

      // If it's a privacy policy agreement, update the user's last consent date
      if (agreementType === ConsentType.PRIVACY_POLICY && agreed) {
        await supabaseAdmin
          .from('users')
          .update({
            last_privacy_consent_date: new Date().toISOString()
          })
          .eq('id', userId);
      }

      return {
        id: data.id,
        userId: data.user_id,
        agreementType: data.agreement_type as ConsentType.PRIVACY_POLICY | ConsentType.TERMS_OF_SERVICE,
        version: data.version,
        agreed: data.agreed,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error in recordUserAgreement:', error);
      return null;
    }
  }

  /**
   * Check if user has agreed to the latest version of privacy policy or terms of service
   * @param userId User ID
   * @param agreementType Type of agreement
   * @returns Whether user has agreed to the latest version
   */
  static async hasUserAgreedToLatestVersion(
    userId: string,
    agreementType: ConsentType.PRIVACY_POLICY | ConsentType.TERMS_OF_SERVICE
  ): Promise<boolean> {
    try {
      // Get the latest active version
      const tableName = agreementType === ConsentType.PRIVACY_POLICY 
        ? 'privacy_policy_versions' 
        : 'terms_of_service_versions';
      
      const { data: versionData, error: versionError } = await supabaseAdmin
        .from(tableName)
        .select('version')
        .eq('active', true)
        .single();

      if (versionError) {
        console.error(`Error getting latest ${agreementType} version:`, versionError);
        return false;
      }

      if (!versionData) {
        // No active version found
        return false;
      }

      // Check if user has agreed to this version
      const { data, error } = await supabaseAdmin
        .from('user_agreements')
        .select('*')
        .eq('user_id', userId)
        .eq('agreement_type', agreementType)
        .eq('version', versionData.version)
        .eq('agreed', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, user has not agreed
          return false;
        }
        console.error('Error checking user agreement:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasUserAgreedToLatestVersion:', error);
      return false;
    }
  }

  /**
   * Log a compliance-related action for audit purposes
   * @param userId User ID (optional)
   * @param actionType Type of action
   * @param actionDetails Details of the action
   * @param ipAddress User's IP address
   * @param userAgent User's browser/device information
   * @param adminId Admin user ID if action was performed by an admin
   * @returns Success status
   */
  static async logComplianceAction(
    userId: string | undefined,
    actionType: string,
    actionDetails: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    adminId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('compliance_audit_log')
        .insert({
          user_id: userId,
          action_type: actionType,
          action_details: actionDetails,
          ip_address: ipAddress,
          user_agent: userAgent,
          admin_id: adminId
        });

      if (error) {
        console.error('Error logging compliance action:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in logComplianceAction:', error);
      return false;
    }
  }

  /**
   * Map database user consent record to interface
   * @param data Database record
   * @returns Mapped UserConsent
   */
  private static mapUserConsent(data: any): UserConsent {
    return {
      id: data.id,
      userId: data.user_id,
      consentType: data.consent_type as ConsentType,
      consented: data.consented,
      consentVersion: data.consent_version,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Map database cookie consent record to interface
   * @param data Database record
   * @returns Mapped CookieConsent
   */
  private static mapCookieConsent(data: any): CookieConsent {
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      necessary: data.necessary,
      preferences: data.preferences,
      analytics: data.analytics,
      marketing: data.marketing,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Map database data deletion request record to interface
   * @param data Database record
   * @returns Mapped DataDeletionRequest
   */
  private static mapDataDeletionRequest(data: any): DataDeletionRequest {
    return {
      id: data.id,
      userId: data.user_id,
      requestType: data.request_type,
      status: data.status as RequestStatus,
      requestReason: data.request_reason,
      dataCategories: data.data_categories,
      adminNotes: data.admin_notes,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }

  /**
   * Map database data export request record to interface
   * @param data Database record
   * @returns Mapped DataExportRequest
   */
  private static mapDataExportRequest(data: any): DataExportRequest {
    return {
      id: data.id,
      userId: data.user_id,
      exportFormat: data.export_format as ExportFormat,
      status: data.status as RequestStatus,
      dataCategories: data.data_categories,
      downloadUrl: data.download_url,
      downloadExpiry: data.download_expiry ? new Date(data.download_expiry) : undefined,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }
}
