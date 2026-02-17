/**
 * POST /api/folder/create
 * Phase 7: Client Folder Creation
 *
 * Creates a new subfolder inside the client's Docker volume
 * (audits, snapshots, geo, keywords, competitors, backlinks, reports).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import ClientDataManager from "@/server/clientDataManager";
import fs from "fs/promises";
import path from "path";

const VALID_FOLDER_TYPES = [
  "audits",
  "snapshots",
  "competitors",
  "keywords",
  "backlinks",
  "geo",
  "reports",
] as const;

export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { clientId, folderType } = body;

    // Validate required fields
    if (!clientId || !folderType) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, folderType" },
        { status: 400 }
      );
    }

    // Validate folder type
    if (!VALID_FOLDER_TYPES.includes(folderType)) {
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

    // Get base path for this client
    const basePath =
      process.env.DOCKER_CLIENT_DATA_PATH || "/app/clients";
    const folderPath = [basePath, clientId, folderType].join(path.sep);

    // Check if folder already exists
    try {
      await fs.access(folderPath);
      return NextResponse.json(
        { error: "Folder already exists", path: folderPath },
        { status: 409 }
      );
    } catch {
      // Folder doesn't exist, create it
    }

    // Create folder
    await fs.mkdir(folderPath, { recursive: true });

    // Log creation
    await supabase.from("client_storage_audit").insert({
      client_id: clientId,
      action: "folder_create",
      file_path: folderPath,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      status: "success",
      path: folderPath,
      clientId,
      folderType,
      message: `Folder ${folderType} created successfully`,
    });
  } catch (error) {
    console.error("[API /folder/create] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
