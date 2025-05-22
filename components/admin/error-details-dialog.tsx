"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, AlertTriangle, Info, Bug, CheckCircle2, UserCheck } from "lucide-react"
import { format } from "date-fns"
import ErrorAssignmentDialog from "./error-assignment-dialog"

interface ErrorDetailsProps {
  errorId: number
  open: boolean
  onClose: () => void
  onResolved: () => void
}

interface ErrorDetail {
  id: number
  message: string
  stack_trace: string | null
  browser: string | null
  os: string | null
  url: string | null
  user_id: string | null
  severity: string
  category: string
  created_at: string
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  resolution_note: string | null
  assigned_to: string | null
  assignment_status: string | null
  context: Record<string, any> | null
}

export default function ErrorDetailsDialog({ errorId, open, onClose, onResolved }: ErrorDetailsProps) {
  const [error, setError] = useState<ErrorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  useEffect(() => {
    if (open && errorId) {
      fetchErrorDetails()
    }
  }, [open, errorId])

  const fetchErrorDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/errors/${errorId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch error details")
      }
      const data = await response.json()
      setError(data)
    } catch (error) {
      console.error("Error fetching error details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveError = async () => {
    if (!error) return

    setResolving(true)
    try {
      const response = await fetch(`/api/errors/${errorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolved: true,
          resolution_note: resolutionNote,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to resolve error")
      }

      // Refresh error details
      await fetchErrorDetails()
      onResolved()
    } catch (error) {
      console.error("Error resolving error:", error)
    } finally {
      setResolving(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Critical
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Error
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Warning
          </Badge>
        )
      case "info":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500 flex items-center gap-1">
            <Info className="h-3 w-3" /> Info
          </Badge>
        )
      case "debug":
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-500 flex items-center gap-1">
            <Bug className="h-3 w-3" /> Debug
          </Badge>
        )
      default:
        return <Badge>{severity}</Badge>
    }
  }

  const getAssignmentStatus = () => {
    if (!error?.assigned_to) {
      return (
        <div className="flex items-center text-muted-foreground">
          <span>Unassigned</span>
        </div>
      )
    }

    return (
      <div className="flex items-center">
        <UserCheck className="h-4 w-4 mr-1 text-green-500" />
        <span>
          Assigned to {error.assigned_to} ({error.assignment_status || "pending"})
        </span>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">Loading error details...</div>
          ) : !error ? (
            <div className="flex justify-center items-center py-8">Error not found</div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-semibold">Error Details</DialogTitle>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(error.severity)}
                    {error.resolved && (
                      <Badge variant="outline" className="text-green-500 border-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Resolved
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{format(new Date(error.created_at), "PPpp")}</div>
              </DialogHeader>

              <Tabs defaultValue="details">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="stack-trace">Stack Trace</TabsTrigger>
                  <TabsTrigger value="context">Context</TabsTrigger>
                  <TabsTrigger value="resolution">Resolution</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <h3 className="font-medium mb-1">Message</h3>
                    <div className="p-3 bg-muted rounded-md">{error.message}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-1">Category</h3>
                      <div>{error.category}</div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Assignment</h3>
                      <div>{getAssignmentStatus()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-1">Browser</h3>
                      <div>{error.browser || "Not available"}</div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Operating System</h3>
                      <div>{error.os || "Not available"}</div>
                    </div>
                  </div>

                  {error.url && (
                    <div>
                      <h3 className="font-medium mb-1">URL</h3>
                      <div className="break-all">{error.url}</div>
                    </div>
                  )}

                  {error.user_id && (
                    <div>
                      <h3 className="font-medium mb-1">User ID</h3>
                      <div>{error.user_id}</div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stack-trace" className="space-y-4 mt-4">
                  {error.stack_trace ? (
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto whitespace-pre-wrap">
                      {error.stack_trace}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground">No stack trace available</div>
                  )}
                </TabsContent>

                <TabsContent value="context" className="space-y-4 mt-4">
                  {error.context ? (
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground">No additional context available</div>
                  )}
                </TabsContent>

                <TabsContent value="resolution" className="space-y-4 mt-4">
                  {error.resolved ? (
                    <div className="space-y-4">
                      <div className="flex items-center text-green-500">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        <span className="font-medium">
                          Resolved on {format(new Date(error.resolved_at!), "PPpp")}
                          {error.resolved_by ? ` by ${error.resolved_by}` : ""}
                        </span>
                      </div>
                      {error.resolution_note && (
                        <div>
                          <h3 className="font-medium mb-1">Resolution Note</h3>
                          <div className="p-3 bg-muted rounded-md">{error.resolution_note}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center text-amber-500">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span className="font-medium">This error is not yet resolved</span>
                      </div>
                      <div>
                        <label htmlFor="resolution-note" className="block font-medium mb-1">
                          Resolution Note
                        </label>
                        <textarea
                          id="resolution-note"
                          className="w-full p-2 border rounded-md"
                          rows={4}
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Add notes about how this error was resolved..."
                        />
                      </div>
                      <Button onClick={handleResolveError} disabled={resolving}>
                        {resolving ? "Resolving..." : "Mark as Resolved"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex justify-between items-center">
                <div>
                  {!error.resolved && !error.assigned_to && (
                    <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
                      Assign Error
                    </Button>
                  )}
                </div>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showAssignDialog && (
        <ErrorAssignmentDialog
          errorId={errorId}
          open={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          onAssigned={() => {
            fetchErrorDetails()
            onResolved()
          }}
        />
      )}
    </>
  )
}
