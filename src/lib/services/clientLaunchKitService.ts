/**
 * Client Launch Kit Service
 * Phase 47: Generates and manages client welcome packs and launch materials
 */

import { supabaseAdmin } from '@/lib/supabase';
import { generateWelcomePackMarkdown } from '@/lib/templates/welcomePackMarkdown';
import { generateIntroVideoScript } from '@/lib/templates/introVideoScript';

export interface LaunchKitData {
  clientId: string;
  organizationId: string;
  businessName?: string;
  businessUrl?: string;
  businessIndustry?: string;
  targetAudience?: string;
  brandColors?: { primary?: string; secondary?: string; accent?: string };
}

export interface LaunchKit {
  id: string;
  client_id: string;
  organization_id: string;
  status: 'pending' | 'generating' | 'ready' | 'viewed' | 'completed';
  welcome_pack_markdown: string | null;
  brand_positioning_report: string | null;
  intro_video_script: string | null;
  visual_inspiration_urls: string[];
  initial_seo_snapshot: any;
  business_name: string | null;
  business_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new launch kit for a client
 */
export async function createLaunchKit(data: LaunchKitData): Promise<{ success: boolean; kit?: LaunchKit; error?: string }> {
  try {
    const { data: kit, error } = await supabaseAdmin
      .from('client_launch_kits')
      .insert({
        client_id: data.clientId,
        organization_id: data.organizationId,
        business_name: data.businessName,
        business_url: data.businessUrl,
        business_industry: data.businessIndustry,
        target_audience: data.targetAudience,
        brand_colors: data.brandColors,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, kit };
  } catch (error) {
    console.error('Error creating launch kit:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create launch kit' };
  }
}

/**
 * Generate launch kit content using AI
 */
export async function generateLaunchKitContent(kitId: string): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();
  const modelsUsed: string[] = [];

  try {
    // Update status to generating
    await supabaseAdmin
      .from('client_launch_kits')
      .update({ status: 'generating' })
      .eq('id', kitId);

    // Fetch kit data
    const { data: kit, error: fetchError } = await supabaseAdmin
      .from('client_launch_kits')
      .select('*')
      .eq('id', kitId)
      .single();

    if (fetchError || !kit) throw new Error('Launch kit not found');

    // Generate welcome pack markdown
    const welcomePack = generateWelcomePackMarkdown({
      businessName: kit.business_name || 'Your Business',
      businessIndustry: kit.business_industry || 'General',
      targetAudience: kit.target_audience || 'General audience',
    });
    modelsUsed.push('Template-Based');

    // Generate intro video script
    const introScript = generateIntroVideoScript({
      businessName: kit.business_name || 'Your Business',
      businessIndustry: kit.business_industry || 'General',
    });
    modelsUsed.push('Template-Based');

    // Generate brand positioning report
    const brandReport = generateBrandPositioningReport({
      businessName: kit.business_name || 'Your Business',
      businessIndustry: kit.business_industry || 'General',
      targetAudience: kit.target_audience || 'General audience',
    });

    // Generate initial SEO snapshot placeholder
    const seoSnapshot = {
      status: 'pending',
      message: 'SEO analysis will be available once you connect your website URL',
      recommendations: [
        'Add your website URL to get started',
        'Upload your sitemap for deeper analysis',
        'Connect Google Search Console for real-time data',
      ],
    };

    // Visual inspiration placeholder
    const visualUrls = [
      '/images/inspiration/placeholder-1.jpg',
      '/images/inspiration/placeholder-2.jpg',
      '/images/inspiration/placeholder-3.jpg',
    ];

    const generationTime = Date.now() - startTime;

    // Update kit with generated content
    const { error: updateError } = await supabaseAdmin
      .from('client_launch_kits')
      .update({
        status: 'ready',
        generated_at: new Date().toISOString(),
        welcome_pack_markdown: welcomePack,
        brand_positioning_report: brandReport,
        intro_video_script: introScript,
        visual_inspiration_urls: visualUrls,
        initial_seo_snapshot: seoSnapshot,
        ai_models_used: modelsUsed,
        generation_time_ms: generationTime,
      })
      .eq('id', kitId);

    if (updateError) throw updateError;

    // Create lifecycle event
    await supabaseAdmin.from('client_lifecycle_events').insert({
      client_id: kit.client_id,
      launch_kit_id: kitId,
      event_type: 'signup',
      event_data: { generationTime, modelsUsed },
    });

    return { success: true };
  } catch (error) {
    console.error('Error generating launch kit content:', error);

    // Update status to indicate failure
    await supabaseAdmin
      .from('client_launch_kits')
      .update({ status: 'pending' })
      .eq('id', kitId);

    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate content' };
  }
}

/**
 * Get launch kit for a client
 */
export async function getClientLaunchKit(clientId: string): Promise<{ success: boolean; kit?: LaunchKit; error?: string }> {
  try {
    const { data: kit, error } = await supabaseAdmin
      .from('client_launch_kits')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, kit: kit || undefined };
  } catch (error) {
    console.error('Error fetching launch kit:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch launch kit' };
  }
}

/**
 * Mark launch kit as viewed
 */
export async function markKitViewed(kitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('client_launch_kits')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', kitId)
      .eq('status', 'ready');

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking kit as viewed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update kit status' };
  }
}

/**
 * Update business details in launch kit
 */
export async function updateLaunchKitDetails(
  kitId: string,
  details: Partial<LaunchKitData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('client_launch_kits')
      .update({
        business_name: details.businessName,
        business_url: details.businessUrl,
        business_industry: details.businessIndustry,
        target_audience: details.targetAudience,
        brand_colors: details.brandColors,
      })
      .eq('id', kitId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating launch kit details:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update details' };
  }
}

/**
 * Generate brand positioning report
 */
function generateBrandPositioningReport(data: {
  businessName: string;
  businessIndustry: string;
  targetAudience: string;
}): string {
  return `# Brand Positioning Starter Report

## ${data.businessName}

### Industry Overview
Your business operates in the **${data.businessIndustry}** sector. This industry presents unique opportunities for differentiation through quality service and strong online presence.

### Target Audience Profile
**Primary Audience**: ${data.targetAudience}

### Recommended Positioning Strategy

1. **Value Proposition Focus**
   - Emphasize quality and reliability
   - Highlight unique differentiators
   - Build trust through transparency

2. **Content Pillars**
   - Educational content about your services
   - Behind-the-scenes insights
   - Customer success stories
   - Industry expertise demonstrations

3. **Visual Identity Guidelines**
   - Maintain consistency across all platforms
   - Use high-quality imagery
   - Align colors with brand personality

### Next Steps
1. Complete your business profile
2. Upload brand assets
3. Review and approve generated content
4. Launch your first campaign

---
*This is a starter report. Full analysis will be available once you complete your profile setup.*
`;
}

/**
 * Get launch kit progress percentage
 */
export function calculateKitProgress(kit: LaunchKit, tasksCompleted: number, totalTasks: number): number {
  let progress = 0;

  // Kit generation (20%)
  if (kit.status !== 'pending') progress += 20;

  // Kit viewed (10%)
  if (kit.status === 'viewed' || kit.status === 'completed') progress += 10;

  // Business details (20%)
  if (kit.business_name && kit.business_url) progress += 20;

  // Tasks completion (50%)
  if (totalTasks > 0) {
    progress += Math.round((tasksCompleted / totalTasks) * 50);
  }

  return Math.min(progress, 100);
}
