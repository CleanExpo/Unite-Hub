"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

interface ErrorNotification {
  id: number
  message: string
  severity: string
  category: string
  timestamp: string
}

export default function ErrorNotificationListener() {
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<ErrorNotification[]>([])

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io({
      path: "/api/socket",
      addTrailingSlash: false,
    })

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Notification socket connected")
    })

    socketInstance.on("error:new", (notification: ErrorNotification) => {
      console.log("New error notification received:", notification)

      // Only show notifications for critical errors
      if (notification.severity === "critical") {
        // Add to notifications list
        setNotifications((prev) => [notification, ...prev])

        // Show toast notification
        toast({
          title: "Critical Error Detected",
          description: (
            <div className="mt-2 flex flex-col space-y-2">
              <p className="text-sm">{notification.message}</p>
              <p className="text-xs text-muted-foreground">Category: {notification.category}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/admin/errors?errorId=${notification.id}`)}
              >
                View Details
              </Button>
            </div>
          ),
          variant: "destructive",
          duration: 10000, // 10 seconds
        })
      }
    })

    socketInstance.on("disconnect", () => {
      console.log("Notification socket disconnected")
    })

    // Store socket instance
    setSocket(socketInstance)

    // Clean up on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [router])

  return null // This component doesn't render anything visible
}
