/**
 * Founder Signal Inference Service
 *
 * Aggregates signals from multiple sources into founder_business_signals table.
 * Cross-references with existing SEO tables and other data sources.
 *
 * @module founderOS/founderSignalInferenceService
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type SignalFamily =
  | 'seo'
  | 'content'
  | 'backlinks'
  | 'social'
  | 'ads'
  | 'engagement'
  | 'revenue'
  | 'users'
  | 'performance'
  | 'marketing'
  | 'support'
  | 'infrastructure'
  | 'custom';

export interface BusinessSignal {
  id: string;
  founder_business_id: string;
  signal_family: SignalFamily;
  signal_key: string;
  value_numeric: number | null;
  value_text: string | null;
  payload: Record<string, unknown>;
  source: string;
  observed_at: string;
}

export interface RecordSignalInput {
  family: SignalFamily;
  key: string;
  valueNumeric?: number;
  valueText?: string;
  payload?: Record<string, unknown>;
  source: string;
  observedAt?: string;
}

export interface SignalServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AggregationResult {
  signalsCreated: number;
  signalsUpdated: number;
  sources: string[];
  errors: string[];
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Record a new signal for a business
 *
 * @param businessId - UUID of the founder business
 * @param family - Signal family/category
 * @param key - Signal key identifier
 * @param value - Numeric or text value
 * @param source - Source of the signal
 * @param payload - Additional payload data
 * @returns Created signal
 */
