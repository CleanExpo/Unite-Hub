/**
 * Scraper Projects List
 * Displays all projects with status
 */

"use client";

import { ScraperProject } from "@/hooks/useScraper";
import { formatDistanceToNow } from "date-fns";

interface Props {
  projects: ScraperProject[];
  loading: boolean;
  error: string | null;
  onCreateClick: () => void;
  onProjectSelect: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Pending" },
  searching: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Searching URLs" },
  scraping: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Scraping" },
  extracting: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Extracting Data" },
  completed: { bg: "bg-success-500/10", text: "text-success-500", label: "Completed" },
  failed: { bg: "bg-error-500/10", text: "text-error-500", label: "Failed" },
};

export function ScraperProjectsList({
  projects,
  loading,
  error,
  onCreateClick,
  onProjectSelect,
  onDeleteProject,
}: Props) {
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-4 animate-spin">
            <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-text-secondary">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-error-500/10 border border-error-500/20 p-6">
        <p className="text-error-500 font-medium">Error loading projects</p>
        <p className="text-text-secondary text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg bg-bg-card border border-border-base p-12 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-accent-500/10">
            <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">No projects yet</h3>
        <p className="text-text-secondary mb-6">Create your first web scraping project to get started</p>
        <button
          onClick={onCreateClick}
          className="px-6 py-3 bg-accent-500 hover:bg-accent-400 text-white rounded-lg font-medium transition-colors"
        >
          Create Project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const status = statusColors[project.status] || statusColors.pending;
          const isCompleted = project.status === "completed";
          const isFailed = project.status === "failed";

          return (
            <div
              key={project.id}
              className="rounded-lg bg-bg-card border border-border-base hover:border-accent-500/50 transition-all hover:shadow-lg hover:shadow-accent-500/10 overflow-hidden group"
            >
              {/* Header */}
              <div className="p-6 border-b border-border-base">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-text-primary flex-1 group-hover:text-accent-500 transition-colors">
                    {project.name}
                  </h3>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                    {status.label}
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">{project.description}</p>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Keywords */}
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {project.keywords.map((kw) => (
                      <span key={kw} className="px-2.5 py-1 rounded bg-accent-500/10 text-accent-400 text-xs font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-bg-hover rounded p-2">
                    <p className="text-2xl font-bold text-accent-500">{project.total_urls_found}</p>
                    <p className="text-xs text-text-secondary">URLs Found</p>
                  </div>
                  <div className="bg-bg-hover rounded p-2">
                    <p className="text-2xl font-bold text-success-500">{project.total_urls_scraped}</p>
                    <p className="text-xs text-text-secondary">Scraped</p>
                  </div>
                  <div className="bg-bg-hover rounded p-2">
                    <p className="text-2xl font-bold text-error-500">{project.total_urls_failed}</p>
                    <p className="text-xs text-text-secondary">Failed</p>
                  </div>
                </div>

                {/* Progress */}
                {!isCompleted && !isFailed && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-semibold text-text-secondary">
                        {project.progress.stage}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {project.progress.current}/{project.progress.total}
                      </p>
                    </div>
                    <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500"
                        style={{
                          width: `${
                            project.progress.total > 0
                              ? (project.progress.current / project.progress.total) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {isFailed && project.error_message && (
                  <div className="bg-error-500/10 rounded p-3 border border-error-500/20">
                    <p className="text-xs text-error-500">{project.error_message}</p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="pt-2 border-t border-border-base">
                  <p className="text-xs text-text-secondary">
                    Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-border-base bg-bg-hover/50 flex gap-2">
                <button
                  onClick={() => onProjectSelect(project.id)}
                  className="flex-1 py-2 px-3 rounded bg-accent-500 hover:bg-accent-400 text-white text-sm font-medium transition-colors"
                >
                  {isCompleted ? "View Results" : "Details"}
                </button>
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="py-2 px-3 rounded border border-border-base hover:border-error-500/50 hover:bg-error-500/5 text-text-secondary hover:text-error-500 text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
