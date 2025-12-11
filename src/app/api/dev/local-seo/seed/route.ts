import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Dev-only endpoint to seed sample data into the Synthex 2026 Local SEO engine.
// WARNING: This route is intended for local development only.
// It is guarded by NODE_ENV and should not be exposed in production.
//
// Usage (local):
//   POST /api/dev/local-seo/seed?workspaceId=<workspace_uuid>
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");

  if (!workspaceId) {
    return new Response(
      JSON.stringify({ error: "workspaceId query parameter is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = await getSupabaseAdmin();

  try {
    // 1) Create a demo Local SEO profile for this workspace (if none exists)
    const { data: existingProfiles, error: existingError } = await supabase
      .from("synthex_local_seo_profiles")
      .select("*")
      .eq("workspace_id", workspaceId)
      .limit(1);

    if (existingError) {
      console.error("seed-local-seo: error checking existing profiles", existingError);
      throw existingError;
    }

    let profileId: string;

    if (existingProfiles && existingProfiles.length > 0) {
      profileId = existingProfiles[0].id as string;
    } else {
      const { data: profile, error: profileError } = await supabase
        .from("synthex_local_seo_profiles")
        .insert([
          {
            workspace_id: workspaceId,
            business_name: "Demo Local SEO Profile",
            primary_location: {
              city: "Brisbane",
              state: "QLD",
              country: "Australia",
              lat: -27.4705,
              lng: 153.026,
              formatted_address: "Brisbane QLD, Australia",
            },
            service_areas: [
              { city: "Brisbane", radius_km: 15 },
              { city: "Logan", radius_km: 10 },
            ],
            business_category: "Plumber",
            target_keywords: [
              { keyword: "emergency plumber brisbane" },
              { keyword: "blocked drains brisbane" },
              { keyword: "hot water system repair" },
            ],
            ai_sge_tracking_enabled: true,
            schema_auto_generation: true,
            citation_syndication_enabled: true,
            gbp_automation_enabled: true,
          },
        ])
        .select("id")
        .single();

      if (profileError || !profile) {
        console.error("seed-local-seo: error creating profile", profileError);
        throw profileError || new Error("Failed to create profile");
      }

      profileId = profile.id as string;
    }

    // 2) Seed a few AI search visibility rows
    const now = new Date().toISOString();

    const { error: visibilityError } = await supabase.from("ai_search_visibility").insert([
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        query: "emergency plumber brisbane",
        ai_platform: "google_sge",
        visibility_status: "cited",
        position: 1,
        citation_text: "We recommend this Brisbane-based plumber for emergency call-outs.",
        citation_context: "Local services in Brisbane",
        confidence_score: 92,
        search_volume: 2400,
        difficulty_score: 62,
        query_intent: "local",
        checked_at: now,
      },
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        query: "blocked drains brisbane",
        ai_platform: "bing_copilot",
        visibility_status: "mentioned",
        position: 3,
        citation_text: "For stubborn blocked drains in Brisbane, consider local experts.",
        citation_context: "Home maintenance and repairs",
        confidence_score: 85,
        search_volume: 1300,
        difficulty_score: 55,
        query_intent: "local",
        checked_at: now,
      },
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        query: "hot water system repair brisbane",
        ai_platform: "perplexity",
        visibility_status: "featured",
        position: 1,
        citation_text: "This provider offers 24/7 hot water system repairs across Brisbane.",
        citation_context: "Emergency hot water services",
        confidence_score: 88,
        search_volume: 720,
        difficulty_score: 48,
        query_intent: "local",
        checked_at: now,
      },
    ]);

    if (visibilityError) {
      console.error("seed-local-seo: error inserting visibility rows", visibilityError);
      throw visibilityError;
    }

    // 3) Seed a few schema markup records
    const { error: schemaError } = await supabase.from("schema_markup_generated").insert([
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        page_url: "https://example.com/brisbane-emergency-plumbing",
        page_title: "Emergency Plumber Brisbane | 24/7 Callouts",
        schema_type: "LocalBusiness",
        generated_markup: {
          "@type": "LocalBusiness",
          name: "Demo Local SEO Profile",
          address: {
            addressLocality: "Brisbane",
            addressRegion: "QLD",
            addressCountry: "AU",
          },
        },
        validation_status: "valid",
        validation_errors: [],
        validation_warnings: [],
        google_rich_results_eligible: true,
        auto_applied: false,
        manually_approved: false,
        rich_results_impressions: 1200,
        rich_results_clicks: 180,
      },
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        page_url: "https://example.com/brisbane-blocked-drains",
        page_title: "Blocked Drains Brisbane | Same-Day Service",
        schema_type: "Service",
        generated_markup: {
          "@type": "Service",
          serviceType: "Blocked Drain Clearing",
          areaServed: "Brisbane",
        },
        validation_status: "warnings",
        validation_errors: [],
        validation_warnings: [{ message: "Missing image field" }],
        google_rich_results_eligible: false,
        auto_applied: false,
        manually_approved: false,
        rich_results_impressions: 640,
        rich_results_clicks: 52,
      },
    ]);

    if (schemaError) {
      console.error("seed-local-seo: error inserting schema rows", schemaError);
      throw schemaError;
    }

    // 4) Seed a few GBP management queue items
    const { error: gbpError } = await supabase.from("gbp_management_queue").insert([
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        action_type: "post_update",
        action_data: {
          title: "24/7 Emergency Plumbing",
          body: "Now offering guaranteed 60-minute emergency response across Brisbane.",
        },
        priority: 10,
        status: "pending",
      },
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        action_type: "photo_upload",
        action_data: {
          alt: "Blocked drain before/after",
          tags: ["portfolio", "blocked-drains"],
        },
        priority: 5,
        status: "pending",
      },
    ]);

    if (gbpError) {
      console.error("seed-local-seo: error inserting GBP queue rows", gbpError);
      throw gbpError;
    }

    // 5) Seed a few service-level content strategy rows
    const { error: serviceError } = await supabase.from("service_content_strategy").insert([
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        service_name: "Emergency Plumbing",
        service_category: "Plumbing",
        target_location: { city: "Brisbane", region: "QLD", country: "AU" },
        primary_keywords: [
          { keyword: "emergency plumber brisbane" },
          { keyword: "24 7 plumber brisbane" },
        ],
        content_topics: [
          { topic: "What counts as a plumbing emergency" },
          { topic: "Response times across Brisbane suburbs" },
        ],
        faq_questions: [
          { q: "Do you charge call-out fees after hours?" },
          { q: "How fast can you arrive in Brisbane CBD?" },
        ],
        competitor_content_gaps: [
          { competitor: "Competitor A", gap: "No pricing transparency" },
        ],
        content_outline: {
          sections: ["Intro", "Common emergencies", "Coverage map", "Guarantees"],
        },
        generated_content: null,
        content_status: "draft",
        content_score: null,
        seo_optimization_score: null,
        local_relevance_score: 85,
      },
      {
        workspace_id: workspaceId,
        seo_profile_id: profileId,
        service_name: "Blocked Drains",
        service_category: "Drainage",
        target_location: { city: "Brisbane", region: "QLD", country: "AU" },
        primary_keywords: [
          { keyword: "blocked drains brisbane" },
          { keyword: "drain clearing brisbane" },
        ],
        content_topics: [
          { topic: "Causes of blocked drains in older Brisbane suburbs" },
        ],
        faq_questions: [
          { q: "Do you offer CCTV drain inspections?" },
        ],
        competitor_content_gaps: [],
        content_outline: null,
        generated_content: null,
        content_status: "draft",
        content_score: null,
        seo_optimization_score: null,
        local_relevance_score: 78,
      },
    ]);

    if (serviceError) {
      console.error("seed-local-seo: error inserting service content rows", serviceError);
      throw serviceError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Seeded Local SEO profile, AI search visibility records, schema markup, GBP queue, and service content records",
        workspaceId,
        profileId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("seed-local-seo: unexpected error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
