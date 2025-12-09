/**
 * GET /api/report/get
 * Phase 7: Report Retrieval
 *
 * Retrieves any stored audit or snapshot report.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import ClientDataManager from "@/server/clientDataManager";

const VALID_CATEGORIES = [
  "audits",
  "snapshots",
  "competitors",
  "keywords",
  "backlinks",
  "geo",
  "reports",
] as const;

type Category = typeof VALID_CATEGORIES[number];

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const filename = searchParams.get("filename");
    const category = searchParams.get("category") as Category;

    // Validate required fields
    if (!clientId || !filename) {
      return NextResponse.json(
        { error: "Missing required query parameters: clientId, filename" },
        { status: 400 }
      );
    }

    // Validate category
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify client exists
    const { data: client, error: fetchError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, domain")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Determine category from filename if not provided
    let reportCategory: Category = category || "audits";

    // Try to infer category from filename
    if (!category) {
      if (filename.includes("snapshot")) {
reportCategory = "snapshots";
} else if (filename.includes("competitor")) {
reportCategory = "competitors";
} else if (filename.includes("keyword")) {
reportCategory = "keywords";
} else if (filename.includes("backlink")) {
reportCategory = "backlinks";
} else if (filename.includes("geo")) {
reportCategory = "geo";
} else if (filename.includes("dashboard") || filename.includes("report")) {
reportCategory = "reports";
}
    }

    // Read the report
    const result = await ClientDataManager.readReport(
      clientId,
      reportCategory,
      filename
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Report not found" },
        { status: 404 }
      );
    }

    // Determine content type from file extension
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "text/plain";

    switch (ext) {
      case "html":
        contentType = "text/html";
        break;
      case "csv":
        contentType = "text/csv";
        break;
      case "json":
        contentType = "application/json";
        break;
      case "md":
        contentType = "text/markdown";
        break;
    }

    // Return the file content
    return new NextResponse(result.content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-Client-Id": clientId,
        "X-Category": reportCategory,
      },
    });
  } catch (error) {
    console.error("[API /report/get] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
