"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  owner_id: string
  created_at: string
  updated_at: string
  owner: {
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  assignee: {
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

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

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isTeamMember, setIsTeamMember] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is authenticated
        const { data: authData, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !authData.user) {
          router.push("/login")
          return
        }

        // Fetch project details
        const { data: projectData, error: projectError } = await supabaseClient
          .from("projects")
          .select(
            `
            *,
            owner:profiles(first_name, last_name, email)
          `,
          )
          .eq("id", params.id)
          .single()

        if (projectError) {
          if (projectError.code === "PGRST116") {
            // Record not found
            throw new Error("Project not found")
          }
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

        // Check if current user is a team member
        const currentUserMembership = teamData?.find((member) => member.profile.id === authData.user.id)
        setIsTeamMember(!!currentUserMembership)
        setUserRole(currentUserMembership?.role || null)

        // Fetch tasks for this project
        const { data: tasksData, error: tasksError } = await supabaseClient
          .from("tasks")
          .select(
            `
            *,
            assignee:profiles(first_name, last_name, email)
          `,
          )
          .eq("project_id", params.id)
          .order("created_at", { ascending: false })

        if (tasksError) {
          throw tasksError
        }

        setTasks(tasksData || [])
      } catch (error: any) {
        console.error("Error fetching project details:", error)
        setError(error.message || "Failed to load project details")
      } finally {
        setLoading(false)
      }
    }

    fetchProjectDetails()
  }, [params.id, router])

  const handleDeleteProject = async () => {
    try {
      setDeleteLoading(true)

      // Delete the project
      const { error } = await supabaseClient.from("projects").delete().eq("id", project?.id)

      if (error) {
        throw error
      }

      // Redirect to projects page
      router.push("/projects")
    } catch (error: any) {
      console.error("Error deleting project:", error)
      setError(error.message || "Failed to delete project")
      setDeleteModalOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "#d1fae5", text: "#065f46" }
      case "completed":
        return { bg: "#e0e7ff", text: "#3730a3" }
      case "archived":
        return { bg: "#f3f4f6", text: "#4b5563" }
      default:
        return { bg: "#f3f4f6", text: "#4b5563" }
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return { bg: "#fee2e2", text: "#b91c1c" }
      case "in_progress":
        return { bg: "#fef3c7", text: "#92400e" }
      case "review":
        return { bg: "#dbeafe", text: "#1e40af" }
      case "done":
        return { bg: "#d1fae5", text: "#065f46" }
      default:
        return { bg: "#f3f4f6", text: "#4b5563" }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return { bg: "#f3f4f6", text: "#4b5563" }
      case "medium":
        return { bg: "#dbeafe", text: "#1e40af" }
      case "high":
        return { bg: "#fef3c7", text: "#92400e" }
      case "urgent":
        return { bg: "#fee2e2", text: "#b91c1c" }
      default:
        return { bg: "#f3f4f6", text: "#4b5563" }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const canManageProject = isOwner || userRole === "manager"
  const canCreateTasks = isOwner || userRole === "manager" || userRole === "member"

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <div>Loading project details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            padding: "2rem",
            borderRadius: "0.5rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#b91c1c", marginBottom: "1rem" }}>Error</h2>
          <p style={{ color: "#b91c1c", marginBottom: "1.5rem" }}>{error}</p>
          <Link
            href="/projects"
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: "500",
              display: "inline-block",
            }}
          >
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            padding: "2rem",
            borderRadius: "0.5rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#b91c1c", marginBottom: "1rem" }}>
            Project Not Found
          </h2>
          <p style={{ color: "#b91c1c", marginBottom: "1.5rem" }}>
            The project you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link
            href="/projects"
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: "500",
              display: "inline-block",
            }}
          >
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  const statusColor = getStatusColor(project.status)

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
        }}
      >
        <div>
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
            <span
              style={{
                backgroundColor: statusColor.bg,
                color: statusColor.text,
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: "500",
              }}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>{project.name}</h1>
          {project.description && (
            <p style={{ color: "#6b7280", marginTop: "0.5rem", maxWidth: "800px" }}>{project.description}</p>
          )}
          <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
            <p>
              Owner:{" "}
              {project.owner?.first_name && project.owner?.last_name
                ? `${project.owner.first_name} ${project.owner.last_name}`
                : project.owner?.email || "Unknown"}
            </p>
            <p>Created: {formatDate(project.created_at)}</p>
            <p>Last Updated: {formatDate(project.updated_at)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {canCreateTasks && (
            <Link
              href={`/projects/${project.id}/tasks/new`}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
                display: "inline-block",
              }}
            >
              Add Task
            </Link>
          )}
          {canManageProject && (
            <Link
              href={`/projects/${project.id}/team`}
              style={{
                backgroundColor: "#6366f1",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
                display: "inline-block",
              }}
            >
              Manage Team
            </Link>
          )}
          {canManageProject && (
            <>
              <Link
                href={`/projects/${project.id}/edit`}
                style={{
                  backgroundColor: "#0070f3",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  display: "inline-block",
                }}
              >
                Edit Project
              </Link>
              <button
                onClick={() => setDeleteModalOpen(true)}
                style={{
                  backgroundColor: "transparent",
                  color: "#ef4444",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #ef4444",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Team Members Section */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937" }}>Team Members</h2>
          {canManageProject && (
            <Link
              href={`/projects/${project.id}/team`}
              style={{
                backgroundColor: "#6366f1",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: "500",
                display: "inline-block",
              }}
            >
              Manage Team
            </Link>
          )}
        </div>

        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {/* Owner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "9999px",
                  backgroundColor: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#4b5563",
                  fontSize: "1rem",
                }}
              >
                {project.owner?.first_name?.[0] || project.owner?.email?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontWeight: "500", color: "#1f2937" }}>
                  {project.owner?.first_name && project.owner?.last_name
                    ? `${project.owner.first_name} ${project.owner.last_name}`
                    : project.owner?.email || "Unknown"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "9999px",
                      fontSize: "0.625rem",
                      fontWeight: "500",
                    }}
                  >
                    Owner
                  </span>
                </div>
              </div>
            </div>

            {/* Team Members */}
            {teamMembers.map((member) => {
              const roleBadge = getRoleBadgeColor(member.role)
              return (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "9999px",
                      backgroundColor: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      color: "#4b5563",
                      fontSize: "1rem",
                      overflow: "hidden",
                    }}
                  >
                    {member.profile.avatar_url ? (
                      <img
                        src={member.profile.avatar_url || "/placeholder.svg"}
                        alt={`${member.profile.first_name || "User"}'s avatar`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      member.profile.first_name?.[0] || member.profile.email?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: "500", color: "#1f2937" }}>
                      {member.profile.first_name && member.profile.last_name
                        ? `${member.profile.first_name} ${member.profile.last_name}`
                        : member.profile.email}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: roleBadge.bg,
                          color: roleBadge.text,
                          padding: "0.125rem 0.5rem",
                          borderRadius: "9999px",
                          fontSize: "0.625rem",
                          fontWeight: "500",
                        }}
                      >
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {teamMembers.length === 0 && !isOwner && (
              <div style={{ color: "#6b7280", fontSize: "0.875rem", padding: "0.5rem 0" }}>
                No additional team members yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937" }}>Tasks</h2>
          {canCreateTasks && (
            <Link
              href={`/projects/${project.id}/tasks/new`}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: "500",
                display: "inline-block",
              }}
            >
              Add Task
            </Link>
          )}
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>No tasks found for this project.</p>
            {canCreateTasks && (
              <Link
                href={`/projects/${project.id}/tasks/new`}
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  display: "inline-block",
                }}
              >
                Create First Task
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                    Title
                  </th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                    Status
                  </th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                    Priority
                  </th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                    Assignee
                  </th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                    Due Date
                  </th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const statusColor = getTaskStatusColor(task.status)
                  const priorityColor = getPriorityColor(task.priority)
                  return (
                    <tr key={task.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <Link
                          href={`/projects/${project.id}/tasks/${task.id}`}
                          style={{ color: "#1f2937", textDecoration: "none", fontWeight: "500" }}
                        >
                          {task.title}
                        </Link>
                        {task.description && (
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "0.75rem",
                              marginTop: "0.25rem",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            backgroundColor: priorityColor.bg,
                            color: priorityColor.text,
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#4b5563" }}>
                        {task.assignee?.first_name && task.assignee?.last_name
                          ? `${task.assignee.first_name} ${task.assignee.last_name}`
                          : task.assignee?.email || "Unassigned"}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#4b5563" }}>
                        {formatDate(task.due_date)}
                      </td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <Link
                          href={`/projects/${project.id}/tasks/${task.id}`}
                          style={{
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.375rem",
                            textDecoration: "none",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            display: "inline-block",
                          }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              width: "100%",
              maxWidth: "28rem",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1rem" }}>
              Delete Project
            </h3>
            <p style={{ color: "#4b5563", marginBottom: "1.5rem" }}>
              Are you sure you want to delete this project? This action cannot be undone and will delete all tasks
              associated with this project.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  backgroundColor: "white",
                  color: "#4b5563",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleteLoading}
                style={{
                  backgroundColor: deleteLoading ? "#f87171" : "#ef4444",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
