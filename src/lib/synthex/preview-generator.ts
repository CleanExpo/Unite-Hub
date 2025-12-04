/**
 * Website Preview Generator for Synthex
 *
 * Generates AI-powered website previews for clients:
 * 1. Pulls onboarding data (business, industry, brand)
 * 2. AI Phill generates landing page copy
 * 3. Gemini generates hero image matching industry
 * 4. Returns complete preview ready for rendering
 */

import { getOpenRouterClient } from '@/lib/ai/openrouter-client';
import { generateImage, type GeminiImageResult } from '@/lib/gemini/image-client';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface TenantData {
  id: string;
  business_name: string;
  industry: string;
  region: string;
  website_url?: string;
}

export interface BrandData {
  id: string;
  brand_name: string;
  primary_domain: string;
  tagline?: string;
  value_proposition?: string;
  tone_voice: string;
}

export interface LandingPageCopy {
  headline: string;
  subheadline: string;
  heroDescription: string;
  ctaButton: string;
  features: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  testimonialPlaceholder: {
    quote: string;
    author: string;
    role: string;
  };
  footerTagline: string;
}

export interface WebsitePreview {
  id: string;
  tenantId: string;
  brandId?: string;
  status: 'generating' | 'ready' | 'approved' | 'rejected' | 'revision_requested';
  copy: LandingPageCopy;
  heroImage: {
    base64: string;
    mimeType: string;
    prompt: string;
  } | null;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  generatedAt: string;
  approvedAt?: string;
  revisionNotes?: string;
}

export interface GeneratePreviewOptions {
  forceRegenerate?: boolean;
  customPromptHints?: string;
  colorOverrides?: Partial<WebsitePreview['colorScheme']>;
}

// ============================================================================
// Industry Color Palettes
// ============================================================================

const industryColorPalettes: Record<string, WebsitePreview['colorScheme']> = {
  'plumbing': {
    primary: '#2563eb',    // Professional blue
    secondary: '#0d9488',  // Teal
    accent: '#f59e0b',     // Warm amber
    background: '#f8fafc',
    text: '#1e293b',
  },
  'electrical': {
    primary: '#dc2626',    // Electric red
    secondary: '#fbbf24',  // Warning yellow
    accent: '#1d4ed8',     // Blue
    background: '#fefce8',
    text: '#1c1917',
  },
  'roofing': {
    primary: '#78350f',    // Earthy brown
    secondary: '#854d0e',  // Rust
    accent: '#0d9488',     // Teal accent
    background: '#faf5ff',
    text: '#1c1917',
  },
  'landscaping': {
    primary: '#16a34a',    // Green
    secondary: '#84cc16',  // Lime
    accent: '#f59e0b',     // Sunflower
    background: '#f0fdf4',
    text: '#14532d',
  },
  'cleaning': {
    primary: '#0ea5e9',    // Sky blue
    secondary: '#06b6d4',  // Cyan
    accent: '#8b5cf6',     // Purple
    background: '#f0f9ff',
    text: '#0c4a6e',
  },
  'construction': {
    primary: '#f97316',    // Orange
    secondary: '#64748b',  // Slate
    accent: '#fbbf24',     // Yellow
    background: '#fefce8',
    text: '#1c1917',
  },
  'real_estate': {
    primary: '#7c3aed',    // Purple
    secondary: '#2563eb',  // Blue
    accent: '#10b981',     // Green
    background: '#faf5ff',
    text: '#1e1b4b',
  },
  'healthcare': {
    primary: '#0891b2',    // Cyan
    secondary: '#14b8a6',  // Teal
    accent: '#f472b6',     // Pink
    background: '#ecfeff',
    text: '#164e63',
  },
  'default': {
    primary: '#14b8a6',    // Unite Teal
    secondary: '#2563eb',  // Unite Blue
    accent: '#f39c12',     // Unite Orange
    background: '#f9fafb',
    text: '#111827',
  },
};

// ============================================================================
// Industry Image Prompts (5 Whys Methodology)
// ============================================================================

