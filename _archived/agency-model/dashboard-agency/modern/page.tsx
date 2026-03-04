"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  RevenueStatsCard,
  ProjectsStatsCard,
  ClientsStatsCard,
  CompletionStatsCard,
} from "@/components/dashboard/StatsCard";
import { ProjectCard, ProjectCardGrid } from "@/components/dashboard/ProjectCard";
import { ApprovalList } from "@/components/dashboard/ApprovalCard";
import { TeamCapacity } from "@/components/dashboard/TeamCapacity";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";

export default function ModernDashboard() {
  const { session, currentOrganization } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({ contacts: 0, projectCount: 0 });
  const [loading, setLoading] = useState(true);

  const orgId = currentOrganization?.org_id;

  const fetchData = useCallback(async () => {
    if (!orgId || !session?.access_token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${session.access_token}` };

    try {
      const [approvalsRes, projectsRes, teamRes, contactsRes] = await Promise.allSettled([
        fetch(`/api/approvals?orgId=${orgId}&status=pending&pageSize=5`, { headers }),
        fetch(`/api/projects?orgId=${orgId}&pageSize=6`, { headers }),
        fetch(`/api/team?orgId=${orgId}`, { headers }),
        fetch(`/api/contacts?orgId=${orgId}&pageSize=1`, { headers }),
      ]);

      // Approvals
      if (approvalsRes.status === "fulfilled" && approvalsRes.value.ok) {
        const data = await approvalsRes.value.json();
        const raw = data.data?.approvals || data.approvals || [];
        setApprovals(raw.map((a: any) => ({
          id: a.id,
          type: a.type || "document",
          title: a.title,
          client: a.client_name || "",
          submittedBy: {
            name: a.submitted_by_name || "Unknown",
            initials: (a.submitted_by_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2),
          },
          submittedAt: formatRelativeDate(a.created_at),
          priority: a.priority || "medium",
          description: a.description || undefined,
        })));
      }

      // Projects
      if (projectsRes.status === "fulfilled" && projectsRes.value.ok) {
        const data = await projectsRes.value.json();
        const raw = data.data?.projects || data.projects || [];
        setProjects(raw.map((p: any) => ({
          title: p.title,
          client: p.client_name || "",
          status: p.status || "on-track",
          progress: p.progress || 0,
          dueDate: p.due_date
            ? new Date(p.due_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
            : "No due date",
          priority: p.priority || "medium",
          assignees: (p.assignees || []).map((a: any) => ({
            name: a.team_member?.name || "Unknown",
            initials: a.team_member?.initials || "?",
          })),
        })));
        setStats(prev => ({ ...prev, projectCount: data.data?.meta?.totalRecords ?? raw.length }));
      }

      // Team
      if (teamRes.status === "fulfilled" && teamRes.value.ok) {
        const data = await teamRes.value.json();
        const raw = data.data?.teamMembers || data.teamMembers || [];
        setTeamMembers(raw.map((t: any) => {
          const cap = t.capacity_hours > 0
            ? Math.round((t.hours_allocated / t.capacity_hours) * 100)
            : 0;
          return {
            id: t.id,
            name: t.name,
            role: t.role,
            initials: t.initials || t.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2),
            capacity: cap,
            hoursAllocated: t.hours_allocated || 0,
            hoursAvailable: t.capacity_hours || 40,
            status: (cap >= 100 ? "over-capacity" : cap >= 80 ? "near-capacity" : "available") as "over-capacity" | "near-capacity" | "available",
            currentProjects: t.current_projects || 0,
          };
        }));
      }

      // Contacts count
      if (contactsRes.status === "fulfilled" && contactsRes.value.ok) {
        const data = await contactsRes.value.json();
        const total = data.data?.meta?.totalRecords ?? data.meta?.totalRecords ?? 0;
        setStats(prev => ({ ...prev, contacts: total }));
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId, session?.access_token]);

  useEffect(() => {
    if (orgId && session?.access_token) fetchData();
  }, [orgId, session?.access_token, fetchData]);

  const handleApprove = async (id: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      });
      if (res.ok) setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleDecline = async (id: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/approvals/${id}/decline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      });
      if (res.ok) setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to decline:", err);
    }
  };

  const completedProjects = projects.filter(p => p.status === "completed").length;
  const completionPct = projects.length > 0 ? `${Math.round((completedProjects / projects.length) * 100)}%` : "0%";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Modern View" }]} />

      {/* Search and Notifications */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, clients, tasks..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-700/50 text-slate-300 transition-all">
            <Bell className="h-5 w-5" />
            {approvals.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-lg shadow-red-500/50">
                {approvals.length}
              </span>
            )}
          </button>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              PH
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
          Welcome back, Phill
        </h1>
        <p className="text-slate-400">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RevenueStatsCard value="--" />
        <ProjectsStatsCard value={stats.projectCount} />
        <ClientsStatsCard value={stats.contacts} />
        <CompletionStatsCard value={completionPct} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-48 bg-slate-800/30 rounded-lg animate-pulse" />
          ) : (
            <ApprovalList approvals={approvals} onApprove={handleApprove} onDecline={handleDecline} />
          )}
        </div>
        <div className="lg:col-span-1">
          {loading ? (
            <div className="h-48 bg-slate-800/30 rounded-lg animate-pulse" />
          ) : (
            <TeamCapacity members={teamMembers} />
          )}
        </div>
      </div>

      {/* Active Projects */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Active Projects</h2>
          <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20">
            View All Projects
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-slate-800/30 rounded-lg animate-pulse" />)}
          </div>
        ) : projects.length > 0 ? (
          <ProjectCardGrid>
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </ProjectCardGrid>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p>No active projects yet. Create your first project to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}
