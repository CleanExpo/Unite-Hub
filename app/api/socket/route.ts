import { NextResponse } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import type { Server as NetServer } from "http"
import type { NextApiResponse } from "next"
import { createClient } from "@/lib/supabase/server"

// Global variable to store the Socket.IO server instance
let io: SocketIOServer | undefined

// Function to initialize the Socket.IO server
function initSocketServer(res: NextApiResponse) {
  if (!io) {
    // Get the underlying HTTP server
    const httpServer = res.socket?.server as unknown as NetServer

    // Create a new Socket.IO server
    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    })

    // Set up event handlers
    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Handle subscription to error channels
      socket.on("subscribe:errors", (filters) => {
        console.log(`Client ${socket.id} subscribed to error updates with filters:`, filters)
        socket.join("error-updates")
      })

      socket.on("unsubscribe:errors", () => {
        console.log(`Client ${socket.id} unsubscribed from error updates`)
        socket.leave("error-updates")
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })

    // Attach the io instance to the global object
    ;(res as any).socket.server.io = io

    // Set up Supabase realtime subscription for errors
    setupErrorSubscription(io)
  }

  return io
}

// Function to set up Supabase realtime subscription
async function setupErrorSubscription(io: SocketIOServer) {
  try {
    const supabase = createClient()

    // Subscribe to changes in the error_logs table
    supabase
      .channel("error_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "error_logs",
        },
        (payload) => {
          // Broadcast the new error to all clients subscribed to error updates
          io.to("error-updates").emit("error:new", payload.new)
        },
      )
      .subscribe()

    console.log("Supabase realtime subscription for errors set up successfully")
  } catch (error) {
    console.error("Error setting up Supabase realtime subscription:", error)
  }
}

export async function GET(req: Request, res: NextApiResponse) {
  try {
    // Initialize Socket.IO server
    initSocketServer(res)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Socket initialization error:", error)
    return NextResponse.json({ error: "Failed to initialize socket server" }, { status: 500 })
  }
}
