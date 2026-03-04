/**
 * POST /api/founder/content-cross
 * Cross-pollination content engine: adapt content from one business for others.
 * Uses Claude Haiku for fast, cost-effective multi-brand adaptation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a brand content strategist for Unite-Group's portfolio of 6 Australian businesses. Each business has a distinct voice:

- **Disaster Recovery (DR)**: Emergency restoration services. Tone: urgent, empathetic, professional. Speaks to property owners and insurance companies in crisis moments.
- **RestoreAssist**: SaaS platform for restoration companies. Tone: technical, helpful, modern. Speaks to restoration business owners and technicians.
- **ATO Compliance**: Tax and accounting advisory. Tone: authoritative, precise, compliance-focused. Speaks to small business owners navigating tax obligations.
- **NRPG (National Restoration Products Group)**: Procurement and industry networking. Tone: community-driven, industry-insider, practical. Speaks to restoration professionals.
- **Unite-Group**: The parent holding company and CRM/AI platform. Tone: strategic, executive, visionary. Speaks to founders, investors, and enterprise partners.
- **CARSI (Community and Recovery Support Initiative)**: Community support and recovery programmes. Tone: warm, inclusive, community-focused. Speaks to individuals and communities recovering from disasters.

When adapting content:
1. Keep the core message and intent intact
2. Adjust tone, vocabulary, and examples to match the target brand
3. Use Australian English (colour, behaviour, organisation, etc.)
4. Adapt calls-to-action to suit each business's audience
5. Maintain the same content length (roughly)

Return ONLY the adapted content text for each business, no explanations or metadata.`;

interface AdaptationRequest {
  sourceContent: string;
  sourceBusiness: string;
  targetBusinesses: string[];
  contentType: 'social' | 'email' | 'blog';
}

interface Adaptation {
  business: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body: AdaptationRequest = await req.json();
    const { sourceContent, sourceBusiness, targetBusinesses, contentType } = body;

    if (!sourceContent?.trim()) {
      return NextResponse.json({ error: 'sourceContent is required' }, { status: 400 });
    }
    if (!sourceBusiness) {
      return NextResponse.json({ error: 'sourceBusiness is required' }, { status: 400 });
    }
    if (!targetBusinesses?.length) {
      return NextResponse.json({ error: 'At least one targetBusiness is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const targetList = targetBusinesses.join(', ');
    const userMessage = `Source business: ${sourceBusiness}
Content type: ${contentType}
Target businesses: ${targetList}

Source content:
"""
${sourceContent.trim()}
"""

Adapt this content for each target business. Return your response as a JSON array with objects containing "business" and "content" fields. Example: [{"business":"DR","content":"adapted text..."}]`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract text from response
    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = textBlock?.type === 'text' ? textBlock.text : '';

    // Parse JSON array from response
    let adaptations: Adaptation[] = [];
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        adaptations = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: return raw text as single adaptation
      adaptations = targetBusinesses.map((b) => ({
        business: b,
        content: rawText,
      }));
    }

    return NextResponse.json({ adaptations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/content-cross]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
