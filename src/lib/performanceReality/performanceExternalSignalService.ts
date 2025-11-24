/**
 * Performance External Signal Service
 * Phase 81: Manages external context (holidays, weather, industry events)
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ExternalSignal,
  ExternalContext,
  ImpactHint,
} from './performanceRealityTypes';

/**
 * Get external signals for a given timeframe and region
 */
export async function getExternalSignals(
  startDate: Date,
  endDate: Date,
  region?: string
): Promise<ExternalSignal[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('performance_external_signals')
    .select('*')
    .gte('start_date', startDate.toISOString())
    .lte('end_date', endDate.toISOString())
    .eq('is_active', true);

  if (region) {
    query = query.or(`region.is.null,region.eq.${region}`);
  }

  const { data, error } = await query.order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching external signals:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    signal_type: row.signal_type,
    name: row.name,
    description: row.description,
    start_date: row.start_date,
    end_date: row.end_date,
    region: row.region,
    impact_hint: row.impact_hint as ImpactHint,
    source: row.source,
    metadata: row.metadata,
    is_active: row.is_active,
  }));
}

/**
 * Get external context summary for display
 */
export async function getExternalContext(
  startDate: Date,
  endDate: Date,
  region?: string
): Promise<ExternalContext> {
  const signals = await getExternalSignals(startDate, endDate, region);

  // Summarize by type
  const signalSummaries = signals.map(signal => ({
    type: signal.signal_type,
    name: signal.name,
    impact: signal.impact_hint.expected_effect,
    magnitude: signal.impact_hint.magnitude,
    dates: `${new Date(signal.start_date).toLocaleDateString()} - ${new Date(signal.end_date).toLocaleDateString()}`,
  }));

  // Calculate overall impact
  let totalMagnitude = 0;
  let positiveCount = 0;
  let negativeCount = 0;

  for (const signal of signals) {
    const mag = signal.impact_hint.magnitude || 0.1;
    totalMagnitude += mag;

    if (signal.impact_hint.expected_effect === 'higher_engagement') {
      positiveCount++;
    } else if (signal.impact_hint.expected_effect === 'lower_engagement') {
      negativeCount++;
    }
  }

  let overallImpact: 'positive' | 'negative' | 'mixed' | 'neutral' = 'neutral';
  if (positiveCount > negativeCount && positiveCount > 0) {
    overallImpact = 'positive';
  } else if (negativeCount > positiveCount && negativeCount > 0) {
    overallImpact = 'negative';
  } else if (positiveCount > 0 && negativeCount > 0) {
    overallImpact = 'mixed';
  }

  return {
    signals: signalSummaries,
    overall_impact: overallImpact,
    total_signals: signals.length,
    total_magnitude: Math.round(totalMagnitude * 100) / 100,
  };
}

/**
 * Create a new external signal
 */
export async function createExternalSignal(
  signal: Omit<ExternalSignal, 'id' | 'is_active'>
): Promise<ExternalSignal | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('performance_external_signals')
    .insert({
      signal_type: signal.signal_type,
      name: signal.name,
      description: signal.description,
      start_date: signal.start_date,
      end_date: signal.end_date,
      region: signal.region,
      impact_hint: signal.impact_hint,
      source: signal.source,
      metadata: signal.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating external signal:', error);
    return null;
  }

  return data as ExternalSignal;
}

/**
 * Seed common holidays for a region
 */
export async function seedHolidaysForRegion(
  year: number,
  region: string
): Promise<number> {
  const holidays = getHolidaysForRegion(year, region);
  const supabase = await getSupabaseServer();

  let inserted = 0;

  for (const holiday of holidays) {
    const { error } = await supabase
      .from('performance_external_signals')
      .upsert({
        signal_type: 'holiday',
        name: holiday.name,
        description: holiday.description,
        start_date: holiday.date,
        end_date: holiday.date,
        region: region,
        impact_hint: holiday.impact_hint,
        source: 'system_seed',
        metadata: { year },
      }, {
        onConflict: 'name,start_date,region',
        ignoreDuplicates: true,
      });

    if (!error) {
      inserted++;
    }
  }

  return inserted;
}

/**
 * Get holidays for a specific region
 */
