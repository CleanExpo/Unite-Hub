/**
 * Business Validation Service
 *
 * Unified service for validating business identifiers:
 * - ABN (Australia)
 * - NZBN (New Zealand)
 *
 * Features:
 * - 24-hour caching
 * - Automatic cache expiry
 * - Database persistence
 */

import { createClient } from '@supabase/supabase-js';
import { abnValidator, type ABNValidationResult } from './abn-validator.js';
import { nzbnValidator, type NZBNValidationResult } from './nzbn-validator.js';

export interface BusinessValidationResult {
  isValid: boolean;
  country: 'AU' | 'NZ';
  businessId: string;
  formattedId: string;
  entityName?: string;
  status?: 'active' | 'inactive' | 'cancelled';
  gstRegistered?: boolean;
  registeredDate?: string;
  validationSource: 'ABR' | 'NZBN' | 'local' | 'cache';
  recordUrl?: string;
  cached: boolean;
  cacheExpiry?: Date;
  error?: string;
}

export interface CachedValidation {
  country: string;
  business_id: string;
  entity_name: string | null;
  status: string | null;
  gst_registered: boolean | null;
  registered_date: string | null;
  validation_source: string;
  cached_at: string;
  expires_at: string;
  raw_response: any;
}

export class BusinessValidator {
  private supabase: any;

  constructor() {
    // Initialize Supabase client if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Validate business ID (AU or NZ)
   */
  async validate(
    country: 'AU' | 'NZ',
    businessId: string,
    options: {
      useCache?: boolean;
      strict?: boolean; // If true, uses API validation; if false, uses local only
    } = {}
  ): Promise<BusinessValidationResult> {
    const { useCache = true, strict = true } = options;

    // Check cache first if enabled
    if (useCache && this.supabase) {
      const cached = await this.getCached(country, businessId);
      if (cached) {
        return cached;
      }
    }

    // Perform validation based on country
    let result: BusinessValidationResult;

    if (country === 'AU') {
      result = await this.validateABN(businessId, strict);
    } else if (country === 'NZ') {
      result = await this.validateNZBN(businessId, strict);
    } else {
      throw new Error(`Unsupported country: ${country}`);
    }

    // Cache result if valid and caching enabled
    if (result.isValid && this.supabase) {
      await this.cacheResult(result);
    }

    return result;
  }

  /**
   * Validate Australian Business Number
   */
  private async validateABN(abn: string, strict: boolean): Promise<BusinessValidationResult> {
    const abnResult: ABNValidationResult = strict
      ? await abnValidator.validateWithABR(abn)
      : await abnValidator.validateLocal(abn);

    const result: BusinessValidationResult = {
      isValid: abnResult.isValid,
      country: 'AU',
      businessId: abn.replace(/\s/g, ''),
      formattedId: abnResult.abn,
      entityName: abnResult.entityName,
      status: abnResult.status,
      gstRegistered: abnResult.gstRegistered,
      registeredDate: abnResult.registeredDate,
      validationSource: strict && abnResult.entityName ? 'ABR' : 'local',
      recordUrl: abnValidator.getABRUrl(abn),
      cached: false,
      error: abnResult.error,
    };

    return result;
  }

  /**
   * Validate New Zealand Business Number
   */
  private async validateNZBN(nzbn: string, strict: boolean): Promise<BusinessValidationResult> {
    const nzbnResult: NZBNValidationResult = strict
      ? await nzbnValidator.validateWithAPI(nzbn)
      : await nzbnValidator.validateLocal(nzbn);

    const companyUrl = nzbnResult.companyNumber
      ? nzbnValidator.getCompaniesOfficeUrl(nzbnResult.companyNumber)
      : nzbnValidator.getCompaniesOfficeUrl();

    const result: BusinessValidationResult = {
      isValid: nzbnResult.isValid,
      country: 'NZ',
      businessId: nzbn.replace(/\s/g, ''),
      formattedId: nzbnValidator.formatNZBN(nzbn),
      entityName: nzbnResult.entityName,
      status: nzbnResult.status,
      gstRegistered: nzbnResult.gstRegistered,
      registeredDate: nzbnResult.registeredDate,
      validationSource: strict && nzbnResult.entityName ? 'NZBN' : 'local',
      recordUrl: companyUrl,
      cached: false,
      error: nzbnResult.error,
    };

    return result;
  }

  /**
   * Get cached validation result
   */
  private async getCached(
    country: 'AU' | 'NZ',
    businessId: string
  ): Promise<BusinessValidationResult | null> {
    if (!this.supabase) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('business_validations')
        .select('*')
        .eq('country', country)
        .eq('business_id', businessId.replace(/\s/g, ''))
        .single();

      if (error || !data) {
        return null;
      }

      const cached = data as CachedValidation;

      // Check if expired
      const expiresAt = new Date(cached.expires_at);
      if (expiresAt < new Date()) {
        // Expired - delete and return null
        await this.supabase
          .from('business_validations')
          .delete()
          .eq('country', country)
          .eq('business_id', businessId.replace(/\s/g, ''));

        return null;
      }

      // Return cached result
      return {
        isValid: true,
        country: country,
        businessId: cached.business_id,
        formattedId:
          country === 'AU'
            ? abnValidator.formatABN(cached.business_id)
            : nzbnValidator.formatNZBN(cached.business_id),
        entityName: cached.entity_name || undefined,
        status: (cached.status as 'active' | 'inactive' | 'cancelled') || undefined,
        gstRegistered: cached.gst_registered || undefined,
        registeredDate: cached.registered_date || undefined,
        validationSource: 'cache',
        recordUrl:
          country === 'AU'
            ? abnValidator.getABRUrl(cached.business_id)
            : nzbnValidator.getCompaniesOfficeUrl(),
        cached: true,
        cacheExpiry: expiresAt,
      };
    } catch (error) {
      // Cache read failed - continue with fresh validation
      return null;
    }
  }

  /**
   * Cache validation result
   */
  private async cacheResult(result: BusinessValidationResult): Promise<void> {
    if (!this.supabase || !result.isValid) {
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.supabase.from('business_validations').upsert(
        {
          country: result.country,
          business_id: result.businessId,
          entity_name: result.entityName || null,
          status: result.status || null,
          gst_registered: result.gstRegistered || null,
          registered_date: result.registeredDate || null,
          validation_source: result.validationSource,
          cached_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          raw_response: result,
        },
        {
          onConflict: 'country,business_id',
        }
      );
    } catch (error) {
      // Cache write failed - not critical
      console.error('Failed to cache validation result:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    if (!this.supabase) {
      return 0;
    }

    try {
      const { data, error } = await this.supabase
        .from('business_validations')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    byCountry: Record<string, number>;
  }> {
    if (!this.supabase) {
      return { total: 0, active: 0, expired: 0, byCountry: {} };
    }

    try {
      const { data: all } = await this.supabase.from('business_validations').select('country,expires_at');

      if (!all) {
        return { total: 0, active: 0, expired: 0, byCountry: {} };
      }

      const now = new Date();
      const active = all.filter((r: any) => new Date(r.expires_at) >= now);
      const expired = all.filter((r: any) => new Date(r.expires_at) < now);

      const byCountry: Record<string, number> = {};
      active.forEach((r: any) => {
        byCountry[r.country] = (byCountry[r.country] || 0) + 1;
      });

      return {
        total: all.length,
        active: active.length,
        expired: expired.length,
        byCountry,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { total: 0, active: 0, expired: 0, byCountry: {} };
    }
  }
}

// Singleton instance
export const businessValidator = new BusinessValidator();
