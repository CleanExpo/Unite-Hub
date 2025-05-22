"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import ErrorDetailsDialog from "@/components/admin/error-details-dialog"
import { createClient } from "@/lib/supabase/client"

interface Assignment {
  assignment_id: number
  error_id: number
  assigned_by: string
  assigned_to: string
  assigned_at: string
  notes: string | null
  assignment_status: string
  error_message: string
  error_severity: string
  error_category: string
  error_resolved: boolean
  error_created_at: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

export default function ErrorAssignmentsTable() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setCurrentUser({ id: data.user.id })
        setSelectedUserId(data.user.id)
      }
    }

    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users")
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }

        const { data } = await response.json()
        setUsers(data || [])
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [selectedUserId, selectedStatus, page, currentUser])

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      let url = `/api/errors/assignments?limit=10`

      if (selectedUserId !== "all") {
        url += `&userId=${selectedUserId}`
      }

      if (selectedStatus !== "all") {
        url += `&status=${selectedStatus}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch assignments")
      }

      const { data } = await response.json()
      setAssignments(data || [])
      setTotalPages(Math.ceil((data?.length || 0) / 10))
    } catch (error) {
      console.error("Error fetching assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchAssignments()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User"
  }

  const getUserAvatar = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return (
      <Avatar className="h-6 w-6">
        <AvatarImage src={user?.avatarUrl || ""} alt={getUserName(userId)} />
        <AvatarFallback>
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1">
          <label htmlFor="user-filter" className="block text-sm font-medium text-muted-foreground mb-1">
            Filter by User
          </label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-filter" className="w-full md:w-[250px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {currentUser && <SelectItem value={currentUser.id}>My Assignments</SelectItem>}
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-1">
            Filter by Status
          </label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger id="status-filter" className="w-full md:w-[200px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Error</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No assignments found
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.assignment_id}>
                  <TableCell>
                    <div>
                      <Badge className="mb-1">{assignment.error_severity}</Badge>
                      <div className="text-sm font-medium truncate max-w-[300px]">{assignment.error_message}</div>
                      <div className="text-xs text-muted-foreground">{assignment.error_category}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getUserAvatar(assignment.assigned_to)}
                      <span className="ml-2">{getUserName(assignment.assigned_to)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(assignment.assignment_status)}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(assignment.assigned_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedErrorId(assignment.error_id)}>
                      View Error
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

      {selectedErrorId !== null && (
        <ErrorDetailsDialog
          errorId={selectedErrorId}
          open={selectedErrorId !== null}
          onClose={() => setSelectedErrorId(null)}
          onResolved={handleRefresh}
        />
      )}
    </div>
  )
}
