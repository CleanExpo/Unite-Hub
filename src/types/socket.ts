import type { NextApiResponse } from 'next';
import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import type { Server as SocketIOServer } from 'socket.io';

declare module 'next' {
  interface NextApiResponse {
    socket: {
      server: (HttpServer | HttpsServer) & {
        io?: SocketIOServer;
      };
    };
  }
}

export type NextApiResponseWithSocket = NextApiResponse;
