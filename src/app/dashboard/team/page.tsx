"use client";

import React from "react";
import { ModernSidebar } from "@/components/layout/ModernSidebar";
import { TeamCapacity } from "@/components/dashboard/TeamCapacity";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, Calendar, BarChart3, Users, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";

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
  const { currentOrganization } = useAuth();
  const orgId = currentOrganization?.org_id || null;
  const { teamMembers: dbTeamMembers, loading, error } = useTeamMembers(orgId);

  // Transform database team members to UI format
  const teamMembers = dbTeamMembers.map(transformTeamMember);

  const availableCount = teamMembers.filter((m) => m.status === "available").length;
  const nearCapacityCount = teamMembers.filter((m) => m.status === "near-capacity").length;
  const overCapacityCount = teamMembers.filter((m) => m.status === "over-capacity").length;
  const totalHours = teamMembers.reduce((sum, m) => sum + m.hoursAllocated, 0);
  const availableHours = teamMembers.reduce((sum, m) => sum + (m.hoursAvailable - m.hoursAllocated), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ModernSidebar userRole="owner" />

      <div className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="h-[70px] bg-white border-b border-gray-200 flex items-center px-8 gap-6">
          <h1 className="text-2xl font-bold text-unite-navy">Team Management</h1>

          <div className="flex-1" />

          <Button className="bg-gradient-to-r from-unite-teal to-unite-blue text-white gap-2 hover:opacity-90">
            <Plus className="h-4 w-4" />
            Add Team Member
          </Button>
        </header>

        {/* Content */}
        <main className="p-8">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-unite-teal mx-auto mb-4" />
                <p className="text-gray-600">Loading team members...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Error Loading Team Members</h3>
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
            <h2 className="text-xl font-bold text-unite-navy mb-6">Team Directory</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teamMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="border-b">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                        <AvatarFallback className="bg-gradient-to-br from-unite-teal to-unite-blue text-white text-lg font-bold">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg mb-1">{member.name}</CardTitle>
                            <p className="text-sm text-gray-600">{member.role}</p>
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
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">Joined {member.joinDate}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-unite-blue/10 text-unite-blue border-unite-blue/20 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Weekly Capacity</span>
                        <span className="font-semibold text-unite-navy">
                          {member.hoursAllocated}h / {member.hoursAvailable}h
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Currently assigned to <span className="font-semibold text-unite-navy">{member.currentProjects}</span> {member.currentProjects === 1 ? "project" : "projects"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Projects
                      </Button>
                      <Button size="sm" className="bg-unite-teal hover:bg-unite-teal/90 text-white flex-1">
                        Assign Work
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
