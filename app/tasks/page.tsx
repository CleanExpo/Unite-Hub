"use client"

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
  created_at: string
  assignee: {
    first_name: string | null
    last_name: string | null
    email: string
  } | null
  project: {
    name: string
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all") // all, assigned, created
  const [statusFilter, setStatusFilter] = useState("all") // all, todo, in_progress, review, done
  const router = useRouter()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is authenticated
        const { data: authData, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !authData.user) {
          router.push("/login")
          return
        }

        // Build the query
        let query = supabaseClient
          .from("tasks")
          .select(
            `
            *,
            assignee:profiles!tasks_assigned_to_fkey(first_name, last_name, email),
            project:projects(name)
          `,
          )
          .order("created_at", { ascending: false })

        // Apply filters
        if (filter === "assigned") {
          query = query.eq("assigned_to", authData.user.id)
        } else if (filter === "created") {
          query = query.eq("created_by", authData.user.id)
        }

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        setTasks(data || [])
      } catch (error: any) {
        console.error("Error fetching tasks:", error)
        setError(error.message || "Failed to load tasks")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [router, filter, statusFilter])

  const getStatusColor = (status: string) => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>Tasks</h1>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
          padding: "1rem 1.5rem",
          marginBottom: "2rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <div>
          <label
            htmlFor="filter"
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              marginRight: "0.5rem",
            }}
          >
            Show:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              backgroundColor: "white",
            }}
          >
            <option value="all">All Tasks</option>
            <option value="assigned">Assigned to Me</option>
            <option value="created">Created by Me</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="statusFilter"
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              marginRight: "0.5rem",
            }}
          >
            Status:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              backgroundColor: "white",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
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

      {/* Loading State */}
      {loading && (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ color: "#6b7280" }}>Loading tasks...</p>
        </div>
      )}

      {/* No Tasks State */}
      {!loading && tasks.length === 0 && (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1rem" }}>
            No tasks found
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            {filter === "all"
              ? "No tasks match your filters. Try changing your filter settings or create a new task."
              : filter === "assigned"
                ? "No tasks are assigned to you. Try changing your filter settings."
                : "You haven't created any tasks yet. Try creating a new task."}
          </p>
          <Link
            href="/projects"
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
            View Projects
          </Link>
        </div>
      )}

      {/* Tasks Table */}
      {!loading && tasks.length > 0 && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                    Title
                  </th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.875rem", color: "#374151" }}>
                    Project
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
                  const statusColor = getStatusColor(task.status)
                  const priorityColor = getPriorityColor(task.priority)
                  return (
                    <tr key={task.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <Link
                          href={`/projects/${task.project_id}/tasks/${task.id}`}
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
                        <Link
                          href={`/projects/${task.project_id}`}
                          style={{ color: "#0070f3", textDecoration: "none" }}
                        >
                          {task.project.name}
                        </Link>
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
                          href={`/projects/${task.project_id}/tasks/${task.id}`}
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
        </div>
      )}

      {/* Back to Dashboard Link */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link
          href="/dashboard"
          style={{
            color: "#6b7280",
            textDecoration: "none",
            fontSize: "0.875rem",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
