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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is authenticated
        const { data: authData, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !authData.user) {
          router.push("/login")
          return
        }

        // Fetch projects owned by the user or where the user is a member
        const { data, error } = await supabaseClient
          .from("projects")
          .select(`
            id,
            name,
            description,
            status,
            owner_id,
            created_at,
            updated_at
          `)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        // If we have projects, fetch the owner information separately
        if (data && data.length > 0) {
          // Get unique owner IDs
          const ownerIds = [...new Set(data.map((project) => project.owner_id))]

          // Fetch owner profiles
          const { data: ownersData, error: ownersError } = await supabaseClient
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", ownerIds)

          if (ownersError) {
            console.error("Error fetching owners:", ownersError)
          } else {
            // Create a map of owner data by ID for quick lookup
            const ownersMap = (ownersData || []).reduce(
              (acc, owner) => {
                acc[owner.id] = owner
                return acc
              },
              {} as Record<string, any>,
            )

            // Add owner data to each project
            const projectsWithOwners = data.map((project) => ({
              ...project,
              owner: ownersMap[project.owner_id] || null,
            }))

            setProjects(projectsWithOwners)
            return
          }
        }

        // If we couldn't fetch owners or there are no projects, just set the projects with null owner data
        setProjects((data || []).map(project => ({ ...project, owner: null })))
      } catch (error: any) {
        console.error("Error fetching projects:", error)
        setError(error.message || "Failed to load projects")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [router])

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

  const formatDate = (dateString: string) => {
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
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>Projects</h1>
        <Link
          href="/projects/new"
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
          Create New Project
        </Link>
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
          <p style={{ color: "#6b7280" }}>Loading projects...</p>
        </div>
      )}

      {/* No Projects State */}
      {!loading && projects.length === 0 && (
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
            No projects found
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Get started by creating your first project using the button above.
          </p>
          <Link
            href="/projects/new"
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
            Create New Project
          </Link>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {projects.map((project) => {
            const statusColor = getStatusColor(project.status)
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)"
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <div style={{ padding: "1.5rem", flexGrow: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h2
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          color: "#1f2937",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {project.name}
                      </h2>
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
                    <p
                      style={{
                        color: "#6b7280",
                        marginBottom: "1rem",
                        fontSize: "0.875rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {project.description || "No description provided"}
                    </p>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      padding: "1rem 1.5rem",
                      backgroundColor: "#f9fafb",
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      Owner:{" "}
                      {project.owner?.first_name && project.owner?.last_name
                        ? `${project.owner.first_name} ${project.owner.last_name}`
                        : project.owner?.email || "Unknown"}
                    </span>
                    <span>Created: {formatDate(project.created_at)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
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
