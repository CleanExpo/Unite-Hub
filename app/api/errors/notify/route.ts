import { NextResponse } from "next/server"
import type { Server as SocketIOServer } from "socket.io"

// Global variable to access the Socket.IO server
declare global {
  var io: SocketIOServer | undefined
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { errorId, message, severity, category } = body

    // Validate required fields
    if (!errorId || !message || !severity || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the Socket.IO server instance
    const io = global.io

    if (!io) {
      return NextResponse.json({ error: "Socket.IO server not initialized" }, { status: 500 })
    }

    // Emit the error notification to all connected clients
    io.emit("error:new", {
      id: errorId,
      message,
      severity,
      category,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
