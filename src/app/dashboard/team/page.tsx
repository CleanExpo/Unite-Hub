"use client";

import React, { useState } from "react";
import { TeamCapacity } from "@/components/dashboard/TeamCapacity";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, Calendar, BarChart3, Users, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Team Management
          </h1>
          <p className="text-slate-400">Manage your team members and their capacity</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </Button>
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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6">
              Team Directory
            </h2>
            {teamMembers.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {teamMembers.map((member) => (
                <Card key={member.id} className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all group">
                  <CardHeader className="border-b border-slate-700/50">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg mb-1 text-white group-hover:text-blue-400 transition-colors">
                              {member.name}
                            </CardTitle>
                            <p className="text-sm text-slate-400">{member.role}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              member.status === "available" && "bg-green-100 text-green-700 border-green-200",
                              member.status === "near-capacity" && "bg-yellow-100 text-yellow-700 border-yellow-200",
                              member.status === "over-capacity" && "bg-red-100 text-red-700 border-red-200"
                            )}
                          >
                            {member.status === "available" && "Available"}
                            {member.status === "near-capacity" && "Near Capacity"}
                            {member.status === "over-capacity" && "Over Capacity"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-300">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-300">{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-cyan-400" />
                        <span className="text-slate-300">Joined {member.joinDate}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">Weekly Capacity</span>
                        <span className="font-semibold text-white">
                          {member.hoursAllocated}h / {member.hoursAvailable}h
                        </span>
                      </div>
                      <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            member.status === "available" && "bg-green-500",
                            member.status === "near-capacity" && "bg-yellow-500",
                            member.status === "over-capacity" && "bg-red-500"
                          )}
                          style={{ width: `${Math.min(member.capacity, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="pt-4 border-t border-slate-700/50">
                      <p className="text-sm text-slate-400">
                        Currently assigned to <span className="font-semibold text-white">{member.currentProjects}</span> {member.currentProjects === 1 ? "project" : "projects"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50">
                        View Projects
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 flex-1">
                        Assign Work
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
