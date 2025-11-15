"use client";

import React, { useState, useMemo } from "react";
import { ModernSidebar } from "@/components/layout/ModernSidebar";
import { ProjectCard, ProjectCardGrid } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, FolderOpen, TrendingUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { currentOrganization } = useAuth();
  const orgId = currentOrganization?.org_id || null;
  const { projects: dbProjects, loading, error } = useProjects({ orgId });

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
    <div className="flex min-h-screen bg-gray-50">
      <ModernSidebar userRole="owner" />

      <div className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="h-[70px] bg-white border-b border-gray-200 flex items-center px-8 gap-6">
          <Breadcrumbs items={[{ label: "Projects" }]} />
          <h1 className="text-2xl font-bold text-unite-navy">Projects</h1>

          <div className="flex-1" />

          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button className="bg-gradient-to-r from-unite-teal to-unite-blue text-white gap-2 hover:opacity-90">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </header>

        {/* Content */}
        <main className="p-8">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-unite-teal mx-auto mb-4" />
                <p className="text-gray-600">Loading projects...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Error Loading Projects</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content - Only show when not loading */}
          {!loading && !error && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Projects"
              value={totalProjects.toString()}
              trend={{ value: "+3", label: "this month" }}
              icon={FolderOpen}
              variant="teal"
            />
            <StatsCard
              title="Active Projects"
              value={activeProjects.toString()}
              trend={{ value: `${Math.round((activeProjects / totalProjects) * 100)}%`, label: "of total" }}
              icon={TrendingUp}
              variant="blue"
            />
            <StatsCard
              title="At Risk"
              value={atRiskProjects.toString()}
              trend={{ value: "Need attention", label: "review status" }}
              icon={AlertCircle}
              variant="orange"
            />
            <StatsCard
              title="Completed"
              value={completedProjects.toString()}
              trend={{ value: "+2", label: "this week" }}
              icon={CheckCircle}
              variant="gold"
            />
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
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No projects found</h3>
                  <p className="text-sm text-gray-500">
                    {searchQuery
                      ? `No projects match "${searchQuery}"`
                      : "No projects in this category"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
