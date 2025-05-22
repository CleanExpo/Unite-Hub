"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { logError } from "@/lib/error-logger"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function TestErrorNotificationPage() {
  const [message, setMessage] = useState("Database connection failed")
  const [severity, setSeverity] = useState<"critical" | "error" | "warning" | "info" | "debug">("critical")
  const [category, setCategory] = useState<string>("db")
  const [context, setContext] = useState('{"userId": "123", "action": "query", "table": "users"}')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccess(false)

    try {
      const parsedContext = JSON.parse(context)

      const result = await logError({
        message,
        severity,
        category: category as any,
        stackTrace: `Error: ${message}\n    at TestComponent (/app/admin/errors/test-notification/page.tsx:42:7)\n    at processChild (/node_modules/react-dom/cjs/react-dom-server.browser.development.js:3967:14)`,
        context: parsedContext,
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Error sending test notification:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Test Error Notification</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Generate Test Error</CardTitle>
          <CardDescription>Use this form to generate a test error and trigger real-time notifications.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Error Message</Label>
              <Input id="message" value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select value={severity} onValueChange={(value) => setSeverity(value as any)}>
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="db">Database</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="business">Business Logic</SelectItem>
                    <SelectItem value="external">External Service</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="ui">UI</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context (JSON)</Label>
              <Textarea id="context" value={context} onChange={(e) => setContext(e.target.value)} rows={4} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {success && (
              <div className="flex items-center text-green-500">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Error logged successfully!</span>
              </div>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Generate Error"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-8 max-w-2xl mx-auto">
        <div className="flex items-start p-4 border rounded-md bg-amber-50 border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800">Important Note</h3>
            <p className="text-sm text-amber-700 mt-1">
              This page is for testing purposes only. It will generate a real error log entry and trigger real-time
              notifications. Only critical errors will trigger desktop notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
