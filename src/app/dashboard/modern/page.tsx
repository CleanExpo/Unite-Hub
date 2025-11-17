"use client";

import React from "react";
import { ModernSidebar } from "@/components/layout/ModernSidebar";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

// Mock data - replace with real data from Supabase
const mockApprovals = [
  {
    id: "1",
    type: "design" as const,
    title: "Website Redesign Mockups",
    client: "Acme Corporation",
    submittedBy: { name: "Claire Davis", initials: "CD" },
    submittedAt: "2 hours ago",
    priority: "high" as const,
    description: "Final mockups for homepage and product pages",
  },
  {
    id: "2",
    type: "content" as const,
    title: "Q1 Marketing Campaign Copy",
    client: "TechStart Inc",
    submittedBy: { name: "Mike Johnson", initials: "MJ" },
    submittedAt: "5 hours ago",
    priority: "medium" as const,
    description: "Email sequence and landing page content",
  },
  {
    id: "3",
    type: "video" as const,
    title: "Product Demo Video",
    client: "Global Solutions",
    submittedBy: { name: "Sarah Lee", initials: "SL" },
    submittedAt: "1 day ago",
    priority: "high" as const,
  },
];

const mockProjects = [
  {
    title: "Website Redesign",
    client: "Acme Corporation",
    status: "on-track" as const,
    progress: 75,
    dueDate: "Dec 20, 2025",
    priority: "high" as const,
    assignees: [
      { name: "Claire Davis", initials: "CD" },
      { name: "Mike Johnson", initials: "MJ" },
    ],
  },
  {
    title: "Mobile App Development",
    client: "TechStart Inc",
    status: "at-risk" as const,
    progress: 45,
    dueDate: "Jan 15, 2026",
    priority: "high" as const,
    assignees: [
      { name: "Sarah Lee", initials: "SL" },
      { name: "Tom Wilson", initials: "TW" },
      { name: "Emma Brown", initials: "EB" },
    ],
  },
  {
    title: "Brand Identity Package",
    client: "StartUp Co",
    status: "on-track" as const,
    progress: 90,
    dueDate: "Dec 10, 2025",
    priority: "medium" as const,
    assignees: [{ name: "Claire Davis", initials: "CD" }],
  },
];

const mockTeamMembers = [
  {
    id: "1",
    name: "Claire Davis",
    role: "Senior Designer",
    initials: "CD",
    capacity: 85,
    hoursAllocated: 34,
    hoursAvailable: 40,
    status: "near-capacity" as const,
    currentProjects: 3,
  },
  {
    id: "2",
    name: "Mike Johnson",
    role: "Content Strategist",
    initials: "MJ",
    capacity: 60,
    hoursAllocated: 24,
    hoursAvailable: 40,
    status: "available" as const,
    currentProjects: 2,
  },
  {
    id: "3",
    name: "Sarah Lee",
    role: "Video Producer",
    initials: "SL",
    capacity: 105,
    hoursAllocated: 42,
    hoursAvailable: 40,
    status: "over-capacity" as const,
    currentProjects: 4,
  },
  {
    id: "4",
    name: "Tom Wilson",
    role: "Developer",
    initials: "TW",
    capacity: 70,
    hoursAllocated: 28,
    hoursAvailable: 40,
    status: "available" as const,
    currentProjects: 2,
  },
];

export default function ModernDashboard() {
  const handleApprove = async (id: string) => {
    console.log("Approved:", id);
    // Add Supabase integration here
  };

  const handleDecline = async (id: string) => {
    console.log("Declined:", id);
    // Add Supabase integration here
  };

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
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-lg shadow-red-500/50">
              5
            </span>
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
          Welcome back, Phill 👋
        </h1>
        <p className="text-slate-400">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RevenueStatsCard
          value="$45,231"
          trend={{ value: 12.5, isPositive: true, label: "vs last month" }}
        />
        <ProjectsStatsCard
          value={12}
          trend={{ value: 8, isPositive: true, label: "vs last month" }}
        />
        <ClientsStatsCard
          value={48}
          trend={{ value: 3, isPositive: true, label: "new this month" }}
        />
        <CompletionStatsCard
          value="94%"
          trend={{ value: 2, isPositive: true, label: "vs last month" }}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Approvals (2/3 width) */}
        <div className="lg:col-span-2">
          <ApprovalList
            approvals={mockApprovals}
            onApprove={handleApprove}
            onDecline={handleDecline}
          />
        </div>

        {/* Right Column - Team Capacity (1/3 width) */}
        <div className="lg:col-span-1">
          <TeamCapacity members={mockTeamMembers} />
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
        <ProjectCardGrid>
          {mockProjects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </ProjectCardGrid>
      </div>
    </div>
  );
}
