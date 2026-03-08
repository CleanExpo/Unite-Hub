import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const connections: Record<string, string> = {};

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Route handlers cannot set cookies — expected
            }
          },
        },
      }
    );

    // Ping Supabase — PGRST116 = table exists but empty (connection is fine)
    const { error } = await supabase
      .from("nexus_pages")
      .select("id")
      .limit(1)
      .maybeSingle();

    connections.supabase =
      !error || error.code === "PGRST116" ? "ok" : "error";
  } catch {
    connections.supabase = "error";
  }

  const allOk = Object.values(connections).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      connections,
    },
    { status: allOk ? 200 : 503 }
  );
}
