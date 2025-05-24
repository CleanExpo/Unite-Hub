"use client"

import type React from "react"

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
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("active")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProject = async () => {
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
        const { data, error } = await supabaseClient.from("projects").select("*").eq("id", params.id).single()

        if (error) {
          if (error.code === "PGRST116") {
            // Record not found
            throw new Error("Project not found")
          }
          throw error
        }

        // Check if user is the owner
        if (data.owner_id !== authData.user.id) {
          throw new Error("You don't have permission to edit this project")
        }

        setProject(data)
        setName(data.name)
        setDescription(data.description || "")
        setStatus(data.status)
      } catch (error: any) {
        console.error("Error fetching project:", error)
        setError(error.message || "Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate form
      if (!name.trim()) {
        throw new Error("Project name is required")
      }

      if (!project) {
        throw new Error("Project not found")
      }

      // Update the project
      const { error } = await supabaseClient
        .from("projects")
        .update({
          name,
          description: description || null,
          status,
        })
        .eq("id", project.id)

      if (error) {
        throw error
      }

      // Redirect to the project page
      router.push(`/projects/${project.id}`)
    } catch (error: any) {
      console.error("Error updating project:", error)
      setError(error.message || "Failed to update project")
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
        <div>Loading project...</div>
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
            The project you're trying to edit doesn't exist or you don't have permission to edit it.
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
            href={`/projects/${project.id}`}
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
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>Edit Project</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>Update your project details below.</p>
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
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
              href={`/projects/${project.id}`}
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
                backgroundColor: saving ? "#9ca3af" : "#0070f3",
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
