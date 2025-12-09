"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/types/database";

interface UseProjectsParams {
  orgId: string | null;
  status?: string;
  category?: string;
  priority?: string;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProjects({ orgId, status, category, priority }: UseProjectsParams): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
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
      if (category) {
params.append("category", category);
}
      if (priority) {
params.append("priority", priority);
}

      const response = await fetch(`/api/projects?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [orgId, status, category, priority]);

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
  };
}
