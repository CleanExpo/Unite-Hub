"use client";

import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/guardian/meta/readiness/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-helpers", () => ({
  validateUserAndWorkspace: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

describe("Guardian readiness contract", () => {
  it("returns deterministic shape when no data", async () => {
    const req = {
      nextUrl: new URL("http://localhost/api/guardian/meta/readiness?workspaceId=workspace"),
    } as NextRequest;

    const response = await GET(req);
    const payload = await response.json();

    expect(payload).toHaveProperty("readiness");
    expect(payload.readiness).toHaveProperty("overall_guardian_score");
    expect(payload.readiness).toHaveProperty("overall_status");
    expect(payload.readiness).toHaveProperty("computed_at");
    expect(payload.readiness.capabilities).toEqual([]);
  });
});
