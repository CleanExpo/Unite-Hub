"use client";

import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
import * as playbooksRoute from "@/app/api/guardian/meta/playbooks/route";
import * as readinessRoute from "@/app/api/guardian/meta/readiness/route";
import * as healthRoute from "@/app/api/admin/health/route";
import { getSupabaseServer } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { hasPermission } from "@/lib/auth/permissions";

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock("@/lib/api-helpers", () => ({
  validateUserAndWorkspace: vi.fn().mockResolvedValue({
    userId: "user",
    orgId: "org",
    workspaceId: "workspace",
  }),
}));

vi.mock("@/lib/auth/permissions", () => ({
  hasPermission: vi.fn().mockResolvedValue(true),
}));

const createMockRequest = (search = "?workspaceId=workspace"): NextRequest => {
  const url = new URL(`http://localhost/api${search}`);
  return {
    nextUrl: url,
    headers: new Headers(),
    json: async () => ({}),
  } as unknown as NextRequest;
};

describe("Guardian API contract", () => {
  it("playbooks GET returns 200 + data", async () => {
    const response = await playbooksRoute.GET(createMockRequest());
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toHaveProperty("playbooks");
    expect(supabaseAdmin).toBeTruthy();
    expect(validateUserAndWorkspace).toBeDefined();
    expect(hasPermission).toBeDefined();
  });

  it("readiness GET returns 200 + summary", async () => {
    const mockedSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { computed_at: new Date().toISOString(), overall_guardian_score: 70, overall_status: "operational" },
        error: null,
      }),
    };
    (getSupabaseServer as unknown as vi.MockedFunction<typeof getSupabaseServer>).mockResolvedValueOnce(
      mockedSupabase as any
    );

    const response = await readinessRoute.GET(createMockRequest());
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toHaveProperty("readiness");
  });

  it("admin health GET returns 200 + results", async () => {
    const response = await healthRoute.GET(createMockRequest());
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toHaveProperty("success");
  });
});
