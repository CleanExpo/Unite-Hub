"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react"

interface HealthCheckItem {
  name: string
  status: "success" | "error" | "warning" | "pending"
  message: string
  action?: string
  link?: string
}

export default function HealthCheckPage() {
  const [healthChecks, setHealthChecks] = useState<HealthCheckItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runHealthChecks()
  }, [])

  const runHealthChecks = async () => {
    setLoading(true)
    const checks: HealthCheckItem[] = []

    // Check 1: Environment Variables
    try {
      const response = await fetch("/api/check-env")
      const data = await response.json()

      if (response.ok && data.allPresent) {
        checks.push({
          name: "Environment Variables",
          status: "success",
          message: "All required environment variables are configured",
        })
      } else {
        checks.push({
          name: "Environment Variables",
          status: "error",
          message: `Missing environment variables: ${data.missing?.join(", ") || "Unknown"}`,
          action: "Configure missing environment variables in Vercel dashboard",
        })
      }
    } catch (error) {
      checks.push({
        name: "Environment Variables",
        status: "error",
        message: "Failed to check environment variables",
      })
    }

    // Check 2: Database Connection
    try {
      const response = await fetch("/api/test-supabase")
      const data = await response.json()

      if (response.ok && data.connected) {
        checks.push({
          name: "Database Connection",
          status: "success",
          message: "Successfully connected to Supabase database",
        })
      } else {
        checks.push({
          name: "Database Connection",
          status: "error",
          message: data.error || "Failed to connect to database",
          action: "Check Supabase configuration and credentials",
        })
      }
    } catch (error) {
      checks.push({
        name: "Database Connection",
        status: "error",
        message: "Failed to test database connection",
      })
    }

    // Check 3: Database Schema
    try {
      const response = await fetch("/api/verify-database")
      const data = await response.json()

      if (response.ok && data.status === "complete") {
        checks.push({
          name: "Database Schema",
          status: "success",
          message: "Database schema is complete and ready",
        })
      } else if (data.status === "partial") {
        checks.push({
          name: "Database Schema",
          status: "warning",
          message: `Database partially set up. Missing: ${data.missingTables?.join(", ") || "some tables"}`,
          action: "Run database setup",
          link: "/admin/setup-database",
        })
      } else {
        checks.push({
          name: "Database Schema",
          status: "error",
          message: "Database schema not set up",
          action: "Run database setup",
          link: "/admin/setup-database",
        })
      }
    } catch (error) {
      checks.push({
        name: "Database Schema",
        status: "error",
        message: "Failed to verify database schema",
      })
    }

    // Check 4: Authentication Flow
    try {
      const response = await fetch("/api/auth/test-flow")
      const data = await response.json()

      if (response.ok && data.working) {
        checks.push({
          name: "Authentication Flow",
          status: "success",
          message: "Authentication system is working correctly",
        })
      } else {
        checks.push({
          name: "Authentication Flow",
          status: "error",
          message: data.error || "Authentication flow has issues",
          action: "Check authentication configuration",
        })
      }
    } catch (error) {
      checks.push({
        name: "Authentication Flow",
        status: "warning",
        message: "Could not fully test authentication flow",
      })
    }

    // Check 5: Critical Pages
    const criticalPages = [
      { path: "/", name: "Landing Page" },
      { path: "/login", name: "Login Page" },
      { path: "/register", name: "Register Page" },
      { path: "/dashboard", name: "Dashboard" },
      { path: "/services", name: "Services Page" },
      { path: "/contact", name: "Contact Page" },
      { path: "/about", name: "About Page" },
    ]

    for (const page of criticalPages) {
      try {
        const response = await fetch(page.path, { method: "HEAD" })
        if (response.ok) {
          checks.push({
            name: `Page: ${page.name}`,
            status: "success",
            message: `${page.name} is accessible`,
          })
        } else if (response.status === 404) {
          checks.push({
            name: `Page: ${page.name}`,
            status: "error",
            message: `${page.name} not found (404)`,
            action: `Create ${page.name.toLowerCase()}`,
            link: page.path,
          })
        } else {
          checks.push({
            name: `Page: ${page.name}`,
            status: "warning",
            message: `${page.name} returned status ${response.status}`,
          })
        }
      } catch (error) {
        checks.push({
          name: `Page: ${page.name}`,
          status: "error",
          message: `Failed to check ${page.name}`,
        })
      }
    }

    // Check 6: Navigation Links
    const navigationLinks = [
      "/services/software-development",
      "/services/seo-services",
      "/services/expert-education",
      "/projects",
      "/profile",
    ]

    for (const link of navigationLinks) {
      try {
        const response = await fetch(link, { method: "HEAD" })
        if (response.ok) {
          checks.push({
            name: `Navigation: ${link}`,
            status: "success",
            message: `${link} is accessible`,
          })
        } else {
          checks.push({
            name: `Navigation: ${link}`,
            status: "error",
            message: `${link} not accessible (${response.status})`,
            action: "Fix navigation link",
          })
        }
      } catch (error) {
        checks.push({
          name: `Navigation: ${link}`,
          status: "error",
          message: `Failed to check ${link}`,
        })
      }
    }

    setHealthChecks(checks)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return { bg: "#f0fdf4", border: "#a7f3d0", text: "#065f46" }
      case "error":
        return { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" }
      case "warning":
        return { bg: "#fefbf2", border: "#fed7aa", text: "#92400e" }
      default:
        return { bg: "#f9fafb", border: "#e5e7eb", text: "#4b5563" }
    }
  }

  const successCount = healthChecks.filter((check) => check.status === "success").length
  const errorCount = healthChecks.filter((check) => check.status === "error").length
  const warningCount = healthChecks.filter((check) => check.status === "warning").length
  const totalChecks = healthChecks.length

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>System Health Check</h1>

      {/* Summary */}
      <div
        style={{
          padding: "1.5rem",
          borderRadius: "0.5rem",
          backgroundColor: "#f9fafb",
          marginBottom: "2rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Summary</h2>

        {loading ? (
          <p>Running health checks...</p>
        ) : (
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "2rem", fontWeight: "bold", color: "#16a34a" }}>{successCount}</span>
              <p style={{ color: "#16a34a", fontSize: "0.875rem" }}>Passing</p>
            </div>
            <div>
              <span style={{ fontSize: "2rem", fontWeight: "bold", color: "#dc2626" }}>{errorCount}</span>
              <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>Failing</p>
            </div>
            <div>
              <span style={{ fontSize: "2rem", fontWeight: "bold", color: "#d97706" }}>{warningCount}</span>
              <p style={{ color: "#d97706", fontSize: "0.875rem" }}>Warnings</p>
            </div>
            <div>
              <span style={{ fontSize: "2rem", fontWeight: "bold", color: "#4b5563" }}>{totalChecks}</span>
              <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>Total Checks</p>
            </div>
          </div>
        )}
      </div>

      {/* Deployment Readiness */}
      {!loading && (
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "0.5rem",
            backgroundColor: errorCount === 0 ? "#d1fae5" : "#fee2e2",
            border: errorCount === 0 ? "1px solid #a7f3d0" : "1px solid #fecaca",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Deployment Readiness</h2>
          <p style={{ color: errorCount === 0 ? "#065f46" : "#b91c1c" }}>
            {errorCount === 0
              ? "✅ System is ready for deployment!"
              : `❌ ${errorCount} critical issue${errorCount > 1 ? "s" : ""} must be resolved before deployment.`}
          </p>
          {warningCount > 0 && (
            <p style={{ color: "#92400e", marginTop: "0.5rem" }}>
              ⚠️ {warningCount} warning{warningCount > 1 ? "s" : ""} should be addressed for optimal performance.
            </p>
          )}
        </div>
      )}

      {/* Detailed Results */}
      {!loading && (
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Detailed Results</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {healthChecks.map((check, index) => {
              const colors = getStatusColor(check.status)
              return (
                <div
                  key={index}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.375rem",
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {getStatusIcon(check.status)}
                      <div>
                        <h3 style={{ fontWeight: "500", color: colors.text }}>{check.name}</h3>
                        <p style={{ fontSize: "0.875rem", color: colors.text, opacity: 0.8 }}>{check.message}</p>
                        {check.action && (
                          <p style={{ fontSize: "0.75rem", color: colors.text, marginTop: "0.25rem" }}>
                            Action needed: {check.action}
                          </p>
                        )}
                      </div>
                    </div>
                    {check.link && (
                      <Link
                        href={check.link}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          color: colors.text,
                          textDecoration: "none",
                          fontSize: "0.875rem",
                        }}
                      >
                        Fix <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button
          onClick={runHealthChecks}
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
          {loading ? "Running Checks..." : "Re-run Health Check"}
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
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
