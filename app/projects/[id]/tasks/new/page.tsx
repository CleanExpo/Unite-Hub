"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Project {
  id: string
  name: string
}

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

export default function NewTaskPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

        // Fetch project details
        const { data: projectData, error: projectError } = await supabaseClient
          .from("projects")
          .select("id, name")
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

        // Fetch team members (project owner and members)
        const { data: ownerData, error: ownerError } = await supabaseClient
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("id", authData.user.id)
          .single()

        if (ownerError) {
          throw ownerError
        }

        // For now, just use the current user as the only team member
        // In a real app, you would fetch all project members here
        setTeamMembers([ownerData])
      } catch (error: any) {
        console.error("Error fetching project and team:", error)
        setError(error.message || "Failed to load project information")
      } finally {
        setLoading(false)
      }
    }

    fetchProjectAndTeam()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate form
      if (!title.trim()) {
        throw new Error("Task title is required")
      }

      if (!project) {
        throw new Error("Project not found")
      }

      // Check if user is authenticated
      const { data: authData, error: authError } = await supabaseClient.auth.getUser()
      if (authError || !authData.user) {
        router.push("/login")
        return
      }

      // Create the task
      const { data, error } = await supabaseClient
        .from("tasks")
        .insert({
          title,
          description: description || null,
          status,
          priority,
          due_date: dueDate || null,
          project_id: project.id,
          assigned_to: assignedTo || null,
          created_by: authData.user.id,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Redirect to the project page
      router.push(`/projects/${params.id}`)
    } catch (error: any) {
      console.error("Error creating task:", error)
      setError(error.message || "Failed to create task")
    } finally {
      setSaving(false)
    }
  }

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
        <div>Loading project information...</div>
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
            The project you're trying to add a task to doesn't exist or you don't have permission to access it.
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

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          <Link
            href={`/projects/${params.id}`}
            style={{
              color: "#6b7280",
              textDecoration: "none",
              fontSize: "0.875rem",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            ← Back to Project
          </Link>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>Create New Task</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
          Add a new task to <strong>{project.name}</strong>
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

      {/* Task Form */}
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
                htmlFor="title"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Task Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                }}
                placeholder="Enter task title"
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
                placeholder="Enter task description (optional)"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
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
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    fontSize: "1rem",
                    backgroundColor: "white",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label
                  htmlFor="dueDate"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="assignedTo"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Assigned To
                </label>
                <select
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    fontSize: "1rem",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.email}
                    </option>
                  ))}
                </select>
              </div>
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
              href={`/projects/${params.id}`}
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
              disabled={saving}
              style={{
                backgroundColor: saving ? "#9ca3af" : "#10b981",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