function getHolidaysForRegion(
  year: number,
  region: string
): Array<{
  name: string;
  description: string;
  date: string;
  impact_hint: ImpactHint;
}> {
  const holidays: Array<{
    name: string;
    description: string;
    date: string;
    impact_hint: ImpactHint;
  }> = [];

  if (region === 'AU' || region === 'Australia') {
    holidays.push(
      {
        name: "New Year's Day",
        description: 'Public holiday, low engagement expected',
        date: `${year}-01-01`,
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.4,
          reasoning: 'Public holiday - most people not checking emails',
        },
      },
      {
        name: 'Australia Day',
        description: 'National holiday',
        date: `${year}-01-26`,
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.3,
          reasoning: 'Public holiday',
        },
      },
      {
        name: 'Good Friday',
        description: 'Easter public holiday',
        date: `${year}-03-29`, // Approximate - varies by year
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.5,
          reasoning: 'Long weekend start',
        },
      },
      {
        name: 'ANZAC Day',
        description: 'Remembrance day',
        date: `${year}-04-25`,
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.3,
          reasoning: 'National day of remembrance',
        },
      },
      {
        name: 'Christmas Day',
        description: 'Major holiday',
        date: `${year}-12-25`,
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.6,
          reasoning: 'Major holiday - very low business activity',
        },
      },
      {
        name: 'Boxing Day',
        description: 'Public holiday, high retail activity',
        date: `${year}-12-26`,
        impact_hint: {
          expected_effect: 'mixed',
          magnitude: 0.3,
          reasoning: 'Holiday but high retail engagement',
        },
      }
    );
  } else if (region === 'US' || region === 'United States') {
    holidays.push(
      {
        name: "New Year's Day",
        description: 'Public holiday',
        date: `${year}-01-01`,
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.4,
          reasoning: 'Public holiday',
        },
      },
      {
        name: 'Independence Day',
        description: 'National holiday',
        date: `${year}-07-04`,
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.4,
          reasoning: 'Major national holiday',
        },
      },
      {
        name: 'Thanksgiving',
        description: 'Major holiday, start of shopping season',
        date: `${year}-11-28`, // Approximate
        impact_hint: {
          expected_effect: 'mixed',
          magnitude: 0.4,
          reasoning: 'Holiday but leads into Black Friday',
        },
      },
      {
        name: 'Black Friday',
        description: 'Major shopping day',
        date: `${year}-11-29`, // Day after Thanksgiving
        impact_hint: {
          expected_effect: 'higher_engagement',
          magnitude: 0.5,
          reasoning: 'Peak retail engagement day',
        },
      },
      {
        name: 'Christmas Day',
        description: 'Major holiday',
        date: `${year}-12-25`,
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.6,
          reasoning: 'Major holiday',
        },
      }
    );
  }

  // Common to all regions
  holidays.push(
    {
      name: 'End of Financial Year',
      description: 'Fiscal year end - high B2B activity',
      date: region === 'AU' ? `${year}-06-30` : `${year}-12-31`,
      impact_hint: {
        expected_effect: 'higher_engagement',
        magnitude: 0.3,
        reasoning: 'Budget deadlines drive decisions',
      },
    }
  );

  return holidays;
}

/**
 * Check if a date falls within any external signal
 */
export async function checkDateForSignals(
  date: Date,
  region?: string
): Promise<ExternalSignal[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('performance_external_signals')
    .select('*')
    .lte('start_date', date.toISOString())
    .gte('end_date', date.toISOString())
    .eq('is_active', true);

  if (region) {
    query = query.or(`region.is.null,region.eq.${region}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking date for signals:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    signal_type: row.signal_type,
    name: row.name,
    description: row.description,
    start_date: row.start_date,
    end_date: row.end_date,
    region: row.region,
    impact_hint: row.impact_hint as ImpactHint,
    source: row.source,
    metadata: row.metadata,
    is_active: row.is_active,
  }));
}

/**
 * Generate demo external signals for testing
 */
export function generateDemoExternalSignals(): ExternalSignal[] {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'demo-1',
      signal_type: 'holiday',
      name: 'Public Holiday',
      description: 'Regional public holiday affecting engagement',
      start_date: weekAgo.toISOString(),
      end_date: weekAgo.toISOString(),
      region: 'AU',
      impact_hint: {
        expected_effect: 'lower_engagement',
        magnitude: 0.3,
        reasoning: 'Public holiday reduces email opens',
      },
      source: 'demo',
      metadata: {},
      is_active: true,
    },
    {
      id: 'demo-2',
      signal_type: 'industry_event',
      name: 'Industry Conference',
      description: 'Major industry conference driving engagement',
      start_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      region: null,
      impact_hint: {
        expected_effect: 'higher_engagement',
        magnitude: 0.2,
        reasoning: 'Conference attendees actively seeking solutions',
      },
      source: 'demo',
      metadata: { conference: 'Marketing Summit 2024' },
      is_active: true,
    },
  ];
}
