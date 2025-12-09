/**
 * useAlertWebSocket Hook
 * Client-side WebSocket connection for real-time alerts
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAlertWebSocketOptions {
  workspaceId: string;
  frameworkId: string;
  token: string;
  onAlert?: (alert: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

interface WebSocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  messageCount: number;
}

export function useAlertWebSocket({
  workspaceId,
  frameworkId,
  token,
  onAlert,
  onConnect,
  onDisconnect,
  onError,
  autoReconnect = true,
  reconnectDelay = 3000,
}: UseAlertWebSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const [status, setStatus] = useState<WebSocketStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
    messageCount: 0,
  });

  const connect = useCallback(() => {
    if (status.isConnecting || status.isConnected) {
return;
}

    setStatus((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${typeof window !== 'undefined' ? window.location.host : 'localhost:3008'}`;

      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('[WebSocket] Connected');

        // Authenticate
        socketRef.current?.send(
          JSON.stringify({
            type: 'auth',
            token,
          })
        );

        reconnectAttemptsRef.current = 0;
      };

      socketRef.current.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'auth_success':
              console.log('[WebSocket] Authenticated');
              // Subscribe to framework
              socketRef.current?.send(
                JSON.stringify({
                  type: 'subscribe',
                  frameworkId,
                })
              );

              setStatus((prev) => ({
                ...prev,
                isConnecting: false,
                isConnected: true,
              }));

              onConnect?.();

              // Send ping every 30 seconds
              if (pingIntervalRef.current) {
clearInterval(pingIntervalRef.current);
}
              pingIntervalRef.current = setInterval(() => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                  socketRef.current.send(JSON.stringify({ type: 'ping' }));
                }
              }, 30000);

              break;

            case 'auth_failed':
              console.error('[WebSocket] Authentication failed:', message.message);
              setStatus((prev) => ({
                ...prev,
                isConnecting: false,
                error: 'Authentication failed',
              }));
              onError?.(message.message);
              socketRef.current?.close();
              break;

            case 'subscribed':
              console.log('[WebSocket] Subscribed to', message.channel);
              break;

            case 'alert':
              console.log('[WebSocket] Received alert:', message.data);
              setStatus((prev) => ({
                ...prev,
                messageCount: prev.messageCount + 1,
              }));
              onAlert?.(message.data);
              break;

            case 'error':
              console.error('[WebSocket] Error:', message.message);
              setStatus((prev) => ({
                ...prev,
                error: message.message,
              }));
              onError?.(message.message);
              break;

            case 'pong':
              // Heartbeat response
              break;

            default:
              console.warn('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error);
        }
      };

      socketRef.current.onclose = () => {
        console.log('[WebSocket] Disconnected');

        if (pingIntervalRef.current) {
clearInterval(pingIntervalRef.current);
}

        setStatus((prev) => ({
          ...prev,
          isConnecting: false,
          isConnected: false,
        }));

        onDisconnect?.();

        // Auto-reconnect logic
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setStatus((prev) => ({
            ...prev,
            error: 'Max reconnection attempts exceeded',
          }));
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setStatus((prev) => ({
          ...prev,
          isConnecting: false,
          error: 'Connection error',
        }));
        onError?.('Connection error');
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      setStatus((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection error',
      }));
    }
  }, [workspaceId, frameworkId, token, onAlert, onConnect, onDisconnect, onError, autoReconnect, reconnectDelay]);

  useEffect(() => {
    // Connect on mount
    connect();

    // Cleanup on unmount
    return () => {
      if (pingIntervalRef.current) {
clearInterval(pingIntervalRef.current);
}
      if (reconnectTimeoutRef.current) {
clearTimeout(reconnectTimeoutRef.current);
}

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, 'Component unmount');
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
clearInterval(pingIntervalRef.current);
}
    if (reconnectTimeoutRef.current) {
clearTimeout(reconnectTimeoutRef.current);
}

    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
    }

    setStatus({
      isConnected: false,
      isConnecting: false,
      error: null,
      messageCount: 0,
    });
  }, []);

  const subscribe = useCallback((fwId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          frameworkId: fwId,
        })
      );
    }
  }, []);

  const unsubscribe = useCallback((fwId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'unsubscribe',
          frameworkId: fwId,
        })
      );
    }
  }, []);

  return {
    ...status,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

export default useAlertWebSocket;