const industryImagePrompts: Record<string, string> = {
  'plumbing': `Photorealistic image of a friendly plumber in clean uniform shaking hands with a relieved homeowner at their front door, natural warm lighting, Australian suburban home in background. The homeowner looks genuinely grateful. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS. Warm, human-centered imagery.`,

  'electrical': `Professional electrician confidently explaining something to a small business owner, pointing at a modern switchboard, safety-conscious atmosphere, well-lit workshop or commercial space. Both people engaged and trusting. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS. Natural, documentary style.`,

  'roofing': `Wide angle shot of a roofing team celebrating on a completed roof at sunset, Australian landscape visible, safety harnesses on, professional and proud moment. Warm golden hour lighting. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS. Lifestyle photography style.`,

  'landscaping': `Beautiful Australian garden transformation, before/after feel without text, lush greenery, happy family enjoying their new outdoor space in the background. Warm natural lighting, suburban setting. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS.`,

  'cleaning': `Sparkling clean modern office or home interior, a professional cleaner giving a thumbs up to a satisfied client, bright airy atmosphere, sense of freshness and relief. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS. Clean, professional imagery.`,

  'construction': `Construction project manager in hard hat reviewing plans with client at a building site, collaborative moment, Australian construction site safety standards visible. Dawn lighting, sense of progress. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS.`,

  'real_estate': `Happy family receiving keys to their new home from a professional real estate agent, front porch of Australian home, emotional celebratory moment. Warm sunset lighting. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS.`,

  'healthcare': `Caring healthcare professional having a reassuring conversation with a patient in a modern clinic, warm and welcoming medical environment, sense of trust and care. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS.`,

  'default': `Professional business owner confidently greeting a client at the entrance of their small business, Australian main street visible, warm and welcoming atmosphere, sense of trust and local expertise. CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO NUMBERS.`,
};

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Fetch tenant and brand data from database
 */
async function fetchTenantData(tenantId: string): Promise<{ tenant: TenantData; brand: BrandData | null }> {
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('synthex_tenants')
    .select('id, business_name, industry, region, website_url')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const { data: brand } = await supabaseAdmin
    .from('synthex_brands')
    .select('id, brand_name, primary_domain, tagline, value_proposition, tone_voice')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();

  return { tenant, brand };
}

/**
 * Generate landing page copy using AI Phill via OpenRouter
 * Uses Claude Sonnet for high-quality client deliverables
 */
async function generateLandingPageCopy(
  tenant: TenantData,
  brand: BrandData | null,
  customHints?: string
): Promise<LandingPageCopy> {
  const businessContext = `
Business: ${tenant.business_name}
Industry: ${tenant.industry}
Region: ${tenant.region}
${brand?.tagline ? `Tagline: ${brand.tagline}` : ''}
${brand?.value_proposition ? `Value Proposition: ${brand.value_proposition}` : ''}
${brand?.tone_voice ? `Tone: ${brand.tone_voice}` : 'Tone: professional yet approachable'}
${customHints ? `Additional context: ${customHints}` : ''}
`;

  const prompt = `You are AI Phill, a marketing copywriter for Synthex clients. Generate compelling landing page copy for this Australian local business.

${businessContext}

Create landing page copy that:
1. Speaks directly to their ideal customer's pain points
2. Uses Australian English spelling and expressions
3. Builds trust through professionalism and local expertise
4. Has clear calls to action

Return ONLY valid JSON in this exact format:

{
  "headline": "8-12 word headline that grabs attention and speaks to the customer's need",
  "subheadline": "15-25 word supporting statement that expands on the headline",
  "heroDescription": "2-3 sentences describing what makes this business the right choice",
  "ctaButton": "Action-oriented button text (e.g., 'Get Your Free Quote')",
  "features": [
    {
      "title": "Feature benefit title",
      "description": "2 sentence explanation",
      "icon": "lucide icon name (e.g., Shield, Clock, Award, Wrench, Sparkles, Users)"
    },
    {
      "title": "Second feature",
      "description": "2 sentence explanation",
      "icon": "lucide icon name"
    },
    {
      "title": "Third feature",
      "description": "2 sentence explanation",
      "icon": "lucide icon name"
    }
  ],
  "testimonialPlaceholder": {
    "quote": "A realistic testimonial quote this type of customer might say",
    "author": "Australian first name",
    "role": "Customer type (e.g., 'Homeowner in Brisbane')"
  },
  "footerTagline": "Short memorable tagline for footer"
}`;

  // Use OpenRouter with Claude Sonnet for client deliverables
  const client = getOpenRouterClient();
  const response = await client.chat(
    'anthropic/claude-sonnet-4',
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, maxTokens: 2048 }
  );

  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response');
  }

  return JSON.parse(jsonMatch[0]) as LandingPageCopy;
}

/**
 * Generate hero image using Gemini
 */
async function generateHeroImage(
  tenant: TenantData
): Promise<{ base64: string; mimeType: string; prompt: string } | null> {
  try {
    const industry = tenant.industry.toLowerCase().replace(/\s+/g, '_');
    const prompt = industryImagePrompts[industry] || industryImagePrompts['default'];

    const result: GeminiImageResult = await generateImage(prompt, {
      model: 'gemini-2.5-flash-image',
      aspectRatio: '16:9',
    });

    return {
      base64: result.image.toString('base64'),
      mimeType: result.mimeType,
      prompt,
    };
  } catch (error) {
    console.error('Hero image generation failed:', error);
    return null;
  }
}

