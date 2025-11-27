/**
 * Alert WebSocket Server
 * Manages real-time WebSocket connections for alert streaming
 * Supports authentication, subscriptions, and broadcasting
 */

import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

interface AlertClient {
  id: string;
  workspaceId: string;
  userId: string;
  frameworkId?: string;
  socket: WebSocket;
  authenticated: boolean;
  lastPing: number;
  subscriptions: Set<string>;
}

interface WebSocketMessage {
  type: 'auth' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'alert' | 'error' | 'auth_success' | 'auth_failed' | 'subscribed' | 'unsubscribed';
  token?: string;
  frameworkId?: string;
  clientId?: string;
  channel?: string;
  message?: string;
  data?: any;
}

class AlertWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AlertClient> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // channel -> clientIds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metrics = {
    connected_clients: 0,
    total_connections: 0,
    messages_sent: 0,
    messages_received: 0,
    errors: 0,
  };

  async initialize(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      this.handleConnection(ws, req);
    });

    // Heartbeat to detect dead connections (check every 30 seconds)
    this.heartbeatInterval = setInterval(() => this.checkHeartbeat(), 30000);

    console.log('[WebSocket] Server initialized');
  }

  private handleConnection(ws: WebSocket, req: any) {
    const clientId = this.generateClientId();
    const client: AlertClient = {
      id: clientId,
      workspaceId: '',
      userId: '',
      socket: ws,
      authenticated: false,
      lastPing: Date.now(),
      subscriptions: new Set(),
    };

    this.clients.set(clientId, client);
    this.metrics.connected_clients = this.clients.size;
    this.metrics.total_connections++;

    console.log(`[WebSocket] Client ${clientId} connected (total: ${this.metrics.connected_clients})`);

    ws.on('message', (message: any) => {
      try {
        this.metrics.messages_received++;
        const parsed = JSON.parse(message.toString());
        this.handleMessage(clientId, parsed);
      } catch (error) {
        console.error('[WebSocket] Message parse error:', error);
        this.metrics.errors++;
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Invalid message format',
        });
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = Date.now();
      }
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Client ${clientId} error:`, error);
      this.metrics.errors++;
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'auth':
        this.handleAuth(clientId, message.token);
        break;
      case 'subscribe':
        this.handleSubscribe(clientId, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message);
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        break;
      default:
        console.warn(`[WebSocket] Unknown message type: ${message.type}`);
    }
  }

  private handleAuth(clientId: string, token?: string) {
    const client = this.clients.get(clientId);
    if (!client || !token) {
      this.sendToClient(clientId, {
        type: 'auth_failed',
        message: 'No token provided',
      });
      return;
    }

    try {
      const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
      const decoded: any = jwt.verify(token, secret);

      client.authenticated = true;
      client.workspaceId = decoded.workspaceId || '';
      client.userId = decoded.sub || decoded.userId || '';

      this.sendToClient(clientId, {
        type: 'auth_success',
        clientId,
        workspaceId: client.workspaceId,
      });

      console.log(`[WebSocket] Client ${clientId} authenticated (workspace: ${client.workspaceId})`);
    } catch (error) {
      console.error('[WebSocket] Auth error:', error);
      this.metrics.errors++;
      this.sendToClient(clientId, {
        type: 'auth_failed',
        message: 'Invalid token',
      });
    }
  }

  private handleSubscribe(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated || !message.frameworkId) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Not authenticated or missing frameworkId',
      });
      return;
    }

    // Create subscription channel
    const channel = `alerts:${client.workspaceId}:${message.frameworkId}`;

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }

    this.subscriptions.get(channel)!.add(clientId);
    client.subscriptions.add(channel);
    client.frameworkId = message.frameworkId;

    this.sendToClient(clientId, {
      type: 'subscribed',
      channel,
      frameworkId: message.frameworkId,
    });

    console.log(`[WebSocket] Client ${clientId} subscribed to ${channel}`);
  }

  private handleUnsubscribe(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client || !message.frameworkId) return;

    const channel = `alerts:${client.workspaceId}:${message.frameworkId}`;
    const subscribers = this.subscriptions.get(channel);

    if (subscribers) {
      subscribers.delete(clientId);
      client.subscriptions.delete(channel);

      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      channel,
    });

    console.log(`[WebSocket] Client ${clientId} unsubscribed from ${channel}`);
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all subscriptions
      client.subscriptions.forEach((channel) => {
        const subscribers = this.subscriptions.get(channel);
        if (subscribers) {
          subscribers.delete(clientId);
          if (subscribers.size === 0) {
            this.subscriptions.delete(channel);
          }
        }
      });

      this.clients.delete(clientId);
      this.metrics.connected_clients = this.clients.size;

      console.log(`[WebSocket] Client ${clientId} disconnected (total: ${this.metrics.connected_clients})`);
    }
  }

  private checkHeartbeat() {
    const now = Date.now();
    const timeout = 60000; // 60 seconds

    const clientsToRemove: string[] = [];

    this.clients.forEach((client, clientId) => {
      if (now - client.lastPing > timeout) {
        console.warn(`[WebSocket] Client ${clientId} timeout - terminating connection`);
        client.socket.terminate();
        clientsToRemove.push(clientId);
      } else if (client.socket.readyState === 1) {
        // Send ping only if connection is open
        client.socket.ping();
      }
    });

    // Remove timed-out clients
    clientsToRemove.forEach((clientId) => this.handleDisconnect(clientId));
  }

  // Public API Methods

  /**
   * Broadcast alert to all subscribers of a framework
   */
  async broadcastAlert(
    workspaceId: string,
    frameworkId: string,
    alert: any
  ): Promise<number> {
    const channel = `alerts:${workspaceId}:${frameworkId}`;
    const subscribers = this.subscriptions.get(channel);

    if (!subscribers || subscribers.size === 0) {
      return 0;
    }

    const message: WebSocketMessage = {
      type: 'alert',
      data: alert,
    };

    const messageStr = JSON.stringify(message);
    let successCount = 0;

    subscribers.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client && client.socket.readyState === 1) {
        try {
          client.socket.send(messageStr);
          successCount++;
          this.metrics.messages_sent++;
        } catch (error) {
          console.error(`[WebSocket] Failed to send to client ${clientId}:`, error);
          this.metrics.errors++;
        }
      }
    });

    return successCount;
  }

  /**
   * Broadcast to all clients in a workspace
   */
  async broadcastToWorkspace(workspaceId: string, message: any): Promise<number> {
    let successCount = 0;

    this.clients.forEach((client) => {
      if (client.workspaceId === workspaceId && client.socket.readyState === 1) {
        try {
          client.socket.send(JSON.stringify(message));
          successCount++;
          this.metrics.messages_sent++;
        } catch (error) {
          console.error(`[WebSocket] Broadcast error:`, error);
          this.metrics.errors++;
        }
      }
    });

    return successCount;
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: WebSocketMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== 1) {
      return false;
    }

    try {
      client.socket.send(JSON.stringify(message));
      this.metrics.messages_sent++;
      return true;
    } catch (error) {
      console.error(`[WebSocket] Send error to ${clientId}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Get server metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      active_subscriptions: this.subscriptions.size,
      total_subscribers: Array.from(this.subscriptions.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
    };
  }

  /**
   * Get client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Shutdown server
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.socket.close(1000, 'Server shutting down');
    });

    // Close server
    if (this.wss) {
      this.wss.close();
    }

    console.log('[WebSocket] Server shut down');
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const alertWebSocketServer = new AlertWebSocketServer();

export default AlertWebSocketServer;
