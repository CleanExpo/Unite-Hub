"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ModernSidebar } from "@/components/layout/ModernSidebar";
import { ProjectCard, ProjectCardGrid } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, FolderOpen, TrendingUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCardGridSkeleton } from "@/components/skeletons/ProjectCardSkeleton";
import { StatsGridSkeleton } from "@/components/skeletons/StatsCardSkeleton";

// Helper function to format due date
const formatDueDate = (dateString: string | null) => {
  if (!dateString) return "No due date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Transform database project to UI format
const transformProject = (project: any) => {
  return {
    id: project.id,
    title: project.title,
    client: project.client_name,
    status: project.status as "on-track" | "at-risk" | "delayed" | "completed",
    progress: project.progress,
    dueDate: project.completed_date
      ? `Completed ${formatDueDate(project.completed_date)}`
      : formatDueDate(project.due_date),
    priority: project.priority as "high" | "medium" | "low",
    assignees: (project.assignees || []).map((assignee: any) => ({
      name: assignee.name,
      initials: assignee.initials,
    })),
    category: project.category,
  };
};

export default function ProjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { projects: dbProjects, loading, error, refetch } = useProjects({ orgId: workspaceId });

  // Transform database projects to UI format
  const allProjects = useMemo(() => dbProjects.map(transformProject), [dbProjects]);

  // Filter projects based on tab and search
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && project.category === "active") ||
        (activeTab === "at-risk" && project.category === "at-risk") ||
        (activeTab === "completed" && project.category === "completed");

      const matchesSearch =
        searchQuery === "" ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [allProjects, activeTab, searchQuery]);

  // Stats
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter((p) => p.category === "active").length;
  const atRiskProjects = allProjects.filter((p) => p.category === "at-risk").length;
  const completedProjects = allProjects.filter((p) => p.category === "completed").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Projects" }]} />

      {/* Header */}
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Projects
          </h1>
          <p className="text-white/50">Manage and track your client projects</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/40"
            />
          </div>

          <button
            onClick={() => router.push("/dashboard/projects/new")}
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>
      {/* Loading State */}
      {loading && (
        <>
          <StatsGridSkeleton count={4} />
          <ProjectCardGridSkeleton count={6} />
        </>
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Failed to load projects"
          message={error}
          onRetry={refetch}
        />
      )}

      {/* Content - Only show when not loading */}
      {!loading && !error && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/[0.02] rounded-sm border border-white/[0.06] p-6 group">
              <div className="flex items-center gap-3 mb-3">
                <FolderOpen className="h-8 w-8 text-[#00F5FF]" />
                <h3 className="text-white/50 text-sm font-medium">Total Projects</h3>
              </div>
              <p className="text-3xl font-bold text-[#00F5FF]">
                {totalProjects}
              </p>
              <p className="text-white/40 text-xs mt-2">+3 this month</p>
            </div>

            <div className="bg-white/[0.02] rounded-sm border border-white/[0.06] p-6 group">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="h-8 w-8 text-[#00FF88]" />
                <h3 className="text-white/50 text-sm font-medium">Active Projects</h3>
              </div>
              <p className="text-3xl font-bold text-[#00FF88]">
                {activeProjects}
              </p>
              <p className="text-white/40 text-xs mt-2">{totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}% of total</p>
            </div>

            <div className="bg-white/[0.02] rounded-sm border border-white/[0.06] p-6 group">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-8 w-8 text-[#FFB800]" />
                <h3 className="text-white/50 text-sm font-medium">At Risk</h3>
              </div>
              <p className="text-3xl font-bold text-[#FFB800]">
                {atRiskProjects}
              </p>
              <p className="text-white/40 text-xs mt-2">Need attention</p>
            </div>

            <div className="bg-white/[0.02] rounded-sm border border-white/[0.06] p-6 group">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-8 w-8 text-[#FF00FF]" />
                <h3 className="text-white/50 text-sm font-medium">Completed</h3>
              </div>
              <p className="text-3xl font-bold text-[#FF00FF]">
                {completedProjects}
              </p>
              <p className="text-white/40 text-xs mt-2">+2 this week</p>
            </div>
          </div>

          {/* Tabs and Projects Grid */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All Projects ({allProjects.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({allProjects.filter((p) => p.category === "active").length})
              </TabsTrigger>
              <TabsTrigger value="at-risk">
                At Risk ({allProjects.filter((p) => p.category === "at-risk").length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({allProjects.filter((p) => p.category === "completed").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredProjects.length > 0 ? (
                <ProjectCardGrid>
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      title={project.title}
                      client={project.client}
                      status={project.status}
                      progress={project.progress}
                      dueDate={project.dueDate}
                      priority={project.priority}
                      assignees={project.assignees}
                    />
                  ))}
                </ProjectCardGrid>
              ) : (
                <EmptyState
                  icon={FolderOpen}
                  title="No projects found"
                  description={
                    searchQuery
                      ? `No projects match "${searchQuery}"`
                      : "No projects in this category. Create your first project to get started."
                  }
                  actionLabel={!searchQuery ? "New Project" : undefined}
                  onAction={!searchQuery ? () => router.push("/dashboard/projects/new") : undefined}
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
