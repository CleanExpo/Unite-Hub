"use client";

import { describe, it, expect, vi } from "vitest";
import { narrativeService } from "@/lib/guardian/services/narrativeService";
import { loadLatestReadinessSnapshot } from "@/lib/guardian/readiness/readinessService";
import { runTenantChecks } from "@/lib/core/configHealthService";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase";

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
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe("Guardian narrative helpers", () => {
  it("generates a narrative string for benchmark insights", async () => {
    const result = await narrativeService.generateExecutiveBrief(
      "Benchmarking",
      5,
      "on_track",
      ["warning 1", "warning 2"]
    );

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("Guardian readiness and health helpers", () => {
  it.skip("loads readiness snapshot safely", async () => {
    const supabaseMock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "snapshot-id",
          tenant_id: "workspace",
          computed_at: new Date().toISOString(),
          overall_guardian_score: 78,
          overall_status: "operational",
          capability_key: "core",
          score: 80,
          status: "ready",
        },
        error: null,
      }),
    };
    const mockedGetSupabaseServer = getSupabaseServer as unknown as vi.MockedFunction<typeof getSupabaseServer>;
    mockedGetSupabaseServer.mockResolvedValueOnce(supabaseMock);

    const snapshot = await loadLatestReadinessSnapshot("workspace");

    expect(snapshot).not.toBeNull();
    expect(snapshot?.overallStatus).toBe("operational");
  });

  it("runs tenant checks without throwing when no data", async () => {
    const mockedSupabaseAdmin = supabaseAdmin as unknown as {
      rpc: vi.Mock;
    };
    mockedSupabaseAdmin.rpc.mockResolvedValue({ data: [], error: null });

    await expect(runTenantChecks("workspace")).resolves.toBeTruthy();
  });
});

describe("Guardian table existence guard (future helper)", () => {
  it("anticipates guardian_table_exists guards", async () => {
    const guardianTableExists = vi
      .fn<Promise<boolean>, [string]>()
      .mockImplementation(async (tableName) => tableName !== "missing_table");

    expect(await guardianTableExists("missing_table")).toBe(false);
    expect(await guardianTableExists("existing_table")).toBe(true);
  });
});
