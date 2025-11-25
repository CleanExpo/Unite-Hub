/**
 * Execution Bridge
 * Phase 4: Task 3 - Real-Time Frontend-Backend Communication
 *
 * Bridges backend execution state with frontend UI via:
 * - WebSocket connections for real-time updates
 * - Server-Sent Events (SSE) for fallback
 * - State synchronization
 * - Event broadcasting
 *
 * @module lib/strategy/execution-bridge
 */

import type { ExecutionContext, AgentTask, ExecutionMetrics } from './execution-engine';
import type { HealthMetrics } from './execution-health-monitor';

export type BridgeEventType =
  | 'execution-started'
  | 'task-assigned'
  | 'task-progress'
  | 'task-completed'
  | 'task-failed'
  | 'health-update'
  | 'metrics-update'
  | 'execution-paused'
  | 'execution-resumed'
  | 'execution-completed'
  | 'execution-cancelled'
  | 'error';

export interface BridgeEvent {
  type: BridgeEventType;
  executionId: string;
  timestamp: Date;
  data: any;
}

export interface BridgeListener {
  (event: BridgeEvent): void;
}

export interface ExecutionState {
  execution: ExecutionContext;
  tasks: AgentTask[];
  health: HealthMetrics;
  metrics: ExecutionMetrics;
  lastUpdate: Date;
}

/**
 * Execution Bridge - Manages real-time communication between backend and frontend
 */
export class ExecutionBridge {
  private listeners: Map<string, Set<BridgeListener>> = new Map();
  private executionStates: Map<string, ExecutionState> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();
  private sseConnections: Map<string, EventSource> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register event listener
   */
  on(eventType: BridgeEventType, listener: BridgeListener, executionId: string): void {
    const key = `${eventType}_${executionId}`;

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(listener);
  }

