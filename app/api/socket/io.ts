import { Server as SocketIOServer } from "socket.io"
import type { Server as NetServer } from "http"
import type { NextApiResponse } from "next"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function ioHandler(req: any, res: NextApiResponse) {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    })

    // Set up event handlers
    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })

    // Store the io instance globally
    res.socket.server.io = io
    global.io = io
  }

  res.end()
}
