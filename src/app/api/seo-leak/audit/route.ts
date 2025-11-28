import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * SEO Leak Engine - Audit Routes
 * Handles technical SEO audits and leak detection
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
    const { url, audit_type, founder_business_id } = body;

    if (!url || !audit_type || !founder_business_id) {
      return NextResponse.json(
        { error: "Missing required fields: url, audit_type, founder_business_id" },
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

    // Create audit job
    const { data: auditJob, error: auditError } = await supabase
      .from("seo_leak_audit_jobs")
      .insert({
        founder_business_id,
        url,
        audit_type,
        status: "pending",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (auditError) {
      console.error("Audit job creation error:", auditError);
      return NextResponse.json(
        { error: "Failed to create audit job" },
        { status: 500 }
      );
    }

    // TODO: Trigger background job to run audit
    // This would call DataForSEO API, analyze signals, etc.

    return NextResponse.json({
      success: true,
      audit_job: auditJob,
      message: "Audit job started. Results will be available shortly.",
    });
  } catch (error) {
    console.error("SEO audit error:", error);
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

    // Fetch audit jobs
    const { data: auditJobs, error: jobsError } = await supabase
      .from("seo_leak_audit_jobs")
      .select("*")
      .eq("founder_business_id", founder_business_id)
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("Audit jobs fetch error:", jobsError);
      return NextResponse.json(
        { error: "Failed to fetch audit jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      audit_jobs: auditJobs,
    });
  } catch (error) {
    console.error("SEO audit fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
