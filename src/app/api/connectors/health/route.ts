import { NextResponse } from "next/server";

// ─── Platform registry ─────────────────────────────────────────────────────────

const PLATFORMS: { id: string; url: string }[] = [
  {
    id: "disaster-recovery",
    url: process.env.NEXT_PUBLIC_DR_URL || "https://disaster-recovery.unitegroupau.com",
  },
  {
    id: "nrpg",
    url: process.env.NEXT_PUBLIC_NRPG_URL || "https://nrpg.unitegroupau.com",
  },
  {
    id: "carsi",
    url: process.env.NEXT_PUBLIC_CARSI_URL || "https://carsi.unitegroupau.com",
  },
  {
    id: "restore-assist",
    url: process.env.NEXT_PUBLIC_RESTORE_URL || "https://restoreassist.unitegroupau.com",
  },
  {
    id: "synthex",
    url: process.env.NEXT_PUBLIC_SYNTHEX_URL || "https://synthex.unitegroupau.com",
  },
];

const TIMEOUT_MS = 3000;

// ─── Probe a single platform URL ──────────────────────────────────────────────

async function probePlatform(url: string): Promise<"healthy" | "unknown"> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      // Prevent caching — we want a live check each time
      headers: { "Cache-Control": "no-cache" },
    });

    clearTimeout(timer);

    // Any 2xx or 3xx response indicates the platform is reachable
    return res.status < 500 ? "healthy" : "unknown";
  } catch {
    // Timeout, DNS failure, network error — treat as unknown not "down"
    // so transient issues don't trigger red alerts
    return "unknown";
  }
}

// ─── GET /api/connectors/health ───────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  // Probe all platforms concurrently
  const results = await Promise.all(
    PLATFORMS.map(async platform => ({
      id: platform.id,
      status: await probePlatform(platform.url),
    })),
  );

  const statusMap: Record<string, string> = {};
  for (const { id, status } of results) {
    statusMap[id] = status;
  }

  return NextResponse.json(statusMap, {
    headers: {
      // Cache for 30 s to avoid hammering external URLs
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
  });
}
