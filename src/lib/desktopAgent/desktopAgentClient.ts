/**
 * Desktop Agent Client - Synthex Integration
 *
 * Manages WebSocket connection to Synthex desktop agent via Nexus protocol.
 * Handles command dispatch, session management, heartbeats, and error recovery.
 */

import { log } from '@/lib/logger';

export interface DesktopAgentConfig {
  workspaceId: string;
  userId: string;
  sessionId: string;
  apiKey: string;
  agentVersion?: string;
}

export interface AgentCommandRequest {
  commandName: string;
  parameters: Record<string, any>;
  timeout?: number;
}

export interface AgentCommandResponse {
  success: boolean;
  result?: Record<string, any>;
  error?: string;
  executionTimeMs?: number;
}

export interface AgentSessionStatus {
  sessionId: string;
  connected: boolean;
  lastHeartbeat: Date;
  heartbeatCount: number;
  commandCount: number;
  errorCount: number;
}

/**
 * Desktop Agent Client
 * Manages Synthex agent connection and command execution
 */
export class DesktopAgentClient {
  private config: DesktopAgentConfig;
  private websocket: WebSocket | null = null;
  private sessionId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private commandQueue: Map<string, any> = new Map();
  private stats = {
    commands: 0,
    successes: 0,
    failures: 0,
    heartbeats: 0,
  };

  constructor(config: DesktopAgentConfig) {
    this.config = config;
    this.sessionId = config.sessionId;
  }

  /**
   * Initialize connection to Synthex agent
   */
  async connect(): Promise<boolean> {
    try {
      const agentEndpoint = process.env.SYNTHEX_AGENT_ENDPOINT || 'wss://agent.synthex.local/nexus';

      log.info('Connecting to desktop agent', {
        endpoint: agentEndpoint,
        sessionId: this.sessionId,
      });

      // In production, establish actual WebSocket
      // For now, simulate successful connection
      if (typeof window !== 'undefined') {
        try {
          this.websocket = new WebSocket(agentEndpoint);

          this.websocket.onopen = () => {
            log.info('Desktop agent connected', { sessionId: this.sessionId });
            this.startHeartbeat();
          };

          this.websocket.onerror = (event) => {
            log.error('Desktop agent connection error', { event, sessionId: this.sessionId });
          };

          this.websocket.onclose = () => {
            log.warn('Desktop agent disconnected', { sessionId: this.sessionId });
            this.stopHeartbeat();
          };

          this.websocket.onmessage = (event) => {
            this.handleMessage(event.data);
          };
        } catch (error) {
          log.warn('WebSocket not available in current environment', { error });
        }
      }

      return true;
    } catch (error) {
      log.error('Failed to connect to desktop agent', { error, sessionId: this.sessionId });
      return false;
    }
  }

  /**
   * Send command to agent
   */
  async executeCommand(command: AgentCommandRequest): Promise<AgentCommandResponse> {
    try {
      this.stats.commands++;

      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        log.warn('Agent not connected, attempting reconnect', { sessionId: this.sessionId });
        await this.connect();
      }

      const commandId = crypto.randomUUID();
      const timeout = command.timeout || 30000;

      const payload = {
        id: commandId,
        type: 'command',
        sessionId: this.sessionId,
        workspaceId: this.config.workspaceId,
        userId: this.config.userId,
        command: {
          name: command.commandName,
          parameters: command.parameters,
        },
      };

      // Send command via WebSocket
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(payload));
      } else {
        log.warn('WebSocket not available, simulating command execution', { commandId });
      }

      // Wait for response with timeout
      const response = await this.waitForResponse(commandId, timeout);

      if (response.success) {
        this.stats.successes++;
      } else {
        this.stats.failures++;
      }

      return response;
    } catch (error) {
      this.stats.failures++;
      log.error('Command execution failed', {
        error,
        command: command.commandName,
        sessionId: this.sessionId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get session status
   */
  getSessionStatus(): AgentSessionStatus {
    return {
      sessionId: this.sessionId,
      connected: this.websocket?.readyState === WebSocket.OPEN || false,
      lastHeartbeat: new Date(),
      heartbeatCount: this.stats.heartbeats,
      commandCount: this.stats.commands,
      errorCount: this.stats.failures,
    };
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(
          JSON.stringify({
            type: 'heartbeat',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
          })
        );
        this.stats.heartbeats++;
      }
    }, 30000); // 30-second heartbeat
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle incoming message from agent
   */
  private handleMessage(rawData: string): void {
    try {
      const message = JSON.parse(rawData);

      if (message.type === 'response') {
        this.commandQueue.set(message.id, message.data);
      } else if (message.type === 'error') {
        this.commandQueue.set(message.id, { error: message.message });
      }
    } catch (error) {
      log.error('Failed to parse agent message', { error, sessionId: this.sessionId });
    }
  }

  /**
   * Wait for command response
   */
  private async waitForResponse(commandId: string, timeout: number): Promise<AgentCommandResponse> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.commandQueue.has(commandId)) {
          clearInterval(checkInterval);
          const result = this.commandQueue.get(commandId);
          this.commandQueue.delete(commandId);
          resolve({
            success: !result.error,
            result: result.result,
            error: result.error,
            executionTimeMs: Date.now() - startTime,
          });
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve({
            success: false,
            error: `Command timeout (${timeout}ms)`,
          });
        }
      }, 100);
    });
  }

  /**
   * Disconnect from agent
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    log.info('Desktop agent disconnected', { sessionId: this.sessionId });
  }
}

/**
 * Create a desktop agent client instance
 */
export async function createDesktopAgentClient(config: DesktopAgentConfig): Promise<DesktopAgentClient> {
  const client = new DesktopAgentClient(config);
  await client.connect();
  return client;
}
