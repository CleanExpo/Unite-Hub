/**
 * useScraper Hook
 * Client-side API calls for scraper projects
 */

import { useState, useCallback, useEffect } from "react";

export interface ScraperProject {
  id: string;
  name: string;
  description?: string;
  seed_url: string;
  keywords: string[];
  status: "pending" | "searching" | "scraping" | "extracting" | "completed" | "failed";
  progress: {
    current: number;
    total: number;
    stage: string;
  };
  total_urls_found: number;
  total_urls_scraped: number;
  total_urls_failed: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ScraperResults {
  allProducts: Array<{
    name: string;
    description?: string;
    price?: string;
    currency?: string;
    imageUrl?: string;
    url?: string;
    features?: string[];
  }>;
  allPricing: Array<{
    name: string;
    price?: string;
    currency?: string;
    features?: string[];
    description?: string;
  }>;
  allImages: Array<{
    url: string;
    altText?: string;
    type?: "product" | "feature" | "logo" | "other";
  }>;
  articleOutline: {
    title: string;
    sections: Array<{
      title: string;
      content: string;
      sources: string[];
    }>;
    highlights: string[];
    callToAction?: string;
  };
}

interface UseScraperState {
  projects: ScraperProject[];
  currentProject: ScraperProject | null;
  results: ScraperResults | null;
  loading: boolean;
  error: string | null;
}

export function useScraper(workspaceId?: string) {
  const [state, setState] = useState<UseScraperState>({
    projects: [],
    currentProject: null,
    results: null,
    loading: false,
    error: null,
  });

  // Get workspace ID from URL or props
  const getWorkspaceId = useCallback(() => {
    if (workspaceId) {
return workspaceId;
}

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("workspaceId");
    }

    return null;
  }, [workspaceId]);

  // List projects
  const listProjects = useCallback(async () => {
    const wid = getWorkspaceId();
    if (!wid) {
      setState((s) => ({ ...s, error: "No workspace ID" }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const response = await fetch(`/api/scraper/projects?workspaceId=${wid}`);
      const data = await response.json();

      setState((s) => ({
        ...s,
        projects: data.data || [],
        loading: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: (err as Error).message,
        loading: false,
      }));
    }
  }, [getWorkspaceId]);

  // Create project
  const createProject = useCallback(
    async (payload: {
      name: string;
      description?: string;
      seedUrl: string;
      keywords: string[];
      maxUrlsToScrape?: number;
      includeImages?: boolean;
      includePricing?: boolean;
    }) => {
      const wid = getWorkspaceId();
      if (!wid) {
        setState((s) => ({ ...s, error: "No workspace ID" }));
        return null;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const response = await fetch(`/api/scraper/projects?workspaceId=${wid}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create project");
        }

        const data = await response.json();
        const project = data.data;

        setState((s) => ({
          ...s,
          currentProject: project,
          projects: [project, ...s.projects],
          loading: false,
        }));

        return project;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: (err as Error).message,
          loading: false,
        }));
        return null;
      }
    },
    [getWorkspaceId]
  );

  // Get project status + results
  const getProject = useCallback(
    async (projectId: string, includePolling = false) => {
      const wid = getWorkspaceId();
      if (!wid) {
        setState((s) => ({ ...s, error: "No workspace ID" }));
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const response = await fetch(
          `/api/scraper/projects/${projectId}?workspaceId=${wid}`
        );
        const data = await response.json();

        setState((s) => ({
          ...s,
          currentProject: data.data.project,
          results: data.data.results,
          loading: false,
        }));

        // Poll if project is still running
        if (includePolling && data.data.project.status !== "completed" && data.data.project.status !== "failed") {
          setTimeout(() => getProject(projectId, true), 3000);
        }
      } catch (err) {
        setState((s) => ({
          ...s,
          error: (err as Error).message,
          loading: false,
        }));
      }
    },
    [getWorkspaceId]
  );

  // Delete project
  const deleteProject = useCallback(
    async (projectId: string) => {
      const wid = getWorkspaceId();
      if (!wid) {
        setState((s) => ({ ...s, error: "No workspace ID" }));
        return false;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const response = await fetch(
          `/api/scraper/projects/${projectId}?workspaceId=${wid}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete project");
        }

        setState((s) => ({
          ...s,
          projects: s.projects.filter((p) => p.id !== projectId),
          currentProject:
            s.currentProject?.id === projectId ? null : s.currentProject,
          loading: false,
        }));

        return true;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: (err as Error).message,
          loading: false,
        }));
        return false;
      }
    },
    [getWorkspaceId]
  );

  return {
    ...state,
    listProjects,
    createProject,
    getProject,
    deleteProject,
  };
}
