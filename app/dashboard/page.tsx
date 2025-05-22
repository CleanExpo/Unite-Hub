"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<{
    status: "complete" | "partial" | "missing" | "unknown"
    hasProfile: boolean
    existingTables: string[]
    missingTables: string[]
  } | null>(null)
  const [dbStatusLoading, setDbStatusLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabaseClient.auth.getUser()

      if (error || !data?.user) {
        router.push("/login")
        return
      }

      setUser(data.user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      } else if (session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch("/api/verify-database")
        if (response.ok) {
          const data = await response.json()
          setDbStatus({
            status: data.status,
            hasProfile: data.hasProfile,
            existingTables: data.existingTables,
            missingTables: data.missingTables,
          })
        } else {
          setDbStatus({
            status: "unknown",
            hasProfile: false,
            existingTables: [],
            missingTables: [],
          })
        }
      } catch (error) {
        setDbStatus({
          status: "unknown",
          hasProfile: false,
          existingTables: [],
          missingTables: [],
        })
      } finally {
        setDbStatusLoading(false)
      }
    }

    if (user) {
      checkDatabaseStatus()
    }
  }, [user])

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
    router.push("/")
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
        <div>Loading...</div>
      </div>
    )
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
          paddingBottom: "1rem",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "#6b7280" }}>Welcome, {user?.email}</span>
          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: "transparent",
              color: "#dc2626",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #dc2626",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Database Status Section */}
      {dbStatusLoading ? (
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "2rem",
            borderRadius: "0.5rem",
            marginBottom: "2rem",
            border: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6b7280" }}>Checking database status...</p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "2rem",
            borderRadius: "0.5rem",
            marginBottom: "2rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>
            Database Status
          </h2>

          <div
            style={{
              padding: "1rem",
              borderRadius: "0.375rem",
              backgroundColor:
                dbStatus?.status === "complete" ? "#d1fae5" : dbStatus?.status === "partial" ? "#fef3c7" : "#fee2e2",
              border:
                dbStatus?.status === "complete"
                  ? "1px solid #a7f3d0"
                  : dbStatus?.status === "partial"
                    ? "1px solid #fde68a"
                    : "1px solid #fecaca",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p
                style={{
                  fontWeight: "500",
                  color:
                    dbStatus?.status === "complete"
                      ? "#065f46"
                      : dbStatus?.status === "partial"
                        ? "#92400e"
                        : "#b91c1c",
                }}
              >
                {dbStatus?.status === "complete"
                  ? "Database is fully set up and ready to use"
                  : dbStatus?.status === "partial"
                    ? "Database is partially set up"
                    : "Database is not set up"}
              </p>
              <span
                style={{
                  backgroundColor:
                    dbStatus?.status === "complete"
                      ? "#059669"
                      : dbStatus?.status === "partial"
                        ? "#d97706"
                        : "#dc2626",
                  color: "white",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {dbStatus?.status === "complete" ? "Complete" : dbStatus?.status === "partial" ? "Partial" : "Missing"}
              </span>
            </div>
          </div>

          {dbStatus?.status !== "complete" && (
            <div style={{ marginBottom: "1.5rem" }}>
              <Link
                href="/admin/setup-database"
                style={{
                  display: "inline-block",
                  backgroundColor: "#0070f3",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                Set Up Database
              </Link>
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Database Tables</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {dbStatus?.existingTables.map((table) => (
                <span
                  key={table}
                  style={{
                    backgroundColor: "#d1fae5",
                    color: "#065f46",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                  }}
                >
                  ✓ {table}
                </span>
              ))}
              {dbStatus?.missingTables.map((table) => (
                <span
                  key={table}
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                  }}
                >
                  ✗ {table}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>User Profile</h3>
            <span
              style={{
                backgroundColor: dbStatus?.hasProfile ? "#d1fae5" : "#fee2e2",
                color: dbStatus?.hasProfile ? "#065f46" : "#b91c1c",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: "500",
              }}
            >
              {dbStatus?.hasProfile ? "✓ Profile exists" : "✗ Profile missing"}
            </span>
          </div>

          {dbStatus?.status === "complete" && (
            <div style={{ marginTop: "1.5rem" }}>
              <Link
                href="/admin/test-database"
                style={{
                  display: "inline-block",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                Run Database Tests
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Welcome Section */}
      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "2rem",
          borderRadius: "0.5rem",
          marginBottom: "2rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>
          Welcome to Unite Group
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Your collaborative project management platform. Get started by creating your first project or exploring the
          features below.
        </p>

        {/* Quick Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "2rem", fontWeight: "bold", color: "#0070f3", marginBottom: "0.5rem" }}>0</h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Projects</p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981", marginBottom: "0.5rem" }}>0</h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Tasks Completed</p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b", marginBottom: "0.5rem" }}>0</h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Team Members</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>
            Create Your First Project
          </h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Start organizing your work by creating a new project. Invite team members and begin collaborating.
          </p>
          <Link
            href="/projects/new"
            style={{
              display: "block",
              backgroundColor: "#0070f3",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              width: "100%",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Create Project
          </Link>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>
            Manage Tasks
          </h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            View and manage all your tasks in one place. Track progress and stay organized.
          </p>
          <Link
            href="/tasks"
            style={{
              display: "block",
              backgroundColor: "#10b981",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              width: "100%",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            View Tasks
          </Link>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>
            Team Collaboration
          </h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Invite team members and collaborate on projects together. Share ideas and track progress.
          </p>
          <Link
            href="/team"
            style={{
              display: "block",
              backgroundColor: "#8b5cf6",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              width: "100%",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Invite Team
          </Link>
        </div>
        {/* Add this new card after the existing action cards */}
        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>
            System Health Check
          </h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Run comprehensive system diagnostics to ensure everything is working properly before deployment.
          </p>
          <Link
            href="/admin/health-check"
            style={{
              display: "block",
              backgroundColor: "#7c3aed",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              width: "100%",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Run Health Check
          </Link>
        </div>
      </div>
    </div>
  )
}
