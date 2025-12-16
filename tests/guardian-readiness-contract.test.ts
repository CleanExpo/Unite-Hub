"use client";

import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/guardian/meta/readiness/route";
import { NextRequest } from "next/server";
import { createMockSupabaseServer } from "./__mocks__/guardianSupabase.mock";

vi.mock("@/lib/api-helpers", () => ({
  validateUserAndWorkspace: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn(() => createMockSupabaseServer()),
}));

describe("Guardian readiness contract", () => {
  it("returns deterministic shape when no data", async () => {
    const req = {
      nextUrl: new URL("http://localhost/api/guardian/meta/readiness?workspaceId=workspace"),
    } as NextRequest;

    const response = await GET(req);
    const payload = await response.json();

    expect(payload).toHaveProperty("success");
    expect(payload.success).toBe(true);
    expect(payload).toHaveProperty("readiness");
    // When no readiness data exists, readiness is null
    expect(payload.readiness).toBeNull();
  });
});