export async function recordSignal(
  businessId: string,
  family: SignalFamily,
  key: string,
  value: number | string,
  source: string,
  payload?: Record<string, unknown>
): Promise<SignalServiceResult<BusinessSignal>> {
  try {
    const supabase = supabaseAdmin;

    const isNumeric = typeof value === 'number';

    const { data: signal, error } = await supabase
      .from('founder_business_signals')
      .insert({
        founder_business_id: businessId,
        signal_family: family,
        signal_key: key,
        value_numeric: isNumeric ? value : null,
        value_text: isNumeric ? null : String(value),
        payload: payload || {},
        source: source,
        observed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[SignalInference] Record signal error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: signal as BusinessSignal,
    };
  } catch (err) {
    console.error('[SignalInference] Record signal exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error recording signal',
    };
  }
}

/**
 * Record multiple signals at once
 *
 * @param businessId - UUID of the founder business
 * @param signals - Array of signal inputs
 * @returns Array of created signals
 */
export async function recordSignals(
  businessId: string,
  signals: RecordSignalInput[]
): Promise<SignalServiceResult<BusinessSignal[]>> {
  try {
    const supabase = supabaseAdmin;

    const signalRecords = signals.map((s) => {
      const isNumeric = s.valueNumeric !== undefined;
      return {
        founder_business_id: businessId,
        signal_family: s.family,
        signal_key: s.key,
        value_numeric: isNumeric ? s.valueNumeric : null,
        value_text: s.valueText || null,
        payload: s.payload || {},
        source: s.source,
        observed_at: s.observedAt || new Date().toISOString(),
      };
    });

    const { data: createdSignals, error } = await supabase
      .from('founder_business_signals')
      .insert(signalRecords)
      .select();

    if (error) {
      console.error('[SignalInference] Record signals error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (createdSignals || []) as BusinessSignal[],
    };
  } catch (err) {
    console.error('[SignalInference] Record signals exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error recording signals',
    };
  }
}

/**
 * Get signals for a business
 *
 * @param businessId - UUID of the founder business
 * @param signalFamily - Optional filter by signal family
 * @param limit - Maximum number of signals to return
 * @param since - Optional date filter (ISO string)
 * @returns List of signals
 */
export async function getSignals(
  businessId: string,
  signalFamily?: SignalFamily,
  limit = 100,
  since?: string
): Promise<SignalServiceResult<BusinessSignal[]>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('founder_business_signals')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('observed_at', { ascending: false })
      .limit(limit);

    if (signalFamily) {
      query = query.eq('signal_family', signalFamily);
    }

    if (since) {
      query = query.gte('observed_at', since);
    }

    const { data: signals, error } = await query;

    if (error) {
      console.error('[SignalInference] Get signals error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (signals || []) as BusinessSignal[],
    };
  } catch (err) {
    console.error('[SignalInference] Get signals exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching signals',
    };
  }
}

/**
 * Get latest signal value for a specific key
 *
 * @param businessId - UUID of the founder business
 * @param family - Signal family
 * @param key - Signal key
 * @returns Latest signal or null
 */
export async function getLatestSignal(
  businessId: string,
  family: SignalFamily,
  key: string
): Promise<SignalServiceResult<BusinessSignal | null>> {
  try {
    const supabase = supabaseAdmin;

    const { data: signals, error } = await supabase
      .from('founder_business_signals')
      .select('*')
      .eq('founder_business_id', businessId)
      .eq('signal_family', family)
      .eq('signal_key', key)
      .order('observed_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[SignalInference] Get latest signal error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: signals && signals.length > 0 ? (signals[0] as BusinessSignal) : null,
    };
  } catch (err) {
    console.error('[SignalInference] Get latest signal exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching latest signal',
    };
  }
}

/**
 * Get signal history (time series) for a specific key
 *
 * @param businessId - UUID of the founder business
 * @param family - Signal family
 * @param key - Signal key
 * @param limit - Number of data points
 * @returns Signal history
 */
export async function getSignalHistory(
  businessId: string,
  family: SignalFamily,
  key: string,
  limit = 30
): Promise<SignalServiceResult<BusinessSignal[]>> {
  try {
    const supabase = supabaseAdmin;

    const { data: signals, error } = await supabase
      .from('founder_business_signals')
      .select('*')
      .eq('founder_business_id', businessId)
      .eq('signal_family', family)
      .eq('signal_key', key)
      .order('observed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[SignalInference] Get signal history error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (signals || []) as BusinessSignal[],
    };
  } catch (err) {
    console.error('[SignalInference] Get signal history exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching signal history',
    };
  }
}

/**
 * Aggregate signals from various sources for a business
 * Pulls data from SEO audit results, content tables, competitor data, etc.
 *
 * @param businessId - UUID of the founder business
 * @returns Aggregation result with counts
 */
export async function aggregateSignals(
  businessId: string
): Promise<SignalServiceResult<AggregationResult>> {
  const result: AggregationResult = {
    signalsCreated: 0,
    signalsUpdated: 0,
    sources: [],
    errors: [],
  };

  const supabase = supabaseAdmin;

  try {
    // Get business info for domain lookup
    const { data: business } = await supabase
      .from('founder_businesses')
      .select('primary_domain, owner_user_id')
      .eq('id', businessId)
      .single();

    if (!business) {
      return {
        success: false,
        error: 'Business not found',
      };
    }

    const signalsToRecord: RecordSignalInput[] = [];

    // =========================================================================
    // 1. Aggregate SEO Audit Results
    // =========================================================================
    try {
      const { data: seoAudits } = await supabase
        .from('seo_audit_results')
        .select('*')
        .eq('url', business.primary_domain)
        .order('created_at', { ascending: false })
        .limit(1);

      if (seoAudits && seoAudits.length > 0) {
        const audit = seoAudits[0];
        result.sources.push('seo_audit_results');

        if (audit.scores) {
          signalsToRecord.push({
            family: 'seo',
            key: 'overall_score',
            valueNumeric: audit.scores.overall || 0,
            source: 'seo_audit',
            payload: { audit_id: audit.id },
          });

          signalsToRecord.push({
            family: 'seo',
            key: 'technical_score',
            valueNumeric: audit.scores.technical || 0,
            source: 'seo_audit',
          });

          signalsToRecord.push({
            family: 'seo',
            key: 'content_score',
            valueNumeric: audit.scores.content || 0,
            source: 'seo_audit',
          });

          signalsToRecord.push({
            family: 'seo',
            key: 'mobile_score',
            valueNumeric: audit.scores.mobile || 0,
            source: 'seo_audit',
          });
        }
      }
    } catch (e) {
      result.errors.push(`SEO audit aggregation: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    // =========================================================================
    // 2. Aggregate CTR Benchmarks
    // =========================================================================
    try {
      const { data: ctrBenchmarks } = await supabase
        .from('ctr_benchmarks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (ctrBenchmarks && ctrBenchmarks.length > 0) {
        result.sources.push('ctr_benchmarks');

        const avgCtr =
          ctrBenchmarks.reduce((sum, b) => sum + (b.actual_ctr || 0), 0) / ctrBenchmarks.length;

        signalsToRecord.push({
          family: 'seo',
          key: 'average_ctr',
          valueNumeric: avgCtr,
          source: 'ctr_benchmarks',
          payload: { sample_size: ctrBenchmarks.length },
        });
      }
    } catch (e) {
      result.errors.push(`CTR aggregation: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    // =========================================================================
    // 3. Aggregate Competitor Gap Analysis
    // =========================================================================
    try {
      const { data: competitorGaps } = await supabase
        .from('competitor_gaps')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (competitorGaps && competitorGaps.length > 0) {
        const gap = competitorGaps[0];
        result.sources.push('competitor_gaps');

        if (gap.keyword_gaps) {
          signalsToRecord.push({
            family: 'seo',
            key: 'keyword_gap_count',
            valueNumeric: Array.isArray(gap.keyword_gaps) ? gap.keyword_gaps.length : 0,
            source: 'competitor_analysis',
          });
        }

        if (gap.content_gaps) {
          signalsToRecord.push({
            family: 'content',
            key: 'content_gap_count',
            valueNumeric: Array.isArray(gap.content_gaps) ? gap.content_gaps.length : 0,
            source: 'competitor_analysis',
          });
        }

        if (gap.backlink_gaps) {
          signalsToRecord.push({
            family: 'backlinks',
            key: 'backlink_gap_count',
            valueNumeric: Array.isArray(gap.backlink_gaps) ? gap.backlink_gaps.length : 0,
            source: 'competitor_analysis',
          });
        }
      }
    } catch (e) {
      result.errors.push(`Competitor gap aggregation: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    // =========================================================================
    // 4. Aggregate Content Optimization Results
    // =========================================================================
    try {
      const { data: contentOptimizations } = await supabase
        .from('content_optimization_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (contentOptimizations && contentOptimizations.length > 0) {
        result.sources.push('content_optimization_results');

        const avgReadability =
          contentOptimizations.reduce((sum, c) => sum + (c.readability_score || 0), 0) /
          contentOptimizations.length;

        signalsToRecord.push({
          family: 'content',
          key: 'average_readability',
          valueNumeric: avgReadability,
          source: 'content_optimization',
          payload: { sample_size: contentOptimizations.length },
        });

        const avgSeoScore =
          contentOptimizations.reduce((sum, c) => sum + (c.seo_score || 0), 0) /
          contentOptimizations.length;

        signalsToRecord.push({
          family: 'content',
          key: 'average_seo_score',
          valueNumeric: avgSeoScore,
          source: 'content_optimization',
        });
      }
    } catch (e) {
      result.errors.push(`Content optimization aggregation: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    // =========================================================================
    // 5. Aggregate Contact/Lead Metrics (if linked to CRM)
    // =========================================================================
    try {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('ai_score, status')
        .limit(1000);

      if (contacts && contacts.length > 0) {
        result.sources.push('contacts');

        const hotLeads = contacts.filter((c) => c.ai_score >= 80).length;
        const warmLeads = contacts.filter((c) => c.ai_score >= 60 && c.ai_score < 80).length;
        const avgScore = contacts.reduce((sum, c) => sum + (c.ai_score || 0), 0) / contacts.length;

        signalsToRecord.push({
          family: 'engagement',
          key: 'total_contacts',
          valueNumeric: contacts.length,
          source: 'crm',
        });

        signalsToRecord.push({
          family: 'engagement',
          key: 'hot_leads',
          valueNumeric: hotLeads,
          source: 'crm',
        });

        signalsToRecord.push({
          family: 'engagement',
          key: 'warm_leads',
          valueNumeric: warmLeads,
          source: 'crm',
        });

        signalsToRecord.push({
          family: 'engagement',
          key: 'average_lead_score',
          valueNumeric: avgScore,
          source: 'crm',
        });
      }
    } catch (e) {
      result.errors.push(`Contact aggregation: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    // =========================================================================
    // 6. Aggregate Campaign Performance
    // =========================================================================
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('sent_count, opened_count, clicked_count, replied_count, status')
        .eq('status', 'completed')
        .limit(50);

      if (campaigns && campaigns.length > 0) {
        result.sources.push('campaigns');

        const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
        const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
        const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);
        const totalReplied = campaigns.reduce((sum, c) => sum + (c.replied_count || 0), 0);

        signalsToRecord.push({
          family: 'marketing',
          key: 'total_emails_sent',
          valueNumeric: totalSent,
          source: 'campaigns',
        });

        if (totalSent > 0) {
          signalsToRecord.push({
            family: 'marketing',
            key: 'overall_open_rate',
            valueNumeric: (totalOpened / totalSent) * 100,
            source: 'campaigns',
          });

          signalsToRecord.push({
            family: 'marketing',
            key: 'overall_click_rate',
            valueNumeric: (totalClicked / totalSent) * 100,
            source: 'campaigns',
          });

          signalsToRecord.push({
            family: 'marketing',
            key: 'overall_reply_rate',
            valueNumeric: (totalReplied / totalSent) * 100,
            source: 'campaigns',
          });
        }
      }
    } catch (e) {
      result.errors.push(`Campaign aggregation: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    // =========================================================================
    // Record All Aggregated Signals
    // =========================================================================
    if (signalsToRecord.length > 0) {
      const recordResult = await recordSignals(businessId, signalsToRecord);
      if (recordResult.success && recordResult.data) {
        result.signalsCreated = recordResult.data.length;
      } else if (!recordResult.success) {
        result.errors.push(`Recording signals: ${recordResult.error}`);
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    console.error('[SignalInference] Aggregate signals exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error aggregating signals',
    };
  }
}

/**
 * Get signal summary by family
 *
 * @param businessId - UUID of the founder business
 * @returns Summary of signals grouped by family
 */
export async function getSignalSummary(
  businessId: string
): Promise<SignalServiceResult<Record<string, { count: number; latestAt: string }>>> {
  try {
    const supabase = supabaseAdmin;

    const { data: signals, error } = await supabase
      .from('founder_business_signals')
      .select('signal_family, observed_at')
      .eq('founder_business_id', businessId)
      .order('observed_at', { ascending: false });

    if (error) {
      console.error('[SignalInference] Get signal summary error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    const summary: Record<string, { count: number; latestAt: string }> = {};

    for (const signal of signals || []) {
      const family = signal.signal_family;
      if (!summary[family]) {
        summary[family] = {
          count: 0,
          latestAt: signal.observed_at,
        };
      }
      summary[family].count++;
    }

    return {
      success: true,
      data: summary,
    };
  } catch (err) {
    console.error('[SignalInference] Get signal summary exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching signal summary',
    };
  }
}

/**
 * Delete old signals (cleanup)
 *
 * @param businessId - UUID of the founder business
 * @param olderThan - ISO date string - signals older than this will be deleted
 * @returns Number of deleted signals
 */
export async function cleanupOldSignals(
  businessId: string,
  olderThan: string
): Promise<SignalServiceResult<number>> {
  try {
    const supabase = supabaseAdmin;

    // Count first
    const { count, error: countError } = await supabase
      .from('founder_business_signals')
      .select('id', { count: 'exact', head: true })
      .eq('founder_business_id', businessId)
      .lt('observed_at', olderThan);

    if (countError) {
      return {
        success: false,
        error: countError.message,
      };
    }

    // Delete
    const { error } = await supabase
      .from('founder_business_signals')
      .delete()
      .eq('founder_business_id', businessId)
      .lt('observed_at', olderThan);

    if (error) {
      console.error('[SignalInference] Cleanup old signals error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: count || 0,
    };
  } catch (err) {
    console.error('[SignalInference] Cleanup old signals exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error cleaning up signals',
    };
  }
}
