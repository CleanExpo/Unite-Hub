/**
 * Audience Intelligence Service for Synthex
 * Phase: B10 - Audience Intelligence + Segmentation Engine
 *
 * Manages audiences, contacts, and AI-powered segmentation.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Lazy-load Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// Types
export interface Audience {
  id: string;
  tenantId: string;
  brandId?: string;
  name: string;
  description?: string;
  audienceType: 'static' | 'dynamic' | 'smart';
  rules?: AudienceRule[];
  contactCount: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AudienceContact {
  id: string;
  audienceId: string;
  tenantId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  attributes: Record<string, unknown>;
  tags: string[];
  engagementScore: number;
  lastEngagedAt?: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'suppressed';
  createdAt: string;
}

export interface Segment {
  id: string;
  tenantId: string;
  audienceId?: string;
  name: string;
  description?: string;
  segmentType: 'manual' | 'ai_generated' | 'behavioral' | 'demographic';
  rules: SegmentRule[];
  contactCount: number;
  aiConfidence?: number;
  aiReasoning?: string;
  createdAt: string;
}

export interface AudienceRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: unknown;
}

export interface SegmentRule {
  field: string;
  operator: string;
  value: unknown;
  weight?: number;
}

export interface GeneratedSegment {
  name: string;
  description: string;
  rules: SegmentRule[];
  estimatedSize: number;
  confidence: number;
}

/**
 * Create a new audience
 */
