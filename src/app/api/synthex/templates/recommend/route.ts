/**
 * Synthex Template Recommendation API
 * Phase B38: Template Marketplace & Playbooks
 *
 * POST - Get AI-assisted template recommendations based on goals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Lazy-load Anthropic client
let anthropicClient: Awaited<typeof import('@anthropic-ai/sdk')>['default'] | null = null;

async function getAnthropicClient() {
  if (!anthropicClient) {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

interface RecommendationRequest {
  tenantId: string;
  goalDescription: string;
  preferredType?: string;
  stackContext?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RecommendationRequest = await request.json();
    const { tenantId, goalDescription, preferredType, stackContext } = body;

    if (!tenantId || !goalDescription) {
      return NextResponse.json(
        { error: 'tenantId and goalDescription are required' },
        { status: 400 }
      );
    }

    // Extract keywords from goal description
    const keywords = extractKeywords(goalDescription);

    // Get templates matching keywords using the SQL function
    const { data: templates, error: queryError } = await supabaseAdmin.rpc(
      'get_templates_for_goal',
      {
        p_goal_keywords: keywords,
        p_type: preferredType || null,
        p_limit: 10,
      }
    );

    if (queryError) {
      console.error('Error fetching templates:', queryError);
      // Fall back to basic query if function doesn't exist
      const { data: fallbackTemplates } = await supabaseAdmin
        .from('synthex_templates')
        .select('id, name, description, type, category, tags')
        .eq('is_public', true)
        .eq('scope', 'global')
        .limit(10);

      return NextResponse.json({
        recommendations: fallbackTemplates || [],
        reasoning: 'Using basic recommendations. AI-assisted discovery requires additional setup.',
        keywords,
      });
    }

    // Get AI reasoning for recommendations if we have results
    let aiReasoning = '';
    if (templates && templates.length > 0 && process.env.ANTHROPIC_API_KEY) {
      try {
        const client = await getAnthropicClient();
        const response = await client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `Given the user's goal: "${goalDescription}"

And these template options:
${templates.slice(0, 5).map((t: { name: string; description: string; type: string }) => `- ${t.name} (${t.type}): ${t.description}`).join('\n')}

Provide a brief (2-3 sentences) explanation of which templates would work best and why. Focus on practical value.`,
            },
          ],
        });

        if (response.content[0].type === 'text') {
          aiReasoning = response.content[0].text;
        }
      } catch (aiError) {
        console.error('AI reasoning error:', aiError);
        aiReasoning = 'Based on your goals, these templates match your requirements.';
      }
    }

    // Store recommendation for future reference
    await supabaseAdmin.from('synthex_template_recommendations').insert({
      tenant_id: tenantId,
      goal_description: goalDescription,
      stack_context: stackContext || {},
      recommended_template_ids: templates?.map((t: { id: string }) => t.id) || [],
      ai_reasoning: aiReasoning,
    });

    return NextResponse.json({
      recommendations: templates || [],
      reasoning: aiReasoning || 'Templates selected based on keyword matching.',
      keywords,
      count: templates?.length || 0,
    });
  } catch (error) {
    console.error('Error in templates/recommend POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract keywords from goal description
 */
function extractKeywords(description: string): string[] {
  const stopWords = new Set([
    'i', 'want', 'to', 'a', 'an', 'the', 'for', 'and', 'or', 'but', 'in', 'on',
    'at', 'with', 'my', 'our', 'we', 'need', 'help', 'me', 'please', 'can', 'you',
    'how', 'do', 'create', 'make', 'build', 'get', 'set', 'up', 'use',
  ]);

  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // Also extract common marketing/sales terms
  const marketingTerms = [
    'lead', 'leads', 'email', 'webinar', 'funnel', 'sales', 'conversion',
    'landing', 'page', 'signup', 'newsletter', 'campaign', 'automation',
    'welcome', 'onboarding', 'nurture', 'drip', 'sequence', 'product',
    'launch', 'promo', 'discount', 'offer', 'upsell', 'cross-sell',
  ];

  const foundTerms = marketingTerms.filter((term) =>
    description.toLowerCase().includes(term)
  );

  // Combine and deduplicate
  const allKeywords = [...new Set([...words, ...foundTerms])];

  return allKeywords.slice(0, 10);
}
