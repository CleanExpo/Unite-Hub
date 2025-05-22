"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function AuthTest() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<
    Array<{ name: string; status: "success" | "error" | "pending"; message: string }>
  >([])
  const [testRunning, setTestRunning] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabaseClient.auth.getUser()
      setUser(data?.user || null)
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const addTestResult = (name: string, status: "success" | "error" | "pending", message: string) => {
    setTestResults((prev) => [...prev, { name, status, message }])
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  const runAuthTest = async () => {
    setTestRunning(true)
    clearTestResults()

    // Test 1: Check if user is logged in
    addTestResult("Current Auth State", "pending", "Checking current authentication state...")

    try {
      const { data, error } = await supabaseClient.auth.getUser()

      if (error) throw error

      if (data.user) {
        addTestResult(
          "Current Auth State",
          "success",
          `User is logged in as ${data.user.email} (ID: ${data.user.id.substring(0, 8)}...)`,
        )
      } else {
        addTestResult("Current Auth State", "success", "User is not logged in")
      }
    } catch (error: any) {
      addTestResult("Current Auth State", "error", `Error checking auth state: ${error.message}`)
    }

    // Test 2: Test API endpoint that requires authentication
    addTestResult("Protected API Access", "pending", "Testing access to protected API endpoint...")

    try {
      const response = await fetch("/api/auth/protected")
      const data = await response.json()

      if (response.ok) {
        addTestResult("Protected API Access", "success", "Successfully accessed protected API endpoint")
      } else {
        addTestResult("Protected API Access", "error", `Failed to access protected API: ${data.error}`)
      }
    } catch (error: any) {
      addTestResult("Protected API Access", "error", `Error accessing protected API: ${error.message}`)
    }

    // Test 3: Check session persistence
    addTestResult("Session Persistence", "pending", "Testing session persistence...")

    try {
      const { data, error } = await supabaseClient.auth.getSession()

      if (error) throw error

      if (data.session) {
        addTestResult(
          "Session Persistence",
          "success",
          `Session is valid until ${new Date(data.session.expires_at! * 1000).toLocaleString()}`,
        )
      } else {
        addTestResult("Session Persistence", "error", "No active session found")
      }
    } catch (error: any) {
      addTestResult("Session Persistence", "error", `Error checking session: ${error.message}`)
    }

    setTestRunning(false)
  }

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Authentication Test</h1>

      <div
        style={{
          padding: "1.5rem",
          borderRadius: "0.5rem",
          backgroundColor: "#f9fafb",
          marginBottom: "2rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Current Status</h2>

        {loading ? (
          <p>Loading authentication state...</p>
        ) : user ? (
          <div>
            <p style={{ marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: "bold" }}>Logged in as:</span> {user.email}
            </p>
            <p style={{ marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: "bold" }}>User ID:</span> {user.id}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <span style={{ fontWeight: "bold" }}>Last Sign In:</span>{" "}
              {new Date(user.last_sign_in_at).toLocaleString()}
            </p>
            <button
              onClick={handleSignOut}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: "1rem" }}>You are not logged in.</p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link
                href="/login"
                style={{
                  backgroundColor: "#0070f3",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
              >
                Log In
              </Link>
              <Link
                href="/register"
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "1.5rem",
          borderRadius: "0.5rem",
          backgroundColor: "#f9fafb",
          marginBottom: "2rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Run Authentication Tests</h2>

        <button
          onClick={runAuthTest}
          disabled={testRunning}
          style={{
            backgroundColor: testRunning ? "#9ca3af" : "#0070f3",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: testRunning ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
            marginBottom: "1.5rem",
          }}
        >
          {testRunning ? "Running Tests..." : "Run Auth Tests"}
        </button>

        {testResults.length > 0 && (
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Test Results</h3>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                overflow: "hidden",
              }}
            >
              {testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: "1rem",
                    borderBottom: index < testResults.length - 1 ? "1px solid #e5e7eb" : "none",
                    backgroundColor:
                      result.status === "success" ? "#f0fdf4" : result.status === "error" ? "#fef2f2" : "#f9fafb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: "bold" }}>{result.name}</span>
                    <span
                      style={{
                        color:
                          result.status === "success" ? "#16a34a" : result.status === "error" ? "#dc2626" : "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      {result.status === "success" ? "✓ Success" : result.status === "error" ? "✗ Failed" : "⋯ Running"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#4b5563" }}>{result.message}</p>
                </div>
              ))}
            </div>
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
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Manual Test Steps</h2>

        <ol style={{ paddingLeft: "1.5rem", listStyleType: "decimal" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/register" style={{ color: "#0070f3", textDecoration: "underline" }}>
              Register a new account
            </Link>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/login" style={{ color: "#0070f3", textDecoration: "underline" }}>
              Log in with your credentials
            </Link>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/dashboard" style={{ color: "#0070f3", textDecoration: "underline" }}>
              Access the dashboard (protected route)
            </Link>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>Test sign out functionality</li>
          <li style={{ marginBottom: "0.5rem" }}>
            Try to access{" "}
            <Link href="/dashboard" style={{ color: "#0070f3", textDecoration: "underline" }}>
              dashboard
            </Link>{" "}
            while logged out (should redirect to login)
          </li>
        </ol>
      </div>
    </div>
  )
}
