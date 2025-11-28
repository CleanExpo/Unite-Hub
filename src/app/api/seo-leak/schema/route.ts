import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * SEO Leak Engine - Schema Markup
 * Generates and validates schema.org markup
 */

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    const body = await req.json();
    const { founder_business_id, url, schema_type, schema_data } = body;

    if (!founder_business_id || !url || !schema_type) {
      return NextResponse.json(
        {
          error: "Missing required fields: founder_business_id, url, schema_type",
        },
        { status: 400 }
      );
    }

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from("founder_businesses")
      .select("id")
      .eq("id", founder_business_id)
      .eq("owner_user_id", userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found or access denied" },
        { status: 403 }
      );
    }

    // TODO: Implement schema generation based on schema_type
    // Supported types: LocalBusiness, Organization, Article, Product, Service, etc.

    const mockSchemaMarkup = {
      "@context": "https://schema.org",
      "@type": schema_type,
      name: schema_data?.name || "Your Business Name",
      url: url,
      ...(schema_type === "LocalBusiness" && {
        address: {
          "@type": "PostalAddress",
          streetAddress: schema_data?.address?.street || "123 Main St",
          addressLocality: schema_data?.address?.city || "City",
          addressRegion: schema_data?.address?.state || "State",
          postalCode: schema_data?.address?.zip || "12345",
          addressCountry: schema_data?.address?.country || "US",
        },
        telephone: schema_data?.phone || "+1-555-555-5555",
        openingHoursSpecification: schema_data?.hours || [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "09:00",
            closes: "17:00",
          },
        ],
      }),
      ...(schema_type === "Organization" && {
        logo: schema_data?.logo || `${url}/logo.png`,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: schema_data?.phone || "+1-555-555-5555",
          contactType: "customer service",
        },
      }),
    };

    const { data: schemaRecord, error: schemaError } = await supabase
      .from("seo_leak_schema_markup")
      .insert({
        founder_business_id,
        url,
        schema_type,
        schema_markup: mockSchemaMarkup,
        validation_status: "pending",
      })
      .select()
      .single();

    if (schemaError) {
      console.error("Schema creation error:", schemaError);
      return NextResponse.json(
        { error: "Failed to create schema markup" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      schema: schemaRecord,
      markup: mockSchemaMarkup,
      message: "Schema markup generated successfully",
    });
  } catch (error) {
    console.error("Schema generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    const { searchParams } = req.nextUrl;
    const founder_business_id = searchParams.get("founder_business_id");

    if (!founder_business_id) {
      return NextResponse.json(
        { error: "Missing founder_business_id parameter" },
        { status: 400 }
      );
    }

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from("founder_businesses")
      .select("id")
      .eq("id", founder_business_id)
      .eq("owner_user_id", userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found or access denied" },
        { status: 403 }
      );
    }

    // Fetch schema markups
    const { data: schemas, error: schemasError } = await supabase
      .from("seo_leak_schema_markup")
      .select("*")
      .eq("founder_business_id", founder_business_id)
      .order("created_at", { ascending: false });

    if (schemasError) {
      console.error("Schemas fetch error:", schemasError);
      return NextResponse.json(
        { error: "Failed to fetch schemas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      schemas: schemas,
    });
  } catch (error) {
    console.error("Schemas fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
