"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabase/client"

export default function BuildTest() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [apiResponse, setApiResponse] = useState<any>(null)

  useEffect(() => {
    async function testBuild() {
      try {
        // Test 1: Check if Supabase client is imported correctly
        if (!supabaseClient) {
          throw new Error("Supabase client is not properly imported")
        }
        setMessage("✅ Supabase client imported successfully")

        // Test 2: Check API route
        const response = await fetch("/api/test-supabase")
        const data = await response.json()
        setApiResponse(data)

        if (response.ok) {
          setMessage((prev) => `${prev}\n✅ API route working correctly`)
        } else {
          throw new Error(`API route error: ${data.error}`)
        }

        setStatus("success")
      } catch (error: any) {
        console.error("Build test error:", error)
        setMessage(`❌ Error: ${error.message}`)
        setStatus("error")
      }
    }

    testBuild()
  }, [])

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Build Test</h1>

      <div
        style={{
          padding: "1.5rem",
          borderRadius: "0.5rem",
          backgroundColor: status === "loading" ? "#f3f4f6" : status === "success" ? "#d1fae5" : "#fee2e2",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            color: status === "loading" ? "#4b5563" : status === "success" ? "#065f46" : "#b91c1c",
          }}
        >
          Status: {status === "loading" ? "Testing..." : status === "success" ? "All Tests Passed" : "Test Failed"}
        </h2>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            backgroundColor: "#ffffff",
            padding: "1rem",
            borderRadius: "0.25rem",
            border: "1px solid #e5e7eb",
          }}
        >
          {message}
        </pre>
      </div>

      {apiResponse && (
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>API Response</h2>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              backgroundColor: "#ffffff",
              padding: "1rem",
              borderRadius: "0.25rem",
              border: "1px solid #e5e7eb",
              maxHeight: "400px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
