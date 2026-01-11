/**
 * Scraper Dashboard
 * Main container for web scraper UI
 */

"use client";

import { useState, useEffect } from "react";
import { useScraper } from "@/hooks/useScraper";
import { ScraperProjectsList } from "./ScraperProjectsList";
import { ScraperCreateForm } from "./ScraperCreateForm";
import { ScraperProjectDetail } from "./ScraperProjectDetail";

export function ScraperDashboard() {
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const scraper = useScraper();

  // Load projects on mount
  useEffect(() => {
    scraper.listProjects();
  }, [scraper]);

  const handleCreateClick = () => {
    setView("create");
  };

  const handleProjectSelect = (projectId: string) => {
    scraper.getProject(projectId, true); // Enable polling
    setView("detail");
  };

  const handleProjectCreated = (projectId: string) => {
    scraper.getProject(projectId, true);
    setView("detail");
  };

  const handleBackToList = () => {
    scraper.listProjects();
    setView("list");
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("Delete this project? This cannot be undone.")) {
      await scraper.deleteProject(projectId);
      handleBackToList();
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Header */}
      <div className="border-b border-border-base bg-bg-raised py-6 px-5 md:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">Web Scraper</h1>
            {view !== "create" && (
              <button
                onClick={handleCreateClick}
                className="px-4 py-2 bg-accent-500 hover:bg-accent-400 text-white rounded-lg font-medium transition-colors"
              >
                + New Project
              </button>
            )}
          </div>
          <p className="text-text-secondary">
            Discover URLs, scrape content, extract data for article research
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-8">
        {view === "list" && (
          <ScraperProjectsList
            projects={scraper.projects}
            loading={scraper.loading}
            error={scraper.error}
            onCreateClick={handleCreateClick}
            onProjectSelect={handleProjectSelect}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {view === "create" && (
          <ScraperCreateForm
            loading={scraper.loading}
            error={scraper.error}
            onSuccess={handleProjectCreated}
            onCancel={handleBackToList}
            onCreate={scraper.createProject}
          />
        )}

        {view === "detail" && scraper.currentProject && (
          <ScraperProjectDetail
            project={scraper.currentProject}
            results={scraper.results}
            loading={scraper.loading}
            onBack={handleBackToList}
            onDelete={() => handleDeleteProject(scraper.currentProject!.id)}
          />
        )}
      </div>
    </div>
  );
}
