/**
 * Client Review Packs API
 * Phase 43: Agency Review Pack Generator
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { listReviewPacksForClient } from "@/lib/services/clientReviewPackService";

export async function GET(req: NextRequest) {
  try {
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

    const packs = await listReviewPacksForClient(userId);

    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Error fetching review packs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
