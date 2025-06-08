import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { NextApiRequest } from 'next';
import type { NextApiResponseWithSocket } from '@/types/socket';

// Initialize Redis clients
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

// Connect to Redis
Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => console.log('Connected to Redis'))
  .catch(err => console.error('Redis connection error:', err));

// Create Socket.IO server
export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log('Socket.IO already running');
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // Use Redis adapter for scaling
  io.adapter(createAdapter(pubClient, subClient));

  // Event handlers
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room based on user ID
    socket.on('join:user', (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Join room based on deal ID
    socket.on('join:deal', (dealId: string) => {
      socket.join(dealId);
      console.log(`User joined deal room: ${dealId}`);
    });

    // Handle messages
    socket.on('send:message', (data) => {
      const { room, message } = data;
      io.to(room).emit('receive:message', message);
    });

    // Handle notifications
    socket.on('send:notification', (data) => {
      const { userId, notification } = data;
      io.to(userId).emit('receive:notification', notification);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  res.socket.server.io = io;
  console.log('Socket.IO started');
  res.end();
}
