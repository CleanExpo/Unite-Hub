"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * Custom hook to fetch the actual workspace_id from the workspaces table
 * based on the current organization's org_id
 *
 * CRITICAL: This fixes the workspace ID confusion bug where pages were using
 * currentOrganization.org_id instead of the actual workspace_id from the workspaces table
 */
export function useWorkspace() {
  const { currentOrganization, loading: authLoading } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (authLoading) {
        // Wait for auth to finish loading
        return;
      }

      if (!currentOrganization?.org_id) {
        console.error("[useWorkspace] No organization selected");
        setWorkspaceId(null);
        setLoading(false);
        setError("No organization selected");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch the workspace from the workspaces table using org_id
        const { data, error: fetchError } = await supabaseBrowser
          .from("workspaces")
          .select("id")
          .eq("org_id", currentOrganization.org_id)
          .single();

        if (fetchError) {
          console.error("[useWorkspace] Error fetching workspace:", fetchError);
          setError(fetchError.message);
          setWorkspaceId(null);
          setLoading(false);
          return;
        }

        if (!data) {
          console.error("[useWorkspace] No workspace found for org_id:", currentOrganization.org_id);
          setError("No workspace found");
          setWorkspaceId(null);
          setLoading(false);
          return;
        }

        console.log("[useWorkspace] Workspace fetched:", data.id);
        setWorkspaceId(data.id);
        setLoading(false);
      } catch (err) {
        console.error("[useWorkspace] Unexpected error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setWorkspaceId(null);
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [currentOrganization?.org_id, authLoading]);

  return {
    workspaceId,
    workspace: workspaceId ? { id: workspaceId } : null,
    loading: loading || authLoading,
    error,
  };
}