export async function createAudience(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    audienceType?: 'static' | 'dynamic' | 'smart';
    brandId?: string;
    rules?: AudienceRule[];
  }
): Promise<{ data: Audience | null; error: Error | null }> {
  try {
    const { data: audience, error } = await supabaseAdmin
      .from('synthex_audiences')
      .insert({
        tenant_id: tenantId,
        brand_id: data.brandId || null,
        name: data.name,
        description: data.description || null,
        audience_type: data.audienceType || 'static',
        rules: data.rules || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      data: mapAudience(audience),
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get audiences for a tenant
 */
export async function listAudiences(
  tenantId: string,
  options: { brandId?: string; limit?: number } = {}
): Promise<{ data: Audience[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_audiences')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (options.brandId) {
      query = query.eq('brand_id', options.brandId);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return {
      data: (data || []).map(mapAudience),
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get a single audience
 */
export async function getAudience(
  audienceId: string
): Promise<{ data: Audience | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_audiences')
      .select('*')
      .eq('id', audienceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null };
      throw new Error(error.message);
    }

    return { data: mapAudience(data), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Add a contact to an audience
 */
export async function addContact(
  tenantId: string,
  audienceId: string,
  contact: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    attributes?: Record<string, unknown>;
    tags?: string[];
  }
): Promise<{ data: AudienceContact | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .insert({
        audience_id: audienceId,
        tenant_id: tenantId,
        email: contact.email || null,
        phone: contact.phone || null,
        first_name: contact.firstName || null,
        last_name: contact.lastName || null,
        attributes: contact.attributes || {},
        tags: contact.tags || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return { data: mapContact(data), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Add multiple contacts to an audience
 */
export async function addContacts(
  tenantId: string,
  audienceId: string,
  contacts: Array<{
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    attributes?: Record<string, unknown>;
    tags?: string[];
  }>
): Promise<{ data: AudienceContact[] | null; error: Error | null }> {
  try {
    const rows = contacts.map((c) => ({
      audience_id: audienceId,
      tenant_id: tenantId,
      email: c.email || null,
      phone: c.phone || null,
      first_name: c.firstName || null,
      last_name: c.lastName || null,
      attributes: c.attributes || {},
      tags: c.tags || [],
    }));

    const { data, error } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);

    return { data: (data || []).map(mapContact), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get contacts in an audience
 */
export async function listContacts(
  audienceId: string,
  options: { limit?: number; offset?: number; status?: string } = {}
): Promise<{ data: AudienceContact[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_audience_contacts')
      .select('*')
      .eq('audience_id', audienceId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return { data: (data || []).map(mapContact), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Generate AI segments from audience data
 */
export async function generateSegments(
  tenantId: string,
  audienceId: string
): Promise<{ data: GeneratedSegment[] | null; error: Error | null }> {
  try {
    // Get audience contacts for analysis
    const { data: contacts, error: contactsError } = await listContacts(audienceId, { limit: 500 });

    if (contactsError) throw contactsError;
    if (!contacts || contacts.length === 0) {
      throw new Error('No contacts found in audience');
    }

    // Prepare data summary for AI
    const dataSummary = {
      totalContacts: contacts.length,
      sampleContacts: contacts.slice(0, 50).map((c) => ({
        email: c.email ? c.email.split('@')[1] : null, // Domain only for privacy
        attributes: c.attributes,
        tags: c.tags,
        engagementScore: c.engagementScore,
        status: c.status,
      })),
      attributeKeys: [...new Set(contacts.flatMap((c) => Object.keys(c.attributes)))],
      tagDistribution: contacts.reduce((acc, c) => {
        c.tags.forEach((t) => {
          acc[t] = (acc[t] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
      statusDistribution: contacts.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      engagementStats: {
        avg: contacts.reduce((sum, c) => sum + c.engagementScore, 0) / contacts.length,
        max: Math.max(...contacts.map((c) => c.engagementScore)),
        min: Math.min(...contacts.map((c) => c.engagementScore)),
      },
    };

    const prompt = `Analyze the following audience data and create 3-7 smart segments for targeted marketing.

AUDIENCE DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

For each segment, provide:
1. name - A clear, descriptive name
2. description - What this segment represents
3. rules - JSON rules the system can evaluate (field, operator, value)
4. estimatedSize - Estimated percentage of audience
5. confidence - How confident you are in this segment (0.0-1.0)

Consider:
- Engagement levels (high, medium, low)
- Status (active, unsubscribed, bounced)
- Tag-based groupings
- Attribute patterns
- Behavioral segments

Return a JSON array of segments. Return ONLY valid JSON, no other text.`;

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const segments = JSON.parse(responseText) as GeneratedSegment[];

    return { data: segments, error: null };
  } catch (err) {
    console.error('[AudienceService] Error generating segments:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Save generated segments to database
 */
export async function saveSegments(
  tenantId: string,
  audienceId: string,
  segments: GeneratedSegment[]
): Promise<{ data: Segment[] | null; error: Error | null }> {
  try {
    const rows = segments.map((s) => ({
      tenant_id: tenantId,
      audience_id: audienceId,
      name: s.name,
      description: s.description,
      segment_type: 'ai_generated',
      rules: s.rules,
      ai_confidence: s.confidence,
      ai_reasoning: `Estimated ${s.estimatedSize}% of audience`,
    }));

    const { data, error } = await supabaseAdmin
      .from('synthex_segments')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);

    return { data: (data || []).map(mapSegment), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get segments for a tenant
 */
export async function listSegments(
  tenantId: string,
  options: { audienceId?: string; limit?: number } = {}
): Promise<{ data: Segment[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_segments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (options.audienceId) {
      query = query.eq('audience_id', options.audienceId);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return { data: (data || []).map(mapSegment), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get a single segment
 */
export async function getSegment(
  segmentId: string
): Promise<{ data: Segment | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_segments')
      .select('*')
      .eq('id', segmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null };
      throw new Error(error.message);
    }

    return { data: mapSegment(data), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Delete an audience
 */
export async function deleteAudience(
  audienceId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_audiences')
      .delete()
      .eq('id', audienceId);

    if (error) throw new Error(error.message);

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Delete a segment
 */
export async function deleteSegment(
  segmentId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_segments')
      .delete()
      .eq('id', segmentId);

    if (error) throw new Error(error.message);

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

// Mapping functions
function mapAudience(row: Record<string, unknown>): Audience {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    brandId: row.brand_id as string | undefined,
    name: row.name as string,
    description: row.description as string | undefined,
    audienceType: row.audience_type as 'static' | 'dynamic' | 'smart',
    rules: row.rules as AudienceRule[],
    contactCount: row.contact_count as number,
    lastSyncedAt: row.last_synced_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapContact(row: Record<string, unknown>): AudienceContact {
  return {
    id: row.id as string,
    audienceId: row.audience_id as string,
    tenantId: row.tenant_id as string,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    firstName: row.first_name as string | undefined,
    lastName: row.last_name as string | undefined,
    attributes: row.attributes as Record<string, unknown>,
    tags: row.tags as string[],
    engagementScore: row.engagement_score as number,
    lastEngagedAt: row.last_engaged_at as string | undefined,
    status: row.status as 'active' | 'unsubscribed' | 'bounced' | 'suppressed',
    createdAt: row.created_at as string,
  };
}

function mapSegment(row: Record<string, unknown>): Segment {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    audienceId: row.audience_id as string | undefined,
    name: row.name as string,
    description: row.description as string | undefined,
    segmentType: row.segment_type as 'manual' | 'ai_generated' | 'behavioral' | 'demographic',
    rules: row.rules as SegmentRule[],
    contactCount: row.contact_count as number,
    aiConfidence: row.ai_confidence as number | undefined,
    aiReasoning: row.ai_reasoning as string | undefined,
    createdAt: row.created_at as string,
  };
}
