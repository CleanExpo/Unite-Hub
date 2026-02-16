/**
 * Operator Role Service Unit Tests - Phase 10 Week 1-2
 *
 * Tests for operator roles, permissions, and approval rules.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const { mockSupabase } = vi.hoisted(() => {
  const mock: any = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    contains: vi.fn(),
    rpc: vi.fn(),
  };
  mock.from.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.order.mockReturnValue(mock);
  mock.contains.mockReturnValue(mock);
  return { mockSupabase: mock };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

// Import after mocking
import { OperatorRoleService } from "../operator/operatorRoleService";

describe("OperatorRoleService", () => {
  let service: OperatorRoleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OperatorRoleService();

    // Reset mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.contains.mockReturnThis();
  });

  describe("createOperator", () => {
    it("should create OWNER with full permissions", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "op-uuid",
          user_id: "user-uuid",
          organization_id: "org-uuid",
          role: "OWNER",
          can_approve_low: true,
          can_approve_medium: true,
          can_approve_high: true,
          can_execute: true,
          can_rollback: true,
          can_configure_scopes: true,
          can_manage_operators: true,
          daily_approval_limit: 100,
        },
        error: null,
      });

      const operator = await service.createOperator({
        user_id: "user-uuid",
        organization_id: "org-uuid",
        role: "OWNER",
      });

      expect(operator.role).toBe("OWNER");
      expect(operator.can_approve_high).toBe(true);
      expect(operator.can_manage_operators).toBe(true);
      expect(operator.daily_approval_limit).toBe(100);
    });

    it("should create MANAGER with management permissions", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "op-uuid",
          role: "MANAGER",
          can_approve_high: true,
          can_manage_operators: true,
          can_configure_scopes: false,
          daily_approval_limit: 50,
        },
        error: null,
      });

      const operator = await service.createOperator({
        user_id: "user-uuid",
        organization_id: "org-uuid",
        role: "MANAGER",
      });

      expect(operator.role).toBe("MANAGER");
      expect(operator.can_manage_operators).toBe(true);
      expect(operator.can_configure_scopes).toBe(false);
    });

    it("should create ANALYST with limited permissions", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "op-uuid",
          role: "ANALYST",
          can_approve_low: true,
          can_approve_medium: false,
          can_approve_high: false,
          can_execute: false,
          can_manage_operators: false,
          daily_approval_limit: 20,
        },
        error: null,
      });

      const operator = await service.createOperator({
        user_id: "user-uuid",
        organization_id: "org-uuid",
        role: "ANALYST",
      });

      expect(operator.role).toBe("ANALYST");
      expect(operator.can_approve_low).toBe(true);
      expect(operator.can_approve_medium).toBe(false);
      expect(operator.can_approve_high).toBe(false);
      expect(operator.can_execute).toBe(false);
    });

    it("should apply custom domain restrictions", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "op-uuid",
          allowed_domains: ["SEO", "CONTENT"],
        },
        error: null,
      });

      const operator = await service.createOperator({
        user_id: "user-uuid",
        organization_id: "org-uuid",
        role: "ANALYST",
        allowed_domains: ["SEO", "CONTENT"],
      });

      expect(operator.allowed_domains).toEqual(["SEO", "CONTENT"]);
    });
  });

  describe("canApproveProposal", () => {
    it("should allow OWNER to approve HIGH risk", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: true,
          allowed_domains: ["SEO", "CONTENT", "ADS", "CRO"],
          can_approve_high: true,
          approvals_today: 10,
          daily_approval_limit: 100,
        },
        error: null,
      });

      const result = await service.canApproveProposal(
        "user-uuid",
        "org-uuid",
        "HIGH",
        "SEO"
      );

      expect(result.allowed).toBe(true);
    });

    it("should deny ANALYST approving HIGH risk", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: true,
          allowed_domains: ["SEO", "CONTENT", "ADS", "CRO"],
          can_approve_high: false,
          approvals_today: 5,
          daily_approval_limit: 20,
        },
        error: null,
      });

      const result = await service.canApproveProposal(
        "user-uuid",
        "org-uuid",
        "HIGH",
        "SEO"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("HIGH risk");
    });

    it("should deny when daily limit reached", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: true,
          allowed_domains: ["SEO"],
          can_approve_low: true,
          approvals_today: 20,
          daily_approval_limit: 20,
        },
        error: null,
      });

      const result = await service.canApproveProposal(
        "user-uuid",
        "org-uuid",
        "LOW",
        "SEO"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily approval limit");
    });

    it("should deny when domain not allowed", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: true,
          allowed_domains: ["SEO", "CONTENT"],
          can_approve_low: true,
          approvals_today: 0,
          daily_approval_limit: 50,
        },
        error: null,
      });

      const result = await service.canApproveProposal(
        "user-uuid",
        "org-uuid",
        "LOW",
        "ADS"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("No access to ADS");
    });

    it("should deny inactive operator", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: false,
          allowed_domains: ["SEO"],
          can_approve_low: true,
        },
        error: null,
      });

      const result = await service.canApproveProposal(
        "user-uuid",
        "org-uuid",
        "LOW",
        "SEO"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("inactive");
    });

    it("should deny when operator not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const result = await service.canApproveProposal(
        "user-uuid",
        "org-uuid",
        "LOW",
        "SEO"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not found");
    });
  });

  describe("canExecute", () => {
    it("should allow operator with execute permission", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: true,
          can_execute: true,
        },
        error: null,
      });

      const result = await service.canExecute("user-uuid", "org-uuid");

      expect(result.allowed).toBe(true);
    });

    it("should deny operator without execute permission", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: true,
          can_execute: false,
        },
        error: null,
      });

      const result = await service.canExecute("user-uuid", "org-uuid");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("No execution permission");
    });
  });

  describe("canRollback", () => {
    it("should allow operator with rollback permission", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: true,
          can_rollback: true,
        },
        error: null,
      });

      const result = await service.canRollback("user-uuid", "org-uuid");

      expect(result.allowed).toBe(true);
    });

    it("should deny operator without rollback permission", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_active: true,
          can_rollback: false,
        },
        error: null,
      });

      const result = await service.canRollback("user-uuid", "org-uuid");

      expect(result.allowed).toBe(false);
    });
  });

  describe("canManageOperators", () => {
    it("should allow OWNER to manage operators", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          can_manage_operators: true,
        },
        error: null,
      });

      const result = await service.canManageOperators("user-uuid", "org-uuid");

      expect(result.allowed).toBe(true);
    });

    it("should deny ANALYST from managing operators", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          can_manage_operators: false,
        },
        error: null,
      });

      const result = await service.canManageOperators("user-uuid", "org-uuid");

      expect(result.allowed).toBe(false);
    });
  });

  describe("updateRole", () => {
    it("should update role and inherit default permissions", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "op-uuid",
          role: "MANAGER",
          can_approve_high: true,
          can_manage_operators: true,
          can_configure_scopes: false,
          daily_approval_limit: 50,
        },
        error: null,
      });

      const operator = await service.updateRole("op-uuid", "MANAGER");

      expect(operator.role).toBe("MANAGER");
      expect(operator.can_manage_operators).toBe(true);
    });
  });

  describe("getApproversForRisk", () => {
    it("should return operators who can approve LOW risk", async () => {
      // The query chain: from -> select -> eq(org_id) -> eq(is_active) -> contains -> eq(can_approve_low)
      // That's 3 eq calls; the 3rd must resolve (be awaitable)
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.contains.mockReturnThis();
      let eqCallCount = 0;
      mockSupabase.eq.mockImplementation(() => {
        eqCallCount++;
        // The 3rd eq call is the final one (can_approve_low = true)
        if (eqCallCount >= 3) {
          return Promise.resolve({
            data: [
              { user_id: "op-1", role: "OWNER" },
              { user_id: "op-2", role: "ANALYST" },
            ],
            error: null,
          });
        }
        return mockSupabase;
      });

      const approvers = await service.getApproversForRisk("org-uuid", "LOW", "SEO");

      expect(approvers).toHaveLength(2);
    });

    it("should filter by HIGH risk permission", async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.contains.mockReturnThis();
      let eqCallCount = 0;
      mockSupabase.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount >= 3) {
          return Promise.resolve({
            data: [{ user_id: "op-1", role: "OWNER" }],
            error: null,
          });
        }
        return mockSupabase;
      });

      const approvers = await service.getApproversForRisk("org-uuid", "HIGH", "SEO");

      expect(approvers).toHaveLength(1);
    });
  });
});
