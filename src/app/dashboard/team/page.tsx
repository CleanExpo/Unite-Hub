"use client";

import React, { useState } from "react";
import { TeamCapacity } from "@/components/dashboard/TeamCapacity";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Mail, Phone, Calendar, BarChart3, Users, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AddTeamMemberModal } from "@/components/modals/AddTeamMemberModal";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { TeamMemberGridSkeleton } from "@/components/skeletons/TeamMemberSkeleton";
import { StatsGridSkeleton } from "@/components/skeletons/StatsCardSkeleton";

// Helper function to format join date
const formatJoinDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

// Transform database team member to UI format
const transformTeamMember = (member: any) => {
  const capacity = member.capacity_hours > 0 ? Math.round((member.hours_allocated / member.capacity_hours) * 100) : 0;

  return {
    id: member.id,
    name: member.name,
    role: member.role,
    email: member.email,
    phone: member.phone || "N/A",
    avatar: member.avatar_url || "",
    initials: member.initials,
    capacity,
    hoursAllocated: member.hours_allocated,
    hoursAvailable: member.capacity_hours,
    status: member.status as "available" | "near-capacity" | "over-capacity",
    currentProjects: member.current_projects,
    skills: member.skills || [],
    joinDate: formatJoinDate(member.created_at),
  };
};

export default function TeamPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { currentOrganization } = useAuth();
  const { teamMembers: dbTeamMembers, loading, error, refetch } = useTeamMembers(workspaceId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Transform database team members to UI format
  const teamMembers = dbTeamMembers.map(transformTeamMember);

  const availableCount = teamMembers.filter((m) => m.status === "available").length;
  const nearCapacityCount = teamMembers.filter((m) => m.status === "near-capacity").length;
  const overCapacityCount = teamMembers.filter((m) => m.status === "over-capacity").length;
  const totalHours = teamMembers.reduce((sum, m) => sum + m.hoursAllocated, 0);
  const availableHours = teamMembers.reduce((sum, m) => sum + (m.hoursAvailable - m.hoursAllocated), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Team" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Team Management
          </h1>
          <p className="text-white/50">Manage your team members and their capacity</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <>
          <StatsGridSkeleton count={4} />
          <TeamMemberGridSkeleton count={4} />
        </>
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Failed to load team members"
          message={error}
          onRetry={refetch}
        />
      )}

      {/* Content - Only show when not loading */}
      {!loading && !error && (
        <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Members"
              value={teamMembers.length.toString()}
              trend={{ value: "+1", label: "this month" }}
              icon={Users}
              variant="teal"
            />
            <StatsCard
              title="Available"
              value={availableCount.toString()}
              trend={{ value: `${Math.round((availableCount / teamMembers.length) * 100)}%`, label: "of team" }}
              icon={CheckCircle}
              variant="blue"
            />
            <StatsCard
              title="Over Capacity"
              value={overCapacityCount.toString()}
              trend={{ value: "Need help", label: "requires attention" }}
              icon={AlertCircle}
              variant="orange"
            />
            <StatsCard
              title="Available Hours"
              value={availableHours.toString()}
              trend={{ value: `${totalHours}h`, label: "allocated this week" }}
              icon={BarChart3}
              variant="gold"
            />
          </div>

          {/* Team Capacity Card */}
          <div className="mb-8">
            <TeamCapacity members={teamMembers} />
          </div>

          {/* Team Members Grid */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Team Directory
            </h2>
            {teamMembers.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {teamMembers.map((member) => (
                <div key={member.id} className="bg-white/[0.02] border border-white/[0.06] rounded-sm hover:border-white/[0.12] transition-all group">
                  <div className="border-b border-white/[0.06] p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                        <AvatarFallback className="bg-[#00F5FF]/10 text-[#00F5FF] text-lg font-bold">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold mb-1 text-white group-hover:text-[#00F5FF] transition-colors">
                              {member.name}
                            </h3>
                            <p className="text-sm text-white/50">{member.role}</p>
                          </div>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-sm border font-mono",
                              member.status === "available" && "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20",
                              member.status === "near-capacity" && "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20",
                              member.status === "over-capacity" && "bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20"
                            )}
                          >
                            {member.status === "available" && "Available"}
                            {member.status === "near-capacity" && "Near Capacity"}
                            {member.status === "over-capacity" && "Over Capacity"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-[#00F5FF]" />
                        <span className="text-white/70">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-[#FF00FF]" />
                        <span className="text-white/70">{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-[#00F5FF]" />
                        <span className="text-white/70">Joined {member.joinDate}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-white/40 uppercase mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.map((skill: string, i: number) => (
                          <span key={i} className="bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/20 text-xs px-2 py-0.5 rounded-sm font-mono">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-white/40">Weekly Capacity</span>
                        <span className="font-semibold text-white">
                          {member.hoursAllocated}h / {member.hoursAvailable}h
                        </span>
                      </div>
                      <div className="h-2 bg-[#050505] rounded-sm overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-sm transition-all",
                            member.status === "available" && "bg-[#00FF88]",
                            member.status === "near-capacity" && "bg-[#FFB800]",
                            member.status === "over-capacity" && "bg-[#FF4444]"
                          )}
                          style={{ width: `${Math.min(member.capacity, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="pt-4 border-t border-white/[0.06]">
                      <p className="text-sm text-white/40">
                        Currently assigned to <span className="font-semibold text-white">{member.currentProjects}</span> {member.currentProjects === 1 ? "project" : "projects"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex-1">
                        View Projects
                      </button>
                      <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex-1">
                        Assign Work
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No team members yet"
                description="Start building your team by adding your first team member. Invite colleagues and assign them to projects."
                actionLabel="Add Team Member"
                onAction={() => setIsAddModalOpen(true)}
              />
            )}
          </div>
        </>
      )}

      {/* Add Team Member Modal */}
      {workspaceId && currentOrganization && (
        <AddTeamMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          workspaceId={workspaceId}
          organizationId={currentOrganization.org_id}
          onMemberAdded={() => {
            refetch?.();
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