  /**
   * Unregister event listener
   */
  off(eventType: BridgeEventType, listener: BridgeListener, executionId: string): void {
    const key = `${eventType}_${executionId}`;
    const listeners = this.listeners.get(key);

    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Broadcast event to all listeners
   */
  broadcast(event: BridgeEvent): void {
    const key = `${event.type}_${event.executionId}`;
    const listeners = this.listeners.get(key);

    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }

    // Also broadcast to wildcard listeners
    const wildcardKey = `*_${event.executionId}`;
    const wildcardListeners = this.listeners.get(wildcardKey);

    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  /**
   * Establish WebSocket connection
   */
  async connectWebSocket(executionId: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url);

        ws.onopen = () => {
          console.log(`[ExecutionBridge] WebSocket connected for execution ${executionId}`);
          this.wsConnections.set(executionId, ws);

          // Start polling backend for updates
          this.startUpdatePolling(executionId);

          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.broadcast({
            type: 'error',
            executionId,
            timestamp: new Date(),
            data: { error: 'WebSocket connection error' },
          });
        };

        ws.onclose = () => {
          console.log(`[ExecutionBridge] WebSocket closed for execution ${executionId}`);
          this.wsConnections.delete(executionId);

          // Try SSE fallback
          this.connectSSE(executionId, url.replace(/^wss?/, 'https'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Establish SSE connection (fallback)
   */
  connectSSE(executionId: string, baseUrl: string): void {
    try {
      const url = `${baseUrl}/api/executions/${executionId}/stream`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        this.sseConnections.delete(executionId);

        // Try reconnecting in 5 seconds
        setTimeout(() => this.connectSSE(executionId, baseUrl), 5000);
      };

      this.sseConnections.set(executionId, eventSource);
      console.log(`[ExecutionBridge] SSE connected for execution ${executionId}`);
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: any): void {
    if (!message.type || !message.executionId) {
      console.warn('Invalid message format:', message);
      return;
    }

    const event: BridgeEvent = {
      type: message.type,
      executionId: message.executionId,
      timestamp: new Date(message.timestamp || Date.now()),
      data: message.data,
    };

    // Update local state
    if (message.execution || message.tasks || message.health || message.metrics) {
      const currentState = this.executionStates.get(message.executionId) || {
        execution: {},
        tasks: [],
        health: {},
        metrics: {},
        lastUpdate: new Date(),
      };

      this.executionStates.set(message.executionId, {
        ...currentState,
        ...(message.execution && { execution: message.execution }),
        ...(message.tasks && { tasks: message.tasks }),
        ...(message.health && { health: message.health }),
        ...(message.metrics && { metrics: message.metrics }),
        lastUpdate: new Date(),
      });
    }

    // Broadcast event
    this.broadcast(event);
  }

  /**
   * Send message via WebSocket
   */
  send(executionId: string, message: any): void {
    const ws = this.wsConnections.get(executionId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ ...message, timestamp: new Date() }));
    } else {
      console.warn(`WebSocket not connected for execution ${executionId}`);
    }
  }

  /**
   * Start polling backend for updates
   */
  private startUpdatePolling(executionId: string): void {
    // Prevent duplicate intervals
    if (this.updateIntervals.has(executionId)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/executions/${executionId}/status`);

        if (!response.ok) {
          console.warn(`Failed to fetch execution status: ${response.status}`);
          return;
        }

        const data = await response.json();

        // Broadcast updates
        if (data.execution) {
          this.broadcast({
            type: 'health-update',
            executionId,
            timestamp: new Date(),
            data: data,
          });
        }
      } catch (error) {
        console.error('Failed to poll execution status:', error);
      }
    }, 5000); // Poll every 5 seconds

    this.updateIntervals.set(executionId, interval);
  }

  /**
   * Stop polling backend
   */
  private stopUpdatePolling(executionId: string): void {
    const interval = this.updateIntervals.get(executionId);

    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(executionId);
    }
  }

  /**
   * Get current execution state
   */
  getState(executionId: string): ExecutionState | undefined {
    return this.executionStates.get(executionId);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(executionId: string, callback: (state: ExecutionState) => void): () => void {
    const listener = (event: BridgeEvent) => {
      const state = this.executionStates.get(executionId);
      if (state) {
        callback(state);
      }
    };

    this.on('*', listener, executionId);

    // Return unsubscribe function
    return () => {
      this.off('*', listener, executionId);
    };
  }

  /**
   * Pause execution via bridge
   */
  async pauseExecution(executionId: string): Promise<void> {
    await fetch(`/api/executions/${executionId}/pause`, {
      method: 'POST',
    });

    this.broadcast({
      type: 'execution-paused',
      executionId,
      timestamp: new Date(),
      data: {},
    });
  }

  /**
   * Resume execution via bridge
   */
  async resumeExecution(executionId: string): Promise<void> {
    await fetch(`/api/executions/${executionId}/resume`, {
      method: 'POST',
    });

    this.broadcast({
      type: 'execution-resumed',
      executionId,
      timestamp: new Date(),
      data: {},
    });
  }

  /**
   * Cancel execution via bridge
   */
  async cancelExecution(executionId: string): Promise<void> {
    await fetch(`/api/executions/${executionId}/cancel`, {
      method: 'POST',
    });

    this.broadcast({
      type: 'execution-cancelled',
      executionId,
      timestamp: new Date(),
      data: {},
    });
  }

  /**
   * Disconnect all connections
   */
  disconnect(executionId: string): void {
    // Close WebSocket
    const ws = this.wsConnections.get(executionId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(executionId);
    }

    // Close SSE
    const sse = this.sseConnections.get(executionId);
    if (sse) {
      sse.close();
      this.sseConnections.delete(executionId);
    }

    // Stop polling
    this.stopUpdatePolling(executionId);

    // Clear state
    this.executionStates.delete(executionId);

    // Clear listeners
    for (const [key] of this.listeners) {
      if (key.endsWith(`_${executionId}`)) {
        this.listeners.delete(key);
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(executionId: string): 'connected' | 'disconnected' | 'connecting' {
    if (this.wsConnections.has(executionId) || this.sseConnections.has(executionId)) {
      return 'connected';
    }

    if (this.updateIntervals.has(executionId)) {
      return 'connecting';
    }

    return 'disconnected';
  }
}

// Export singleton instance
export const executionBridge = new ExecutionBridge();

export default ExecutionBridge;
