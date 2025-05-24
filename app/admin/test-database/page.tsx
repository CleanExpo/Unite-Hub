"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function TestDatabase() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runDatabaseTests = async () => {
    setLoading(true)
    setError(null)
    setTestResults(null)

    try {
      const response = await fetch("/api/test-database")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to test database")
      }

      setTestResults(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Run tests automatically when the page loads
    runDatabaseTests()
  }, [])

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Database Schema Test</h1>

      <div
        style={{
          padding: "1.5rem",
          borderRadius: "0.5rem",
          backgroundColor: "#f9fafb",
          marginBottom: "2rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Test Database Schema</h2>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={runDatabaseTests}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#9ca3af" : "#0070f3",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              {loading ? "Running Tests..." : "Run Tests"}
            </button>

            <Link
              href="/dashboard"
              style={{
                backgroundColor: "transparent",
                color: "#6b7280",
                padding: "0.5rem 1rem",
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

        {loading && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.375rem",
              backgroundColor: "#f3f4f6",
              border: "1px solid #e5e7eb",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#4b5563" }}>Running database tests...</p>
          </div>
        )}

        {testResults && (
          <div>
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.375rem",
                backgroundColor: testResults.success ? "#d1fae5" : "#fee2e2",
                border: testResults.success ? "1px solid #a7f3d0" : "1px solid #fecaca",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p
                  style={{
                    color: testResults.success ? "#065f46" : "#b91c1c",
                    fontWeight: "500",
                  }}
                >
                  {testResults.success
                    ? "All database tests passed successfully!"
                    : "Some database tests failed. See details below."}
                </p>
                <span
                  style={{
                    backgroundColor: testResults.success ? "#059669" : "#dc2626",
                    color: "white",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                  }}
                >
                  {testResults.summary.percentage}%
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "0.75rem",
                  fontSize: "0.875rem",
                }}
              >
                <span>
                  <strong>Total:</strong> {testResults.summary.total}
                </span>
                <span style={{ color: "#059669" }}>
                  <strong>Passed:</strong> {testResults.summary.successful}
                </span>
                <span style={{ color: "#dc2626" }}>
                  <strong>Failed:</strong> {testResults.summary.failed}
                </span>
                <span style={{ color: "#9ca3af" }}>
                  <strong>Skipped:</strong> {testResults.summary.skipped}
                </span>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.75rem" }}>Test Results</h3>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                  overflow: "hidden",
                }}
              >
                {testResults.testResults.map((result: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: "1rem",
                      borderBottom: index < testResults.testResults.length - 1 ? "1px solid #e5e7eb" : "none",
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
                        {result.status === "success"
                          ? "✓ Success"
                          : result.status === "error"
                            ? "✗ Failed"
                            : "⊘ Skipped"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.5rem" }}>{result.message}</p>
                    {result.details && (
                      <div
                        style={{
                          backgroundColor: "white",
                          padding: "0.75rem",
                          borderRadius: "0.25rem",
                          border: "1px solid #e5e7eb",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          overflowX: "auto",
                        }}
                      >
                        <pre style={{ margin: 0 }}>{JSON.stringify(result.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Next Steps</h2>

        <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "#4b5563" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/admin/setup-database" style={{ color: "#0070f3", textDecoration: "underline" }}>
              Set up database
            </Link>{" "}
            - If tests are failing, you may need to set up the database first
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/dashboard" style={{ color: "#0070f3", textDecoration: "underline" }}>
              Go to dashboard
            </Link>{" "}
            - Start using the application
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href="/projects" style={{ color: "#0070f3", textDecoration: "underline" }}>
              Manage projects
            </Link>{" "}
            - Create and manage your projects
          </li>
        </ul>
      </div>
    </div>
  )
}
