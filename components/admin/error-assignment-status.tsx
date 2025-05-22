"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, ChevronDown, CheckCircle, XCircle, Clock, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface ErrorAssignmentStatusUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

interface ErrorAssignmentStatusProps {
  errorId: number
  assignedTo?: ErrorAssignmentStatusUser | null
  status?: string
  onStatusChange?: () => void
  onAssign?: () => void
}

export default function ErrorAssignmentStatus({
  errorId,
  assignedTo,
  status = "unassigned",
  onStatusChange,
  onAssign,
}: ErrorAssignmentStatusProps) {
  const { toast } = useToast()
  const [updating, setUpdating] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setCurrentUser({ id: data.user.id })
      }
    }

    fetchCurrentUser()
  }, [])

  const updateStatus = async (newStatus: string) => {
    if (updating || !assignedTo) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/errors/${errorId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: currentUser?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      toast({
        title: "Status updated",
        description: `Assignment status changed to ${newStatus}`,
      })

      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error("Error updating assignment status:", error)
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = () => {
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
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-500">
            <User className="h-3 w-3 mr-1" />
            Unassigned
          </Badge>
        )
    }
  }

  if (!assignedTo) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="text-gray-500 border-gray-500">
          <User className="h-3 w-3 mr-1" />
          Unassigned
        </Badge>
        <Button size="sm" variant="outline" onClick={onAssign}>
          Assign
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <Avatar className="h-6 w-6 mr-2">
          <AvatarImage src={assignedTo.avatarUrl || ""} alt={`${assignedTo.firstName} ${assignedTo.lastName}`} />
          <AvatarFallback>
            {assignedTo.firstName?.[0]}
            {assignedTo.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm">
          {assignedTo.firstName} {assignedTo.lastName}
        </span>
      </div>

      {updating ? (
        <Badge variant="outline" className="text-gray-500 border-gray-500">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Updating...
        </Badge>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              {getStatusBadge()}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => updateStatus("pending")}>
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              <span>Pending</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus("in_progress")}>
              <Clock className="h-4 w-4 mr-2 text-blue-500" />
              <span>In Progress</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus("completed")}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <span>Completed</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus("rejected")}>
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
              <span>Rejected</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
