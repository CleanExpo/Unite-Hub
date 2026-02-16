import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { anthropic } from "@/lib/anthropic/client";
import { ANTHROPIC_MODELS } from "@/lib/anthropic/models";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { aiAgentRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/landing-pages/generate
 * Generate a new landing page checklist with AI
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await request.json();
    const { clientId, pageType, title, personaId } = body;

    if (!clientId || !pageType || !title) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, pageType, title" },
        { status: 400 }
      );
    }

    // Validate page type
    const validPageTypes = [
      "homepage",
      "product",
      "service",
      "lead_capture",
      "sales",
      "event",
    ];
    if (!validPageTypes.includes(pageType)) {
      return NextResponse.json(
        { error: "Invalid page type" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get client info for context
    const { data: client } = await supabase
      .from("clients")
      .select("business_name, business_description")
      .eq("id", clientId)
      .single();

    // Get persona if provided
    let persona = null;
    if (personaId) {
      const { data } = await supabase
        .from("personas")
        .select("*")
        .eq("id", personaId)
        .single();
      persona = data;
    }

    // Generate checklist with AI
    const checklist = await generateChecklistWithAI(
      pageType,
      title,
      client,
      persona
    );

    // Save to database
    const { data: savedChecklist, error } = await supabase
      .from("landing_page_checklists")
      .insert({
        client_id: clientId,
        page_type: pageType,
        title,
        persona_id: personaId,
        sections: checklist.sections,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving checklist:", error);
      return NextResponse.json(
        { error: "Failed to save checklist" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checklistId: savedChecklist.id,
      message: "Landing page checklist generated successfully",
    });
  } catch (error: unknown) {
    console.error("Error generating landing page checklist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate checklist" },
      { status: 500 }
    );
  }
}

async function generateChecklistWithAI(
  pageType: string,
  title: string,
  client: any,
  persona: any
) {
  const prompt = `Generate a comprehensive landing page checklist for a ${pageType} page titled "${title}".

${client ? `Business: ${client.business_name} - ${client.business_description}` : ""}
${persona ? `Target Persona: ${persona.name} - ${persona.description}` : ""}

Create sections with specific copy recommendations for:
1. Hero Section (headline, subheadline, CTA)
2. Value Proposition
3. Features/Benefits
4. Social Proof (testimonials, logos, stats)
5. Call-to-Action sections
6. FAQ/Objection Handling
7. Footer content

For each section, provide:
- Section name
- Recommended copy (multiple variations)
- Best practices
- Checklist items

Return as JSON:
{
  "sections": [
    {
      "name": "string",
      "copyRecommendations": ["string"],
      "bestPractices": ["string"],
      "checklistItems": [
        { "item": "string", "completed": false }
      ]
    }
  ]
}`;

  const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
    model: ANTHROPIC_MODELS.SONNET_4_5,
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })
    });

    const message = result.data;;

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  return JSON.parse(jsonMatch[0]);
}
