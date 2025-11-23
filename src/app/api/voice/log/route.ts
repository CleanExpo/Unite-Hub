/**
 * Voice Navigation Log API
 * Phase 44: Voice-First Navigation Layer
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { logVoiceEvent, type UserRole, type NavigationResult } from "@/lib/services/voiceNavigationService";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { commandText, result, processingTimeMs, userRole } = body as {
      commandText: string;
      result: NavigationResult;
      processingTimeMs: number;
      userRole: UserRole;
    };

    await logVoiceEvent(userId, userRole, commandText, result, processingTimeMs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging voice event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
