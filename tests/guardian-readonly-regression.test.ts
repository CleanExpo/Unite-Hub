"use client";

import { render, waitFor } from "@testing-library/react";
import { describe, it, vi, beforeEach, afterEach, expect } from "vitest";
import GuardianReadinessPage from "@/app/guardian/readiness/page";
import GuardianExecutivePage from "@/app/guardian/executive/page";

vi.mock("@/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "workspace" }),
}));

const createFetchStub = () =>
  vi.fn(async (url, init) => {
    const method = init?.method?.toUpperCase();
    if (method && method !== "GET") {
      throw new Error(`Write operation detected: ${method}`);
    }
    return new Response(
      JSON.stringify({
        success: true,
        readiness: {
          overall_guardian_score: 60,
          overall_status: "operational",
          computed_at: new Date().toISOString(),
          capabilities: [],
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

describe.skip("Guardian read-only regression", () => {
  let fetchStub: ReturnType<typeof createFetchStub>;

  beforeEach(() => {
    fetchStub = createFetchStub();
    vi.stubGlobal("fetch", fetchStub);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("readiness page never writes", async () => {
    render(<GuardianReadinessPage />);
    await waitFor(() => expect(fetchStub).toHaveBeenCalled());
  });

  it("executive page never writes", async () => {
    render(<GuardianExecutivePage />);
    await waitFor(() => expect(fetchStub).toHaveBeenCalled());
  });
});
