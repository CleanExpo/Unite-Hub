/**
 * GET /api/folder/list
 * Phase 7: List Client Folder Contents
 *
 * Lists all files inside a client folder.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import ClientDataManager from "@/server/clientDataManager";

const VALID_FOLDER_TYPES = [
  "audits",
  "snapshots",
  "competitors",
  "keywords",
  "backlinks",
  "geo",
  "reports",
] as const;

type FolderType = typeof VALID_FOLDER_TYPES[number];

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
    const folderType = searchParams.get("folderType");

    // Validate required fields
    if (!clientId || !folderType) {
      return NextResponse.json(
        { error: "Missing required query parameters: clientId, folderType" },
        { status: 400 }
      );
    }

    // Validate folder type
    if (!VALID_FOLDER_TYPES.includes(folderType as FolderType)) {
      return NextResponse.json(
        {
          error: `Invalid folderType. Must be one of: ${VALID_FOLDER_TYPES.join(", ")}`,
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

    // List reports in the specified category
    const result = await ClientDataManager.listReports(
      clientId,
      folderType as FolderType
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to list files" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientId,
      folderType,
      files: result.files || [],
      count: result.files?.length || 0,
    });
  } catch (error) {
    console.error("[API /folder/list] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
