"use client";

import { useState, useEffect } from "react";
import type { Approval } from "@/types/database";

interface UseApprovalsParams {
  orgId: string | null;
  status?: string;
  priority?: string;
  type?: string;
}

interface UseApprovalsReturn {
  approvals: Approval[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  approve: (id: string, reviewedById: string) => Promise<void>;
  decline: (id: string, reviewedById: string, reason?: string) => Promise<void>;
}

export function useApprovals({ orgId, status, priority, type }: UseApprovalsParams): UseApprovalsReturn {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({ orgId });
      if (status) {
params.append("status", status);
}
      if (priority) {
params.append("priority", priority);
}
      if (type) {
params.append("type", type);
}

      const response = await fetch(`/api/approvals?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch approvals: ${response.statusText}`);
      }

      const data = await response.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error("Error fetching approvals:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch approvals");
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string, reviewedById: string) => {
    try {
      const response = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedById }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve: ${response.statusText}`);
      }

      // Refresh the list
      await fetchApprovals();
    } catch (err) {
      console.error("Error approving:", err);
      throw err;
    }
  };

  const decline = async (id: string, reviewedById: string, reason?: string) => {
    try {
      const response = await fetch(`/api/approvals/${id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedById, reason: reason || "Needs revisions" }),
      });

      if (!response.ok) {
        throw new Error(`Failed to decline: ${response.statusText}`);
      }

      // Refresh the list
      await fetchApprovals();
    } catch (err) {
      console.error("Error declining:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [orgId, status, priority, type]);

  return {
    approvals,
    loading,
    error,
    refresh: fetchApprovals,
    approve,
    decline,
  };
}
