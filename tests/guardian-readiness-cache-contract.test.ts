import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const supabaseClient = { from: mockFrom };

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServer: () => supabaseClient,
}));

vi.mock("@/lib/core/permissionService", () => ({
  validateUserAndWorkspace: vi.fn(async () => ({
    workspaceId: "workspace-1",
    workspace: { id: "workspace-1" },
    userId: "user-1",
  })),
}));

describe.skip("Guardian readiness cache contract", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockFrom.mockClear();
  });

  it("returns deterministic payload when no readiness data exists", async () => {
    mockSelect.mockResolvedValue({ data: [] });

    const req = new NextRequest(
      "https://example.com/api/guardian/meta/readiness?workspaceId=workspace-1",
      { method: "GET" }
    );

    const { GET } = await import(
      "src/app/api/guardian/meta/readiness/route"
    );

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("max-age=60");

    const payload = await response.json();
    expect(payload).toEqual({
      success: true,
      readiness: null,
    });
  });

  it("returns readiness data when available", async () => {
    const sample = {
      overall_guardian_score: 88,
      overall_status: "operational",
      computed_at: "2025-01-01T00:00:00Z",
    };
    mockSelect.mockResolvedValue({ data: [sample] });

    const req = new NextRequest(
      "https://example.com/api/guardian/meta/readiness?workspaceId=workspace-1",
      { method: "GET" }
    );

    const { GET } = await import(
      "src/app/api/guardian/meta/readiness/route"
    );

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("max-age=60");

    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.readiness).toEqual(expect.objectContaining(sample));
  });
});
