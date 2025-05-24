"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  project_id: string
  assigned_to: string | null
  created_by: string
}

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

export default function EditTaskPage({ params }: { params: { id: string; taskId: string } }) {
  const [task, setTask] = useState<Task | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTaskAndTeam = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is authenticated
        const { data: authData, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !authData.user) {
          router.push("/login")
          return
        }

        // Fetch task details
        const { data: taskData, error: taskError } = await supabaseClient
          .from("tasks")
          .select("*")
          .eq("id", params.taskId)
          .eq("project_id", params.id)
          .single()

        if (taskError) {
          if (taskError.code === "PGRST116") {
            // Record not found
            throw new Error("Task not found")
          }
          throw taskError
        }

        // Check if user can edit this task
        // User can edit if they created the task, are assigned to it, or are the project owner
        const isCreator = taskData.created_by === authData.user.id
        const isAssignee = taskData.assigned_to === authData.user.id

        // Check if user is project owner
        const { data: projectData, error: projectError } = await supabaseClient
          .from("projects")
          .select("owner_id")
          .eq("id", params.id)
          .single()

        if (projectError) {
          throw projectError
        }

        const isProjectOwner = projectData.owner_id === authData.user.id

        if (!isCreator && !isAssignee && !isProjectOwner) {
          throw new Error("You don't have permission to edit this task")
        }

        setTask(taskData)
        setTitle(taskData.title)
        setDescription(taskData.description || "")
        setStatus(taskData.status)
        setPriority(taskData.priority)
        setDueDate(taskData.due_date ? new Date(taskData.due_date).toISOString().split("T")[0] : "")
        setAssignedTo(taskData.assigned_to || "")

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
        console.error("Error fetching task and team:", error)
        setError(error.message || "Failed to load task information")
      } finally {
        setLoading(false)
      }
    }

    fetchTaskAndTeam()
  }, [params.taskId, params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate form
      if (!title.trim()) {
        throw new Error("Task title is required")
      }

      if (!task) {
        throw new Error("Task not found")
      }

      // Update the task
      const { error } = await supabaseClient
        .from("tasks")
        .update({
          title,
          description: description || null,
          status,
          priority,
          due_date: dueDate || null,
          assigned_to: assignedTo || null,
        })
        .eq("id", task.id)

      if (error) {
        throw error
      }

      // Redirect to the task page
      router.push(`/projects/${params.id}/tasks/${task.id}`)
    } catch (error: any) {
      console.error("Error updating task:", error)
      setError(error.message || "Failed to update task")
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
        <div>Loading task information...</div>
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
            href={`/projects/${params.id}`}
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
            Back to Project
          </Link>
        </div>
      </div>
    )
  }

  if (!task) {
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
            Task Not Found
          </h2>
          <p style={{ color: "#b91c1c", marginBottom: "1.5rem" }}>
            The task you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Link
            href={`/projects/${params.id}`}
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
            Back to Project
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
            href={`/projects/${params.id}/tasks/${task.id}`}
            style={{
              color: "#6b7280",
              textDecoration: "none",
              fontSize: "0.875rem",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            ← Back to Task
          </Link>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>Edit Task</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>Update task details below.</p>
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
              href={`/projects/${params.id}/tasks/${task.id}`}
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
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
