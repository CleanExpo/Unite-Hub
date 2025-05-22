"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  CheckCircle2,
  UserCheck,
  Clock,
} from "lucide-react"
import ErrorDetailsDialog from "./error-details-dialog"
import { formatDistanceToNow } from "date-fns"

interface ErrorLog {
  id: number
  message: string
  severity: string
  category: string
  created_at: string
  resolved: boolean
  assigned_to: string | null
  assignment_status: string | null
}

export default function ErrorTable() {
  const searchParams = useSearchParams()
  const errorIdParam = searchParams.get("errorId")

  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedError, setSelectedError] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [severity, setSeverity] = useState<string>("")
  const [resolved, setResolved] = useState<string>("")
  const [assigned, setAssigned] = useState<string>("")

  const fetchErrors = async () => {
    setLoading(true)
    try {
      let url = `/api/errors?page=${page}&pageSize=${pageSize}`

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }

      if (severity) {
        url += `&severity=${encodeURIComponent(severity)}`
      }

      if (resolved) {
        url += `&resolved=${resolved}`
      }

      if (assigned) {
        url += `&assigned=${assigned}`
      }

      const response = await fetch(url)
      const data = await response.json()

      setErrors(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching errors:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchErrors()
  }, [page, pageSize, searchTerm, severity, resolved, assigned])

  // Handle direct navigation to a specific error
  useEffect(() => {
    if (errorIdParam) {
      setSelectedError(Number(errorIdParam))
    }
  }, [errorIdParam])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchErrors()
  }

  const handleResolvedChange = (value: string) => {
    setResolved(value)
    setPage(1)
  }

  const handleSeverityChange = (value: string) => {
    setSeverity(value)
    setPage(1)
  }

  const handleAssignedChange = (value: string) => {
    setAssigned(value)
    setPage(1)
  }

  const handleRefresh = () => {
    fetchErrors()
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

  const getAssignmentBadge = (assigned_to: string | null, status: string | null) => {
    if (!assigned_to) {
      return <span className="text-muted-foreground text-sm">Unassigned</span>
    }

    switch (status) {
      case "pending":
        return (
          <div className="flex items-center">
            <Clock className="h-3 w-3 text-amber-500 mr-1" />
            <span className="text-sm">Pending</span>
          </div>
        )
      case "accepted":
        return (
          <div className="flex items-center">
            <UserCheck className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-sm">Accepted</span>
          </div>
        )
      case "completed":
        return (
          <div className="flex items-center">
            <CheckCircle2 className="h-3 w-3 text-blue-500 mr-1" />
            <span className="text-sm">Completed</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center">
            <UserCheck className="h-3 w-3 text-gray-500 mr-1" />
            <span className="text-sm">Assigned</span>
          </div>
        )
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search error messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={severity} onValueChange={handleSeverityChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>

          <Select value={resolved} onValueChange={handleResolvedChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="false">Unresolved</SelectItem>
              <SelectItem value="true">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigned} onValueChange={handleAssignedChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Assignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              <SelectItem value="false">Unassigned</SelectItem>
              <SelectItem value="true">Assigned</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : errors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No errors found
                </TableCell>
              </TableRow>
            ) : (
              errors.map((error) => (
                <TableRow key={error.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{error.message}</TableCell>
                  <TableCell>{getSeverityBadge(error.severity)}</TableCell>
                  <TableCell>{error.category}</TableCell>
                  <TableCell>
                    {error.resolved ? (
                      <Badge variant="outline" className="text-green-500 border-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 border-gray-500">
                        Unresolved
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getAssignmentBadge(error.assigned_to, error.assignment_status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedError(error.id)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedError !== null && (
        <ErrorDetailsDialog
          errorId={selectedError}
          open={selectedError !== null}
          onClose={() => setSelectedError(null)}
          onResolved={handleRefresh}
        />
      )}
    </div>
  )
}
