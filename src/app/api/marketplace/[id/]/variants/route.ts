import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRateLimit } from "@/lib/api-helpers";
import { Anthropic } from "@anthropic-ai/sdk";

interface VariantRequest {
  variant_type: "dark_mode" | "mobile" | "rtl" | "custom";
  customDescription?: string;
}

const variantPrompts = {
  dark_mode: "Create a dark mode variant of this React component. Use dark colors (slate-800, slate-900) instead of light colors.",
  mobile: "Create a mobile-responsive variant of this React component. Optimize for small screens (320px-480px).",
  rtl: "Create an RTL (right-to-left) variant of this React component. Mirror all directional properties (left/right, ml/mr).",
  custom: "Create a new variant based on the description:",
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const componentId = params.id;
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const body: VariantRequest = await request.json();
    const { variant_type, customDescription } = body;

    const validTypes = ["dark_mode", "mobile", "rtl", "custom"];
    if (!validTypes.includes(variant_type)) {
      return NextResponse.json({ error: "Invalid variant_type" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: component, error } = await supabase
      .from("marketplace_components")
      .select("id, name, component_code, category")
      .eq("id", componentId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error || !component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    const { data: existingVariant } = await supabase
      .from("component_variants")
      .select("id")
      .eq("component_id", componentId)
      .eq("variant_type", variant_type)
      .maybeSingle();

    if (existingVariant) {
      return NextResponse.json({ error: "Variant already exists" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt =
      variant_type === "custom"
        ? `${variantPrompts.custom}\n\n${customDescription}\n\nComponent:\n${component.component_code}`
        : `${variantPrompts[variant_type as keyof typeof variantPrompts]}\n\nComponent:\n${component.component_code}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const variantCode = message.content[0].type === "text" ? message.content[0].text : "";

    const { data: variant, error: insertError } = await supabase
      .from("component_variants")
      .insert({
        component_id: componentId,
        variant_type,
        component_code: variantCode,
        html_preview: null,
        created_by: user.id,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("Error creating variant:", insertError);
      return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
    }

    if (variant_type === "dark_mode") {
      await supabase
        .from("marketplace_components")
        .update({ has_dark_mode: true })
        .eq("id", componentId);
    } else if (variant_type === "mobile") {
      await supabase
        .from("marketplace_components")
        .update({ has_mobile_variant: true })
        .eq("id", componentId);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: variant?.id,
        variant_type,
        component_code: variantCode,
        message: `${variant_type} variant created successfully`,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
