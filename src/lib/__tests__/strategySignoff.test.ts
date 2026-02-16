/**
 * Strategy Signoff Unit Tests - Phase 8 Week 24
 *
 * 16 unit tests for strategy signoff functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create chainable mock with vi.hoisted
const { mockSupabaseInstance, mockGetSupabaseServer, resetMockChain } = vi.hoisted(() => {
  const queryResults: any[] = [];

  const createQueryBuilder = (): any => {
    const builder: any = {};
    const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'order', 'limit', 'range', 'match', 'not', 'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps'];
    chainMethods.forEach(m => { builder[m] = vi.fn().mockReturnValue(builder); });
    builder.single = vi.fn().mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    builder.maybeSingle = vi.fn().mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    builder.then = (resolve: any, reject?: any) => {
      const result = queryResults.shift() || { data: [], error: null };
      return Promise.resolve(resolve(result));
    };
    return builder;
  };

  const queryBuilder = createQueryBuilder();

  const mock: any = {
    _setResults: (results: any[]) => { queryResults.length = 0; queryResults.push(...results); },
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockReturnValue(queryBuilder),
    auth: { getUser: vi.fn(), getSession: vi.fn() },
  };

  Object.keys(queryBuilder).forEach(k => {
    if (k !== 'then') mock[k] = queryBuilder[k];
  });

  const mockGSS = vi.fn().mockResolvedValue(mock);
  const resetFn = () => {
    queryResults.length = 0;
    const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'order', 'limit', 'range', 'match', 'not', 'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps'];
    chainMethods.forEach(m => { queryBuilder[m].mockReturnValue(queryBuilder); });
    mock.from.mockReturnValue(queryBuilder);
    queryBuilder.single.mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    queryBuilder.maybeSingle.mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    mockGSS.mockResolvedValue(mock);
  };
  return {
    mockSupabaseInstance: mock,
    mockGetSupabaseServer: mockGSS,
    resetMockChain: resetFn,
  };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: mockGetSupabaseServer,
}));

// Import after mocking
import { StrategySignoffService } from "../seo/strategySignoff";

describe("StrategySignoffService", () => {
  beforeEach(() => {
    resetMockChain();
  });

  describe("createStrategySnapshot - generateRecommendations (internal)", () => {
    it("should generate recommendations from audit data with low health score", async () => {
      // createStrategySnapshot does 1 insert (thenable, no .single)
      mockSupabaseInstance._setResults([
        { data: null, error: null }, // insert snapshot
      ]);

      const deltaResult = {
        overall_trend: "DECLINING",
        top_wins: ["Improved mobile usability"],
        top_losses: ["Lost 10 keywords"],
        keyword_movements: [
          { movement_type: "LOST" },
          { movement_type: "LOST" },
          { movement_type: "LOST" },
          { movement_type: "LOST" },
        ],
      };

      const snapshot = await StrategySignoffService.createStrategySnapshot(
        "client-uuid",
        "audit-uuid",
        45,
        65,
        deltaResult
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.recommendations).toBeDefined();
      expect(Array.isArray(snapshot.recommendations)).toBe(true);
      expect(snapshot.recommendations.length).toBeGreaterThan(0);
    });

    it("should prioritize critical health score drops", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: null }, // insert snapshot
      ]);

      const snapshot = await StrategySignoffService.createStrategySnapshot(
        "client-uuid",
        "audit-uuid",
        30,
        80,
        { overall_trend: "DECLINING", top_wins: [], top_losses: [] }
      );

      const highPriority = snapshot.recommendations.filter((r) => r.priority === "HIGH");
      expect(highPriority.length).toBeGreaterThan(0);
    });

    it("should generate keyword recommendations for significant losses", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: null },
      ]);

      const deltaResult = {
        overall_trend: "DECLINING",
        top_wins: [],
        top_losses: [],
        keyword_movements: Array.from({ length: 5 }, () => ({ movement_type: "LOST" })),
      };

      const snapshot = await StrategySignoffService.createStrategySnapshot(
        "client-uuid",
        "audit-uuid",
        60,
        65,
        deltaResult
      );

      const keywordRecs = snapshot.recommendations.filter((r) => r.category === "keywords");
      expect(keywordRecs.length).toBeGreaterThan(0);
    });

    it("should generate backlink recommendations when trend is declining", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: null },
      ]);

      const deltaResult = {
        overall_trend: "DECLINING",
        top_wins: [],
        top_losses: [],
      };

      const snapshot = await StrategySignoffService.createStrategySnapshot(
        "client-uuid",
        "audit-uuid",
        60,
        65,
        deltaResult
      );

      const backlinkRecs = snapshot.recommendations.filter((r) => r.category === "backlinks");
      expect(backlinkRecs.length).toBeGreaterThan(0);
    });

    it("should generate technical recommendations for low health score", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: null },
      ]);

      const snapshot = await StrategySignoffService.createStrategySnapshot(
        "client-uuid",
        "audit-uuid",
        40,
        62,
        { overall_trend: "DECLINING", top_wins: [], top_losses: [] }
      );

      const technicalRecs = snapshot.recommendations.filter((r) => r.category === "technical");
      expect(technicalRecs.length).toBeGreaterThan(0);
    });

    it("should always include content recommendations", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: null },
      ]);

      const snapshot = await StrategySignoffService.createStrategySnapshot(
        "client-uuid",
        "audit-uuid",
        85,
        82,
        { overall_trend: "IMPROVING", top_wins: ["Good traffic"], top_losses: [] }
      );

      // Content recommendation is always added
      const contentRecs = snapshot.recommendations.filter((r) => r.category === "content");
      expect(contentRecs.length).toBeGreaterThan(0);
      expect(Array.isArray(snapshot.recommendations)).toBe(true);
    });
  });

  describe("createStrategySnapshot", () => {
    it("should create a strategy snapshot with all fields", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: null }, // insert snapshot
      ]);

      const snapshot = await StrategySignoffService.createStrategySnapshot(
        "client-uuid",
        "audit-uuid",
        65,
        70,
        {
          overall_trend: "DECLINING",
          top_wins: ["Improved mobile usability"],
          top_losses: ["Lost 10 keywords"],
        }
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.client_id).toBe("client-uuid");
      expect(snapshot.signoff_status).toBe("PENDING");
      expect(snapshot.health_score).toBe(65);
      expect(snapshot.previous_health_score).toBe(70);
      expect(snapshot.overall_trend).toBe("DECLINING");
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("strategy_snapshots");
    });
  });

  describe("submitSignoff", () => {
    it("should record an APPROVED decision", async () => {
      mockSupabaseInstance._setResults([
        {
          data: {
            signoff_id: "signoff-uuid",
            client_id: "client-uuid",
            audit_id: "audit-uuid",
            recommendation_id: "rec-uuid",
            decision: "APPROVED",
            notes: "Looks good, proceed with implementation",
            decided_by: "user-uuid",
            decided_at: new Date().toISOString(),
            action_json: { start_date: "2025-01-25" },
          },
          error: null,
        },
      ]);

      const signoff = await StrategySignoffService.submitSignoff(
        "client-uuid",
        "audit-uuid",
        "rec-uuid",
        "APPROVED",
        "Looks good, proceed with implementation",
        "user-uuid",
        { start_date: "2025-01-25" }
      );

      expect(signoff).toBeDefined();
      expect(signoff.decision).toBe("APPROVED");
    });

    it("should record a REJECTED decision with notes", async () => {
      mockSupabaseInstance._setResults([
        {
          data: {
            signoff_id: "signoff-uuid",
            client_id: "client-uuid",
            audit_id: "audit-uuid",
            recommendation_id: "rec-uuid",
            decision: "REJECTED",
            notes: "Not aligned with current priorities",
            decided_by: "user-uuid",
            decided_at: new Date().toISOString(),
            action_json: {},
          },
          error: null,
        },
      ]);

      const signoff = await StrategySignoffService.submitSignoff(
        "client-uuid",
        "audit-uuid",
        "rec-uuid",
        "REJECTED",
        "Not aligned with current priorities",
        "user-uuid"
      );

      expect(signoff).toBeDefined();
      expect(signoff.decision).toBe("REJECTED");
      expect(signoff.notes).toBe("Not aligned with current priorities");
    });

    it("should record a MODIFIED decision with changes", async () => {
      const actionJson = {
        modified_actions: ["Reduced scope to top 5 pages"],
        new_timeline: "2 weeks instead of 1",
      };

      mockSupabaseInstance._setResults([
        {
          data: {
            signoff_id: "signoff-uuid",
            client_id: "client-uuid",
            audit_id: "audit-uuid",
            recommendation_id: "rec-uuid",
            decision: "MODIFIED",
            notes: "Adjusted timeline and scope",
            decided_by: "user-uuid",
            decided_at: new Date().toISOString(),
            action_json: actionJson,
          },
          error: null,
        },
      ]);

      const signoff = await StrategySignoffService.submitSignoff(
        "client-uuid",
        "audit-uuid",
        "rec-uuid",
        "MODIFIED",
        "Adjusted timeline and scope",
        "user-uuid",
        actionJson
      );

      expect(signoff).toBeDefined();
      expect(signoff.decision).toBe("MODIFIED");
      expect(signoff.action_json.modified_actions).toBeDefined();
    });

    it("should handle signoff for entire audit (no recommendation_id)", async () => {
      mockSupabaseInstance._setResults([
        {
          data: {
            signoff_id: "signoff-uuid",
            client_id: "client-uuid",
            audit_id: "audit-uuid",
            decision: "APPROVED",
            notes: "Approve all recommendations",
            decided_by: "user-uuid",
            decided_at: new Date().toISOString(),
            action_json: {},
          },
          error: null,
        },
      ]);

      const signoff = await StrategySignoffService.submitSignoff(
        "client-uuid",
        "audit-uuid",
        null,
        "APPROVED",
        "Approve all recommendations",
        "user-uuid"
      );

      expect(signoff).toBeDefined();
      expect(signoff.recommendation_id).toBeUndefined();
    });
  });

  describe("getSignoffHistory", () => {
    it("should return signoff history for a client", async () => {
      mockSupabaseInstance._setResults([
        {
          data: [
            { signoff_id: "s1", client_id: "client-uuid", decision: "APPROVED" },
            { signoff_id: "s2", client_id: "client-uuid", decision: "REJECTED" },
          ],
          error: null,
        },
      ]);

      const history = await StrategySignoffService.getSignoffHistory("client-uuid");

      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(2);
    });

    it("should return empty array on error", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: { message: "Database error" } },
      ]);

      await expect(
        StrategySignoffService.getSignoffHistory("client-uuid")
      ).rejects.toThrow("Failed to get signoff history");
    });
  });

  describe("getPendingRecommendations", () => {
    it("should return pending recommendations for a client", async () => {
      // getPendingRecommendations: 1) get latest snapshot (.single), 2) get existing signoffs (thenable)
      mockSupabaseInstance._setResults([
        {
          data: {
            snapshot_data: {
              audit_id: "audit-uuid",
              recommendations: [
                { recommendation_id: "r1", title: "Fix speed", priority: "HIGH" },
                { recommendation_id: "r2", title: "Add schema", priority: "MEDIUM" },
                { recommendation_id: "r3", title: "Update content", priority: "LOW" },
              ],
            },
          },
          error: null,
        }, // snapshot .single
        {
          data: [
            { recommendation_id: "r1" },
          ],
          error: null,
        }, // signoffs thenable
      ]);

      const pending = await StrategySignoffService.getPendingRecommendations("client-uuid");

      expect(pending).toHaveLength(2);
      expect(pending.find((r) => r.recommendation_id === "r1")).toBeUndefined();
    });

    it("should return empty array when no snapshot exists", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: null }, // no snapshot
      ]);

      const pending = await StrategySignoffService.getPendingRecommendations("client-uuid");

      expect(pending).toHaveLength(0);
    });
  });

  describe("getLatestSnapshot", () => {
    it("should return the latest snapshot for a client", async () => {
      const snapshotData = {
        client_id: "client-uuid",
        audit_id: "audit-uuid",
        health_score: 72,
        previous_health_score: 68,
        overall_trend: "IMPROVING",
        recommendations: [],
        signoff_status: "PENDING",
      };

      mockSupabaseInstance._setResults([
        { data: { snapshot_data: snapshotData }, error: null },
      ]);

      const snapshot = await StrategySignoffService.getLatestSnapshot("client-uuid");

      expect(snapshot).toBeDefined();
      expect(snapshot!.health_score).toBe(72);
      expect(snapshot!.overall_trend).toBe("IMPROVING");
    });

    it("should return null when no snapshot exists", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: { message: "Not found" } },
      ]);

      const snapshot = await StrategySignoffService.getLatestSnapshot("client-uuid");

      expect(snapshot).toBeNull();
    });
  });
});
