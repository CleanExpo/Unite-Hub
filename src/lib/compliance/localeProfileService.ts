/**
 * Locale Profile Service
 * Phase 93: Load locale profiles for content adaptation
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { LocaleProfile } from './complianceTypes';

/**
 * Get locale profile for a specific region and locale
 */
export async function getLocaleProfile(
  regionSlug: string,
  localeCode?: string
): Promise<LocaleProfile | null> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('locale_profiles')
    .select('*')
    .eq('region_slug', regionSlug);

  if (localeCode) {
    query = query.eq('locale_code', localeCode);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) {
    return null;
  }

  return mapLocaleFromDb(data);
}

/**
 * Get default locale for a region
 */
export async function getDefaultLocaleForRegion(
  regionSlug: string
): Promise<LocaleProfile | null> {
  return getLocaleProfile(regionSlug);
}

/**
 * List all available locales
 */
export async function listAllLocales(): Promise<LocaleProfile[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('locale_profiles')
    .select('*')
    .order('region_slug');

  if (error || !data) {
    return [];
  }

  return data.map(mapLocaleFromDb);
}

/**
 * Get locales for a specific region
 */
export async function getLocalesForRegion(
  regionSlug: string
): Promise<LocaleProfile[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('locale_profiles')
    .select('*')
    .eq('region_slug', regionSlug);

  if (error || !data) {
    return [];
  }

  return data.map(mapLocaleFromDb);
}

/**
 * Check if a date is near a sensitive holiday
 */
export function checkUpcomingHolidays(
  locale: LocaleProfile,
  daysAhead: number = 7
): LocaleProfile['holidayCalendar'] {
  const now = new Date();
  const upcoming: LocaleProfile['holidayCalendar'] = [];

  for (const holiday of locale.holidayCalendar) {
    // Simple check for MM-DD format holidays
    if (holiday.date.match(/^\d{2}-\d{2}$/)) {
      const [month, day] = holiday.date.split('-').map(Number);
      const holidayDate = new Date(now.getFullYear(), month - 1, day);

      // If holiday passed this year, check next year
      if (holidayDate < now) {
        holidayDate.setFullYear(holidayDate.getFullYear() + 1);
      }

      const daysUntil = Math.ceil(
        (holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= daysAhead) {
        upcoming.push(holiday);
      }
    }
  }

  return upcoming;
}

/**
 * Get spelling differences between variants
 */
export function getSpellingDifferences(
  fromVariant: string,
  toVariant: string
): Record<string, string> {
  // Common AU/UK vs US spelling differences
  const ausToUs: Record<string, string> = {
    colour: 'color',
    favour: 'favor',
    labour: 'labor',
    honour: 'honor',
    neighbour: 'neighbor',
    organisation: 'organization',
    realise: 'realize',
    analyse: 'analyze',
    centre: 'center',
    metre: 'meter',
    licence: 'license',
    defence: 'defense',
    programme: 'program',
  };

  if (
    (fromVariant === 'australian' || fromVariant === 'british') &&
    fromVariant !== toVariant &&
    toVariant === 'american'
  ) {
    return ausToUs;
  }

  if (
    fromVariant === 'american' &&
    (toVariant === 'australian' || toVariant === 'british')
  ) {
    // Reverse the mapping
    const usToAus: Record<string, string> = {};
    for (const [aus, us] of Object.entries(ausToUs)) {
      usToAus[us] = aus;
    }
    return usToAus;
  }

  return {};
}

function mapLocaleFromDb(row: any): LocaleProfile {
  return {
    id: row.id,
    regionSlug: row.region_slug,
    localeCode: row.locale_code,
    spellingVariant: row.spelling_variant,
    toneGuidelines: row.tone_guidelines || {},
    holidayCalendar: row.holiday_calendar || [],
    sensitivityFlags: row.sensitivity_flags || [],
  };
}
