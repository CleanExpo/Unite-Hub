/**
 * ATO Verification Service
 *
 * Unified ABN/TFN verification with:
 * - ABN validation (local + ABR API + ATO API)
 * - TFN validation (local only - no public API)
 * - Batch verification
 * - Results caching
 *
 * Related to: UNI-179 [ATO] ABN/TFN Verification Service
 */

import { ABNValidator, ABNValidationResult } from '@/cli/services/validation/abn-validator';
import { TFNValidator, TFNValidationResult } from './tfnValidator';
import { createATOClient } from './ato-client';
import { createClient } from '@/lib/supabase/server';

export type VerificationType = 'abn' | 'tfn' | 'auto';

export interface VerificationRequest {
  identifier: string; // ABN or TFN
  type?: VerificationType; // Default: 'auto' (detect from format)
  workspaceId?: string; // For ATO API integration
  useCache?: boolean; // Default: true
}

export interface VerificationResult {
  type: 'abn' | 'tfn';
  isValid: boolean;
  identifier: string; // Formatted
  error?: string;

  // ABN-specific fields
  entityName?: string;
  entityType?: string;
  status?: 'active' | 'inactive' | 'cancelled';
  gstRegistered?: boolean;
  registeredDate?: string;
  abrUrl?: string;

  // Metadata
  source?: 'local' | 'abr' | 'ato'; // Which validation method was used
  cached?: boolean;
  verifiedAt: string;
}

export class VerificationService {
  private abnValidator: ABNValidator;
  private tfnValidator: TFNValidator;

  constructor() {
    this.abnValidator = new ABNValidator();
    this.tfnValidator = new TFNValidator();
  }

  /**
   * Detect identifier type from format
   */
  private detectType(identifier: string): 'abn' | 'tfn' {
    const digits = identifier.replace(/\s/g, '');

    // ABN: 11 digits
    if (/^\d{11}$/.test(digits)) {
      return 'abn';
    }

    // TFN: 8-9 digits
    if (/^\d{8,9}$/.test(digits)) {
      return 'tfn';
    }

    // Default to ABN for unknown formats
    return 'abn';
  }

  /**
   * Verify ABN (local + ABR API + optional ATO API)
   */
  private async verifyABN(
    abn: string,
    workspaceId?: string,
    useCache: boolean = true
  ): Promise<VerificationResult> {
    const now = new Date().toISOString();

    // Check cache if enabled
    if (useCache && workspaceId) {
      const cached = await this.getCachedABN(abn);
      if (cached) {
        return cached;
      }
    }

    // Try ABR API first (free, public)
    const abrResult = await this.abnValidator.validateWithABR(abn);

    if (!abrResult.isValid) {
      return {
        type: 'abn',
        isValid: false,
        identifier: abrResult.abn,
        error: abrResult.error,
        source: 'abr',
        verifiedAt: now,
      };
    }

    // If workspace provided, try ATO API for enhanced data
    if (workspaceId) {
      try {
        const atoClient = createATOClient();
        await atoClient.initialize(workspaceId);

        const atoResult = await atoClient.validateABN(abn);

        const result: VerificationResult = {
          type: 'abn',
          isValid: true,
          identifier: atoResult.abn,
          entityName: atoResult.entityName,
          entityType: atoResult.entityType,
          status: atoResult.status,
          gstRegistered: atoResult.gstRegistered,
          registeredDate: atoResult.registeredDate,
          abrUrl: this.abnValidator.getABRUrl(abn),
          source: 'ato',
          verifiedAt: now,
        };

        // Cache result
        if (useCache) {
          await this.cacheABN(result);
        }

        return result;
      } catch (error) {
        console.error('ATO API verification failed, falling back to ABR:', error);
        // Fall through to use ABR result
      }
    }

    // Use ABR result
    const result: VerificationResult = {
      type: 'abn',
      isValid: true,
      identifier: abrResult.abn,
      entityName: abrResult.entityName,
      status: abrResult.status,
      gstRegistered: abrResult.gstRegistered,
      registeredDate: abrResult.registeredDate,
      abrUrl: this.abnValidator.getABRUrl(abn),
      source: 'abr',
      verifiedAt: now,
    };

    // Cache result
    if (useCache && workspaceId) {
      await this.cacheABN(result);
    }

    return result;
  }

  /**
   * Verify TFN (local only)
   */
  private async verifyTFN(tfn: string): Promise<VerificationResult> {
    const now = new Date().toISOString();
    const result = await this.tfnValidator.validate(tfn);

    return {
      type: 'tfn',
      isValid: result.isValid,
      identifier: result.tfn,
      error: result.error,
      source: 'local',
      verifiedAt: now,
    };
  }

  /**
   * Unified verification endpoint
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const { identifier, type = 'auto', workspaceId, useCache = true } = request;

    // Detect type if auto
    const actualType = type === 'auto' ? this.detectType(identifier) : type;

    // Route to appropriate validator
    if (actualType === 'abn') {
      return this.verifyABN(identifier, workspaceId, useCache);
    } else {
      return this.verifyTFN(identifier);
    }
  }

  /**
   * Batch verification
   */
  async verifyBatch(requests: VerificationRequest[]): Promise<VerificationResult[]> {
    return Promise.all(requests.map(req => this.verify(req)));
  }

  /**
   * Get cached ABN result
   */
  private async getCachedABN(abn: string): Promise<VerificationResult | null> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('abn_lookups')
      .select('*')
      .eq('abn', abn.replace(/\s/g, ''))
      .single();

    if (!data) {
      return null;
    }

    // Check if cache is stale (> 7 days)
    const lastVerified = new Date(data.last_verified_at);
    const daysSinceVerification =
      (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceVerification > 7) {
      return null; // Cache stale
    }

    return {
      type: 'abn',
      isValid: true,
      identifier: this.abnValidator.formatABN(data.abn),
      entityName: data.entity_name,
      entityType: data.entity_type,
      status: data.status as 'active' | 'inactive' | 'cancelled',
      gstRegistered: data.gst_registered,
      registeredDate: data.registered_date,
      abrUrl: this.abnValidator.getABRUrl(data.abn),
      source: data.verified_source === 'ATO_API' ? 'ato' : 'abr',
      cached: true,
      verifiedAt: data.last_verified_at,
    };
  }

  /**
   * Cache ABN result
   */
  private async cacheABN(result: VerificationResult): Promise<void> {
    const supabase = await createClient();

    await supabase.from('abn_lookups').upsert(
      {
        abn: result.identifier.replace(/\s/g, ''),
        entity_name: result.entityName,
        entity_type: result.entityType,
        status: result.status,
        gst_registered: result.gstRegistered,
        registered_date: result.registeredDate,
        last_verified_at: result.verifiedAt,
        verified_source: result.source === 'ato' ? 'ATO_API' : 'ABR_API',
        verification_response: result,
      },
      { onConflict: 'abn' }
    );
  }

  /**
   * Get verification statistics
   */
  async getStats(workspaceId?: string): Promise<{
    totalVerifications: number;
    abnVerifications: number;
    tfnVerifications: number;
    cacheHitRate: number;
  }> {
    const supabase = await createClient();

    // Get total ABN lookups
    const { count: abnCount } = await supabase
      .from('abn_lookups')
      .select('*', { count: 'exact', head: true });

    // In a real implementation, you'd track TFN and cache stats in a separate table
    // For now, return ABN stats
    return {
      totalVerifications: abnCount || 0,
      abnVerifications: abnCount || 0,
      tfnVerifications: 0,
      cacheHitRate: 0, // Would need tracking table to calculate this
    };
  }
}

// Singleton instance
export const verificationService = new VerificationService();
