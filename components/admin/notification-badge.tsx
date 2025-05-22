"use client"

import { useState, useEffect } from "react"
import { io, type Socket } from "socket.io-client"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface ErrorNotification {
  id: number
  message: string
  severity: string
  category: string
  timestamp: string
}

export default function NotificationBadge() {
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<ErrorNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io({
      path: "/api/socket",
      addTrailingSlash: false,
    })

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Notification badge socket connected")
    })

    socketInstance.on("error:new", (notification: ErrorNotification) => {
      // Only show notifications for critical errors
      if (notification.severity === "critical") {
        // Add to notifications list
        setNotifications((prev) => [notification, ...prev].slice(0, 10)) // Keep only the 10 most recent
        setUnreadCount((prev) => prev + 1)
      }
    })

    socketInstance.on("disconnect", () => {
      console.log("Notification badge socket disconnected")
    })

    // Store socket instance
    setSocket(socketInstance)

    // Clean up on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setUnreadCount(0) // Mark as read when opened
    }
  }

  const handleViewError = (errorId: number) => {
    router.push(`/admin/errors?errorId=${errorId}`)
    setOpen(false)
  }

  const handleClearAll = () => {
    setNotifications([])
    setUnreadCount(0)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={`${notification.id}-${notification.timestamp}`}
                className="p-4 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                onClick={() => handleViewError(notification.id)}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <div className="flex justify-between items-center mt-1">
                      <Badge variant="outline" className="text-xs">
                        {notification.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(notification.timestamp), "HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
