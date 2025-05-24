"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabaseClient } from "@/lib/supabase/client"

interface TeamMember {
  id: string
  project_id: string
  profile_id: string
  role: string
  created_at: string
  profile: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    email: string
  }
}

interface Project {
  id: string
  name: string
  owner_id: string
}

export default function ProjectTeamPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProjectAndTeam = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is authenticated
        const { data: authData, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !authData.user) {
          router.push("/login")
          return
        }

        setCurrentUser(authData.user)

        // Fetch project details
        const { data: projectData, error: projectError } = await supabaseClient
          .from("projects")
          .select("*")
          .eq("id", params.id)
          .single()

        if (projectError) {
          throw projectError
        }

        setProject(projectData)
        setIsOwner(projectData.owner_id === authData.user.id)

        // Fetch team members
        const { data: teamData, error: teamError } = await supabaseClient
          .from("project_members")
          .select(
            `
            *,
            profile:profiles(id, first_name, last_name, avatar_url, email)
          `,
          )
          .eq("project_id", params.id)
          .order("created_at", { ascending: false })

        if (teamError) {
          throw teamError
        }

        setTeamMembers(teamData || [])
      } catch (error: any) {
        console.error("Error fetching project team:", error)
        setError(error.message || "Failed to load project team")
      } finally {
        setLoading(false)
      }
    }

    fetchProjectAndTeam()
  }, [params.id, router])

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)

    try {
      if (!inviteEmail.trim()) {
        throw new Error("Email is required")
      }

      if (!project) {
        throw new Error("Project not found")
      }

      // Check if user exists
      const { data: userData, error: userError } = await supabaseClient
        .from("profiles")
        .select("id, email")
        .ilike("email", inviteEmail.trim())
        .single()

      if (userError) {
        throw new Error("User with this email not found")
      }

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabaseClient
        .from("project_members")
        .select("id")
        .eq("project_id", project.id)
        .eq("profile_id", userData.id)
        .maybeSingle()

      if (existingMember) {
        throw new Error("User is already a member of this project")
      }

      // Add user to project
      const { error: inviteError } = await supabaseClient.from("project_members").insert({
        project_id: project.id,
        profile_id: userData.id,
        role: inviteRole,
      })

      if (inviteError) {
        throw inviteError
      }

      setInviteSuccess(`Successfully added ${inviteEmail} to the project`)
      setInviteEmail("")

      // Refresh team members list
      const { data: refreshedTeam, error: refreshError } = await supabaseClient
        .from("project_members")
        .select(
          `
          *,
          profile:profiles(id, first_name, last_name, avatar_url, email)
        `,
        )
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })

      if (!refreshError) {
        setTeamMembers(refreshedTeam || [])
      }
    } catch (error: any) {
      console.error("Error inviting team member:", error)
      setInviteError(error.message || "Failed to invite team member")
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return
    }

    try {
      const { error } = await supabaseClient.from("project_members").delete().eq("id", memberId)

      if (error) {
        throw error
      }

      // Update the team members list
      setTeamMembers(teamMembers.filter((member) => member.id !== memberId))
    } catch (error: any) {
      console.error("Error removing team member:", error)
      alert("Failed to remove team member: " + error.message)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabaseClient.from("project_members").update({ role: newRole }).eq("id", memberId)

      if (error) {
        throw error
      }

      // Update the team members list
      setTeamMembers(
        teamMembers.map((member) => {
          if (member.id === memberId) {
            return { ...member, role: newRole }
          }
          return member
        }),
      )
    } catch (error: any) {
      console.error("Error updating role:", error)
      alert("Failed to update role: " + error.message)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "manager":
        return { bg: "#dbeafe", text: "#1e40af" }
      case "member":
        return { bg: "#d1fae5", text: "#065f46" }
      case "viewer":
        return { bg: "#f3f4f6", text: "#4b5563" }
      default:
        return { bg: "#f3f4f6", text: "#4b5563" }
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div>Loading project team...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <div className="p-8 rounded-lg bg-red-50 border border-red-200 mb-6">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <Link
            href="/projects"
            className="bg-red-600 text-white py-3 px-6 rounded-md text-sm font-medium inline-block"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <div className="p-8 rounded-lg bg-red-50 border border-red-200 mb-6">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Project Not Found</h2>
          <p className="text-red-700 mb-6">
            The project you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link
            href="/projects"
            className="bg-red-600 text-white py-3 px-6 rounded-md text-sm font-medium inline-block"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href={`/projects/${project.id}`} className="text-gray-500 text-sm flex items-center">
            ← Back to Project
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">{project.name}: Team Management</h1>
        <p className="text-gray-600 mt-2">Manage team members and their roles for this project.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Members List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Team Members</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {teamMembers.length} {teamMembers.length === 1 ? "Member" : "Members"}
              </span>
            </div>

            {teamMembers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No team members yet.</p>
                {isOwner && <p className="text-sm text-gray-500">Use the form on the right to invite team members.</p>}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {teamMembers.map((member) => {
                  const roleBadge = getRoleBadgeColor(member.role)
                  return (
                    <li key={member.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {member.profile.avatar_url ? (
                                <img
                                  src={member.profile.avatar_url || "/placeholder.svg"}
                                  alt={`${member.profile.first_name || "User"}'s avatar`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-lg font-bold text-gray-400">
                                  {member.profile.first_name?.[0] || member.profile.email?.[0]?.toUpperCase() || "?"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.profile.first_name && member.profile.last_name
                                ? `${member.profile.first_name} ${member.profile.last_name}`
                                : member.profile.email}
                            </p>
                            <p className="text-sm text-gray-500">{member.profile.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: roleBadge.bg,
                              color: roleBadge.text,
                            }}
                          >
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>

                          {isOwner && currentUser.id !== member.profile.id && (
                            <div className="flex items-center ml-4">
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                className="text-sm border border-gray-300 rounded-md mr-2 p-1"
                              >
                                <option value="manager">Manager</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Invite Form */}
        {isOwner && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">Invite Team Member</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleInviteMember}>
                  {inviteError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                      {inviteError}
                    </div>
                  )}

                  {inviteSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                      {inviteSuccess}
                    </div>
                  )}

                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="colleague@example.com"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">The user must already have an account in the system.</p>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id="role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        <strong>Manager:</strong> Can edit project details and manage team members
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Member:</strong> Can create and edit tasks
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Viewer:</strong> Can only view project and tasks
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                  >
                    {inviting ? "Adding..." : "Add Team Member"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
