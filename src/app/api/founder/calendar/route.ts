import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { GoogleCalendarService } from "@/lib/services/google-calendar";

// ─── Colour tagging by keyword ──────────────────────────────────────────────

function assignColour(summary: string = ""): string {
  const s = summary.toUpperCase();
  if (s.includes("DR") || s.includes("DISASTER")) return "#FF4444";
  if (s.includes("NRPG") || s.includes("PROPERTY")) return "#FFB800";
  if (s.includes("CARSI") || s.includes("BOOKING")) return "#00F5FF";
  if (s.includes("ATO") || s.includes("TAX") || s.includes("BAS")) return "#00FF88";
  return "#6366f1";
}

// ─── Token retrieval (admin client, bypasses RLS) ────────────────────────────

async function getGoogleTokens(): Promise<{
  access_token: string;
  refresh_token: string | null;
} | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("email_integrations")
      .select("access_token, refresh_token")
      .eq("provider", "google")
      .limit(1)
      .single();

    if (error || !data?.access_token) return null;
    return { access_token: data.access_token, refresh_token: data.refresh_token ?? null };
  } catch {
    return null;
  }
}

// ─── GET — list events ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") ?? new Date().toISOString();
    const end =
      searchParams.get("end") ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const maxResults = Math.min(parseInt(searchParams.get("maxResults") ?? "50", 10), 250);

    const tokens = await getGoogleTokens();
    if (!tokens) {
      return NextResponse.json({ events: [], connected: false });
    }

    const service = new GoogleCalendarService(tokens.access_token, tokens.refresh_token ?? undefined);

    let rawEvents;
    try {
      rawEvents = await service.listEvents(start, end, maxResults);
    } catch (err: unknown) {
      // If 401, token may be expired — the oauth2 client handles refresh automatically
      // but if it still fails, return disconnected
      const errObj = err as { code?: number; status?: number };
      if (errObj?.code === 401 || errObj?.status === 401) {
        return NextResponse.json({ events: [], connected: false });
      }
      throw err;
    }

    const events = (rawEvents ?? []).map((e) => {
      const startDt = e.start?.dateTime ?? e.start?.date ?? "";
      const endDt = e.end?.dateTime ?? e.end?.date ?? startDt;
      const allDay = !e.start?.dateTime;

      return {
        id: e.id ?? crypto.randomUUID(),
        title: e.summary ?? "(No title)",
        start: startDt,
        end: endDt,
        allDay,
        location: e.location ?? null,
        description: e.description ?? null,
        colour: assignColour(e.summary ?? ""),
      };
    });

    return NextResponse.json({
      events,
      connected: true,
      timezone: "Australia/Sydney",
    });
  } catch (err) {
    console.error("[GET /api/founder/calendar]", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// ─── POST — create event ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, start, end, description, location, attendees } = body as {
      title: string;
      start: string;
      end: string;
      description?: string;
      location?: string;
      attendees?: string[];
    };

    if (!title || !start || !end) {
      return NextResponse.json({ error: "title, start and end are required" }, { status: 400 });
    }

    const tokens = await getGoogleTokens();
    if (!tokens) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 503 });
    }

    const service = new GoogleCalendarService(tokens.access_token, tokens.refresh_token ?? undefined);

    const created = await service.createEvent({
      summary: title,
      description,
      location,
      start: { dateTime: start, timeZone: "Australia/Sydney" },
      end: { dateTime: end, timeZone: "Australia/Sydney" },
      attendees: attendees?.map((email) => ({ email })),
    });

    return NextResponse.json({ success: true, event: created }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/founder/calendar]", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
