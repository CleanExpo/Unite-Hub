"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SetupDatabase() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const router = useRouter()

  const handleSetupDatabase = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up database")
      }

      setResult({
        success: true,
        message: data.message || "Database setup completed successfully",
      })

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Database Setup</h1>

      <div
        style={{
          padding: "1.5rem",
          borderRadius: "0.5rem",
          backgroundColor: "#f9fafb",
          marginBottom: "2rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Initialize Database Schema</h2>
        <p style={{ marginBottom: "1.5rem", color: "#4b5563" }}>
          This will create all necessary tables, set up Row Level Security policies, and add sample data for testing.
          This action should only be performed once when setting up the application.
        </p>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <button
            onClick={handleSetupDatabase}
            disabled={loading}
            style={{
              backgroundColor: loading ? "#9ca3af" : "#0070f3",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            {loading ? "Setting Up..." : "Set Up Database"}
          </button>

          <Link
            href="/dashboard"
            style={{
              backgroundColor: "transparent",
              color: "#6b7280",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: "500",
              display: "inline-block",
            }}
          >
            Cancel
          </Link>
        </div>

        {result && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.375rem",
              backgroundColor: result.success ? "#d1fae5" : "#fee2e2",
              border: result.success ? "1px solid #a7f3d0" : "1px solid #fecaca",
            }}
          >
            <p
              style={{
                color: result.success ? "#065f46" : "#b91c1c",
                fontWeight: "500",
              }}
            >
              {result.success ? result.message : result.error}
            </p>
            {result.success && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#059669" }}>
                Redirecting to dashboard in 3 seconds...
              </p>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "1.5rem",
          borderRadius: "0.5rem",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Database Schema Information</h2>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Tables</h3>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "#4b5563" }}>
            <li>profiles - User profiles linked to auth.users</li>
            <li>projects - Projects created by users</li>
            <li>project_members - Junction table for team collaboration</li>
            <li>tasks - Tasks within projects</li>
            <li>comments - Comments on tasks</li>
            <li>task_attachments - File attachments for tasks</li>
          </ul>
        </div>

        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Security</h3>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "#4b5563" }}>
            <li>Row Level Security (RLS) policies for all tables</li>
            <li>Automatic profile creation on user signup</li>
            <li>Role-based access control (user, admin)</li>
            <li>Project-level permissions (owner, manager, member, viewer)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
