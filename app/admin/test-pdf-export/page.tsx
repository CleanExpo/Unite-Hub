"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { ExportPdfButton } from "../../components/export-pdf-button"

export default function TestPdfExport() {
  const [content, setContent] = useState(
    "# PDF Export Test\n\nThis is a test of the PDF export functionality.\n\n## Features\n- Basic text formatting\n- Multiple lines\n- Special characters: !@#$%^&*()\n\nThank you for testing!",
  )
  const [filename, setFilename] = useState("test-export.pdf")
  const [testResults, setTestResults] = useState<
    Array<{ id: string; name: string; status: "success" | "error" | "pending"; message: string }>
  >([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestResults([])

    // Test 1: Basic export
    await runTest("basic", "Basic Export", async () => {
      const response = await fetch("/api/errors/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Basic test", filename: "basic-test.pdf" }),
      })

      const result = await response.json()
      if (!result.success) throw new Error("Basic export failed")
      if (!result.data.startsWith("data:application/pdf")) throw new Error("Invalid PDF data returned")

      return "Basic export successful"
    })

    // Test 2: Long content
    await runTest("long", "Long Content", async () => {
      const longContent = Array(100).fill("This is a line of text for testing long content.").join("\n")

      const response = await fetch("/api/errors/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: longContent, filename: "long-test.pdf" }),
      })

      const result = await response.json()
      if (!result.success) throw new Error("Long content export failed")

      return "Long content export successful"
    })

    // Test 3: Special characters
    await runTest("special", "Special Characters", async () => {
      const specialContent = "Special characters: !@#$%^&*()_+{}|:<>?~`-=[]\\;',./\nUnicode: ñáéíóúÑÁÉÍÓÚ€£¥©®™"

      const response = await fetch("/api/errors/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: specialContent, filename: "special-test.pdf" }),
      })

      const result = await response.json()
      if (!result.success) throw new Error("Special characters export failed")

      return "Special characters export successful"
    })

    setIsRunningTests(false)
  }

  const runTest = async (id: string, name: string, testFn: () => Promise<string>) => {
    setTestResults((prev) => [...prev, { id, name, status: "pending", message: "Running test..." }])

    try {
      const message = await testFn()
      setTestResults((prev) =>
        prev.map((result) => (result.id === id ? { ...result, status: "success", message } : result)),
      )
    } catch (error) {
      setTestResults((prev) =>
        prev.map((result) =>
          result.id === id
            ? { ...result, status: "error", message: error instanceof Error ? error.message : "Unknown error" }
            : result,
        ),
      )
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>PDF Export Test</CardTitle>
          <CardDescription>Verify that PDF export functionality works correctly in production</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="filename">
              Filename
            </label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename (e.g., export.pdf)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="content">
              Content
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content to export as PDF"
              rows={10}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={runAllTests} disabled={isRunningTests}>
            {isRunningTests ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run All Tests"
            )}
          </Button>
          <ExportPdfButton content={content} filename={filename} />
        </CardFooter>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result) => (
              <Alert
                key={result.id}
                variant={result.status === "error" ? "destructive" : "default"}
              >
                {result.status === "success" && <CheckCircle className="h-4 w-4" />}
                {result.status === "error" && <AlertCircle className="h-4 w-4" />}
                {result.status === "pending" && <Loader2 className="h-4 w-4 animate-spin" />}
                <AlertTitle>{result.name}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manual Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Enter some content in the text area above</li>
            <li>Click the "Export PDF" button</li>
            <li>Verify that a PDF file is downloaded</li>
            <li>Open the PDF file and check that the content matches what you entered</li>
            <li>Try with different types of content (long text, special characters, etc.)</li>
            <li>Check that the filename matches what you specified</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
