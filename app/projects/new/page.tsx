"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  avatar_url: string | null
}

export default function NewProjectPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("active")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [teamMemberRole, setTeamMemberRole] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data: authData } = await supabaseClient.auth.getUser()
        if (!authData.user) {
          router.push("/login")
          return
        }

        const { data, error } = await supabaseClient
          .from("profiles")
          .select("id, first_name, last_name, email, avatar_url")
          .neq("id", authData.user.id) // Exclude current user
          .order("first_name", { ascending: true })

        if (error) {
          throw error
        }

        setProfiles(data || [])
      } catch (error: any) {
        console.error("Error fetching profiles:", error)
      }
    }

    fetchProfiles()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate form
      if (!name.trim()) {
        throw new Error("Project name is required")
      }

      // Get current user
      const { data: authData, error: authError } = await supabaseClient.auth.getUser()
      if (authError || !authData.user) {
        throw new Error("You must be logged in to create a project")
      }

      // Create the project
      const { data: projectData, error: projectError } = await supabaseClient
        .from("projects")
        .insert({
          name,
          description: description || null,
          status,
          owner_id: authData.user.id,
        })
        .select()
        .single()

      if (projectError) {
        throw projectError
      }

      // Add team members if any are selected
      if (selectedTeamMembers.length > 0) {
        const teamMembers = selectedTeamMembers.map((profileId) => ({
          project_id: projectData.id,
          profile_id: profileId,
          role: teamMemberRole[profileId] || "member",
        }))

        const { error: teamError } = await supabaseClient.from("project_members").insert(teamMembers)

        if (teamError) {
          throw teamError
        }
      }

      // Redirect to the project page
      router.push(`/projects/${projectData.id}`)
    } catch (error: any) {
      console.error("Error creating project:", error)
      setError(error.message || "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  const toggleTeamMember = (profileId: string) => {
    setSelectedTeamMembers((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId)
      } else {
        // Initialize role to "member" when adding
        setTeamMemberRole((prevRoles) => ({
          ...prevRoles,
          [profileId]: "member",
        }))
        return [...prev, profileId]
      }
    })
  }

  const updateTeamMemberRole = (profileId: string, role: string) => {
    setTeamMemberRole((prev) => ({
      ...prev,
      [profileId]: role,
    }))
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          <Link
            href="/projects"
            style={{
              color: "#6b7280",
              textDecoration: "none",
              fontSize: "0.875rem",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            ← Back to Projects
          </Link>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>Create New Project</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
          Fill out the form below to create a new project. You can add team members now or later.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.375rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ color: "#b91c1c", fontWeight: "500" }}>{error}</p>
        </div>
      )}

      {/* Project Form */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "1.5rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Project Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                }}
                placeholder="Enter project name"
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="description"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                  resize: "vertical",
                }}
                placeholder="Enter project description (optional)"
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="status"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                  backgroundColor: "white",
                }}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Team Members
              </label>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "1rem" }}>
                Select team members to add to this project. You can add more later.
              </p>

              {profiles.length === 0 ? (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    color: "#6b7280",
                    fontSize: "0.875rem",
                  }}
                >
                  No other users found in the system.
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    maxHeight: "15rem",
                    overflowY: "auto",
                  }}
                >
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      style={{
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                          type="checkbox"
                          id={`profile-${profile.id}`}
                          checked={selectedTeamMembers.includes(profile.id)}
                          onChange={() => toggleTeamMember(profile.id)}
                          style={{ width: "1rem", height: "1rem" }}
                        />
                        <div
                          style={{
                            width: "2rem",
                            height: "2rem",
                            borderRadius: "9999px",
                            backgroundColor: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "#4b5563",
                            fontSize: "0.875rem",
                            overflow: "hidden",
                          }}
                        >
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url || "/placeholder.svg"}
                              alt={`${profile.first_name || "User"}'s avatar`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            profile.first_name?.[0] || profile.email?.[0]?.toUpperCase() || "?"
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {profile.first_name && profile.last_name
                              ? `${profile.first_name} ${profile.last_name}`
                              : profile.email}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{profile.email}</div>
                        </div>
                      </div>

                      {selectedTeamMembers.includes(profile.id) && (
                        <select
                          value={teamMemberRole[profile.id] || "member"}
                          onChange={(e) => updateTeamMemberRole(profile.id, e.target.value)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            border: "1px solid #d1d5db",
                            fontSize: "0.75rem",
                          }}
                        >
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              padding: "1rem 1.5rem",
              backgroundColor: "#f9fafb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
            }}
          >
            <Link
              href="/projects"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                border: "1px solid #d1d5db",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                backgroundColor: "white",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? "#9ca3af" : "#0070f3",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