/**
 * Get color scheme for industry
 */
function getColorScheme(
  industry: string,
  overrides?: Partial<WebsitePreview['colorScheme']>
): WebsitePreview['colorScheme'] {
  const normalizedIndustry = industry.toLowerCase().replace(/\s+/g, '_');
  const baseScheme = industryColorPalettes[normalizedIndustry] || industryColorPalettes['default'];

  return {
    ...baseScheme,
    ...overrides,
  };
}

/**
 * Generate complete website preview
 */
export async function generateWebsitePreview(
  tenantId: string,
  options: GeneratePreviewOptions = {}
): Promise<WebsitePreview> {
  // Check for existing preview if not forcing regeneration
  if (!options.forceRegenerate) {
    const { data: existing } = await supabaseAdmin
      .from('synthex_website_previews')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return {
        id: existing.id,
        tenantId: existing.tenant_id,
        brandId: existing.brand_id,
        status: existing.status,
        copy: existing.copy_json,
        heroImage: existing.hero_image_json,
        colorScheme: existing.color_scheme_json,
        generatedAt: existing.created_at,
        approvedAt: existing.approved_at,
        revisionNotes: existing.revision_notes,
      };
    }
  }

  // Fetch tenant and brand data
  const { tenant, brand } = await fetchTenantData(tenantId);

  // Generate copy and image in parallel
  const [copy, heroImage] = await Promise.all([
    generateLandingPageCopy(tenant, brand, options.customPromptHints),
    generateHeroImage(tenant),
  ]);

  // Get color scheme
  const colorScheme = getColorScheme(tenant.industry, options.colorOverrides);

  // Create preview record
  const { data: preview, error } = await supabaseAdmin
    .from('synthex_website_previews')
    .insert({
      tenant_id: tenantId,
      brand_id: brand?.id,
      status: 'ready',
      copy_json: copy,
      hero_image_json: heroImage,
      color_scheme_json: colorScheme,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save preview: ${error.message}`);
  }

  return {
    id: preview.id,
    tenantId: preview.tenant_id,
    brandId: preview.brand_id,
    status: preview.status,
    copy,
    heroImage,
    colorScheme,
    generatedAt: preview.created_at,
  };
}

/**
 * Approve a website preview
 */
export async function approvePreview(previewId: string): Promise<WebsitePreview> {
  const { data: preview, error } = await supabaseAdmin
    .from('synthex_website_previews')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', previewId)
    .select()
    .single();

  if (error || !preview) {
    throw new Error(`Failed to approve preview: ${error?.message || 'Not found'}`);
  }

  return {
    id: preview.id,
    tenantId: preview.tenant_id,
    brandId: preview.brand_id,
    status: preview.status,
    copy: preview.copy_json,
    heroImage: preview.hero_image_json,
    colorScheme: preview.color_scheme_json,
    generatedAt: preview.created_at,
    approvedAt: preview.approved_at,
  };
}

/**
 * Request revision on a preview
 */
export async function requestPreviewRevision(
  previewId: string,
  notes: string
): Promise<WebsitePreview> {
  const { data: preview, error } = await supabaseAdmin
    .from('synthex_website_previews')
    .update({
      status: 'revision_requested',
      revision_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', previewId)
    .select()
    .single();

  if (error || !preview) {
    throw new Error(`Failed to request revision: ${error?.message || 'Not found'}`);
  }

  return {
    id: preview.id,
    tenantId: preview.tenant_id,
    brandId: preview.brand_id,
    status: preview.status,
    copy: preview.copy_json,
    heroImage: preview.hero_image_json,
    colorScheme: preview.color_scheme_json,
    generatedAt: preview.created_at,
    revisionNotes: preview.revision_notes,
  };
}

/**
 * Get latest preview for a tenant
 */
export async function getLatestPreview(tenantId: string): Promise<WebsitePreview | null> {
  const { data: preview, error } = await supabaseAdmin
    .from('synthex_website_previews')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !preview) {
    return null;
  }

  return {
    id: preview.id,
    tenantId: preview.tenant_id,
    brandId: preview.brand_id,
    status: preview.status,
    copy: preview.copy_json,
    heroImage: preview.hero_image_json,
    colorScheme: preview.color_scheme_json,
    generatedAt: preview.created_at,
    approvedAt: preview.approved_at,
    revisionNotes: preview.revision_notes,
  };
}
