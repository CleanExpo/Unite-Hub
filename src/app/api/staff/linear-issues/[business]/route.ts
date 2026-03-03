import { NextResponse } from "next/server";

/**
 * GET /api/staff/linear-issues/[business]
 * UNI-1078: Return Linear issue counts for a given business.
 *
 * For "unite-hub" — queries the real Unite-Hub Linear project.
 * For other businesses — returns stub data until they have Linear projects.
 */

const TEAM_ID = "ab9c7810-4dd6-4ce2-8e8f-e1fc94c6b88b";
const UNITE_HUB_PROJECT_ID = "b62d9b14-9d9c-46c7-a3f4-05fbd49550ff";

// Linear project URLs per business (configure when each business has a Linear project)
const LINEAR_PROJECT_URLS: Record<string, string | undefined> = {
  "unite-hub": `https://linear.app/unite-hub/project/unite-hub-af6312a91054/issues`,
  "disaster-recovery": undefined,
  "restore-assist": undefined,
  ato: undefined,
  synthex: undefined,
  "ccw-erp": undefined,
};

// Stub counts for businesses without a Linear project yet
const STUB_COUNTS: Record<string, { open: number; urgent: number; inProgress: number }> = {
  "disaster-recovery": { open: 4, urgent: 1, inProgress: 2 },
  "restore-assist":    { open: 2, urgent: 0, inProgress: 1 },
  ato:                 { open: 6, urgent: 2, inProgress: 0 },
  synthex:             { open: 3, urgent: 0, inProgress: 1 },
  "ccw-erp":           { open: 8, urgent: 3, inProgress: 1 },
};

export interface LinearIssueCounts {
  open: number;
  urgent: number;
  inProgress: number;
  linearUrl: string | null;
  source: "linear" | "stub";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ business: string }> }
) {
  const { business } = await params;

  const linearUrl = LINEAR_PROJECT_URLS[business] ?? null;

  // For non-unite-hub businesses, return stub data (they don't have Linear projects yet)
  if (business !== "unite-hub") {
    const stub = STUB_COUNTS[business];
    if (!stub) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    return NextResponse.json({ ...stub, linearUrl, source: "stub" } satisfies LinearIssueCounts);
  }

  // For unite-hub: query Linear API for real counts
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    // No API key configured — return graceful fallback
    return NextResponse.json({
      open: 0,
      urgent: 0,
      inProgress: 0,
      linearUrl,
      source: "stub",
    } satisfies LinearIssueCounts);
  }

  const query = `{
    team(id: "${TEAM_ID}") {
      issues(
        filter: {
          project: { id: { eq: "${UNITE_HUB_PROJECT_ID}" } }
          state: { type: { nin: ["cancelled", "completed"] } }
        }
        first: 250
        orderBy: createdAt
      ) {
        nodes {
          priority
          state { type }
        }
      }
    }
  }`;

  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 },
    } as RequestInit & { next?: { revalidate?: number } });

    if (!res.ok) {
      throw new Error(`Linear API ${res.status}`);
    }

    const data = await res.json();
    const nodes: Array<{ priority: number; state: { type: string } }> =
      data?.data?.team?.issues?.nodes ?? [];

    const open = nodes.length;
    const urgent = nodes.filter((n) => n.priority === 1).length;
    const inProgress = nodes.filter((n) => n.state.type === "started").length;

    return NextResponse.json({
      open,
      urgent,
      inProgress,
      linearUrl,
      source: "linear",
    } satisfies LinearIssueCounts);
  } catch {
    return NextResponse.json({
      open: 0,
      urgent: 0,
      inProgress: 0,
      linearUrl,
      source: "stub",
    } satisfies LinearIssueCounts);
  }
}
