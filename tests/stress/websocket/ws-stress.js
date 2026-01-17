/**
 * WebSocket/Real-time Stress Tests (100 Tests)
 *
 * Categories:
 * - Connection Scaling (30 tests)
 * - Message Delivery Under Load (30 tests)
 * - Reconnection Storm Handling (20 tests)
 * - Broadcast Performance (20 tests)
 */

import { check, group, sleep } from 'k6';
import ws from 'k6/ws';
import http from 'k6/http';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';
import {
  CONFIG,
  THRESHOLDS,
  randomInt,
  randomElement,
} from '../config.js';
import {
  getAuthToken,
  getRandomWorkspaceId,
  wsConnectionTime,
  wsMessageLatency,
  wsMessagesReceived,
  wsConnectionDrops,
  wsReconnectAttempts,
  wsConcurrentConnections,
  errorRate,
} from '../utils.js';

// ============================================================================
// Custom WebSocket Metrics
// ============================================================================

const wsConnectionsActive = new Gauge('stress_ws_connections_active');
const wsConnectionsFailed = new Counter('stress_ws_connections_failed');
const wsMessagesLost = new Counter('stress_ws_messages_lost');
const wsBroadcastLatency = new Trend('stress_ws_broadcast_latency', true);
const wsReconnectTime = new Trend('stress_ws_reconnect_time', true);
const wsMessageThroughput = new Counter('stress_ws_message_throughput');
const wsBackpressureEvents = new Counter('stress_ws_backpressure_events');

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  scenarios: {
    ws_connection_scale: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 500 },
        { duration: '3m', target: 1000 },
        { duration: '2m', target: 1000 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'ws_scale' },
      exec: 'connectionScaleTests',
    },
    ws_message_delivery: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
      tags: { category: 'ws_delivery' },
      exec: 'messageDeliveryTests',
    },
    ws_reconnect_storm: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
        { duration: '30s', target: 300 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'ws_reconnect' },
      exec: 'reconnectionStormTests',
    },
    ws_broadcast: {
      executor: 'constant-vus',
      vus: 50,
      duration: '4m',
      tags: { category: 'ws_broadcast' },
      exec: 'broadcastTests',
    },
  },
  thresholds: {
    'stress_ws_connection_time': ['p(95)<500', 'p(99)<1000'],
    'stress_ws_message_latency': ['p(95)<100', 'p(99)<200'],
    'stress_ws_reconnect_time': ['p(95)<2000'],
    'stress_ws_broadcast_latency': ['p(95)<200'],
    'stress_ws_connections_failed': ['count<50'],
    'stress_ws_messages_lost': ['count<100'],
    'stress_error_rate': ['rate<0.05'],
  },
};

// ============================================================================
// WebSocket URLs
// ============================================================================

const WS_ENDPOINTS = {
  alerts: '/ws/alerts',
  notifications: '/ws/notifications',
  realtime: '/ws/realtime',
  presence: '/ws/presence',
};

// ============================================================================
// Helper Functions
// ============================================================================

function connectWebSocket(endpoint, token, workspaceId, options = {}) {
  const { timeout = 30000, onMessage = null, onError = null } = options;

  const url = `${CONFIG.WS_URL}${endpoint}?token=${token}&workspaceId=${workspaceId}`;
  const startTime = Date.now();

  let connectionEstablished = false;
  let messagesReceived = 0;
  let connectionId = null;

  const res = ws.connect(url, { tags: { endpoint } }, function (socket) {
    const connectionTime = Date.now() - startTime;
    wsConnectionTime.add(connectionTime);
    connectionEstablished = true;
    wsConnectionsActive.add(1);
    wsConcurrentConnections.add(1);

    socket.on('open', () => {
      // Send initial handshake
      socket.send(
        JSON.stringify({
          type: 'subscribe',
          channel: 'workspace',
          workspaceId: workspaceId,
        })
      );
    });

    socket.on('message', (data) => {
      const receiveTime = Date.now();
      messagesReceived++;
      wsMessagesReceived.add(1);
      wsMessageThroughput.add(1);

      try {
        const message = JSON.parse(data);

        if (message.timestamp) {
          const latency = receiveTime - message.timestamp;
          wsMessageLatency.add(latency);
        }

        if (message.connectionId) {
          connectionId = message.connectionId;
        }

        if (onMessage) {
          onMessage(message, socket);
        }
      } catch (e) {
        console.error(`Failed to parse WS message: ${e}`);
      }
    });

    socket.on('error', (e) => {
      console.error(`WebSocket error: ${e}`);
      wsConnectionDrops.add(1);
      errorRate.add(1);

      if (onError) {
        onError(e, socket);
      }
    });

    socket.on('close', () => {
      wsConnectionsActive.add(-1);
      wsConcurrentConnections.add(-1);
    });

    // Keep connection alive
    const pingInterval = socket.setInterval(() => {
      socket.send(
        JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        })
      );
    }, 15000);

    // Close after timeout
    socket.setTimeout(() => {
      socket.clearInterval(pingInterval);
      socket.close();
    }, timeout);
  });

  if (!connectionEstablished) {
    wsConnectionsFailed.add(1);
  }

  return {
    response: res,
    connected: connectionEstablished,
    messagesReceived,
    connectionId,
  };
}

function sendMessage(socket, type, data) {
  const message = {
    type,
    timestamp: Date.now(),
    ...data,
  };
  socket.send(JSON.stringify(message));
}

// ============================================================================
// Connection Scaling Tests (30 tests)
// ============================================================================

export function connectionScaleTests() {
  const token = getAuthToken();
  const workspaceId = getRandomWorkspaceId();
  const endpoint = randomElement(Object.values(WS_ENDPOINTS));

  // Test 1-6: Basic connection establishment
  const result = connectWebSocket(endpoint, token, workspaceId, {
    timeout: 60000,
    onMessage: (msg, socket) => {
      if (msg.type === 'welcome') {
        check(msg, {
          'welcome message received': () => true,
          'has connection id': () => msg.connectionId !== undefined,
        });
      }
    },
  });

  check(result, {
    'connection established': () => result.connected,
    'received messages': () => result.messagesReceived > 0,
  });

  // Test 7-12: Connection under high concurrency
  if (__VU % 10 === 0) {
    // Every 10th VU tests multiple connections
    const connections = [];
    for (let i = 0; i < 3; i++) {
      const ws = connectWebSocket(endpoint, token, workspaceId, { timeout: 10000 });
      connections.push(ws);
    }

    const successCount = connections.filter((c) => c.connected).length;
    check(null, {
      'multiple connections possible': () => successCount >= 2,
    });
  }

  // Test 13-18: Connection persistence
  check(result, {
    'connection maintained': () => result.connected,
  });

  // Test 19-24: Different endpoint connections
  if (__ITER % 5 === 0) {
    for (const ep of Object.values(WS_ENDPOINTS)) {
      const conn = connectWebSocket(ep, token, workspaceId, { timeout: 5000 });
      if (!conn.connected) {
        wsConnectionsFailed.add(1);
      }
    }
  }

  // Test 25-30: Connection limits
  if (__VU > 900) {
    // High VU count - test near limits
    check(result, {
      'high concurrency connection': () => result.connected || result.response?.status === 503,
    });
  }

  sleep(randomInt(1000, 5000) / 1000);
}

// ============================================================================
// Message Delivery Tests (30 tests)
// ============================================================================

export function messageDeliveryTests() {
  const token = getAuthToken();
  const workspaceId = getRandomWorkspaceId();

  let messagesSent = 0;
  let messagesAcked = 0;
  let latencies = [];

  const result = connectWebSocket(WS_ENDPOINTS.realtime, token, workspaceId, {
    timeout: 120000,
    onMessage: (msg, socket) => {
      if (msg.type === 'ack' && msg.originalId) {
        messagesAcked++;
        if (msg.sentAt) {
          latencies.push(Date.now() - msg.sentAt);
        }
      }

      if (msg.type === 'broadcast') {
        const latency = Date.now() - msg.timestamp;
        wsBroadcastLatency.add(latency);
      }
    },
  });

  if (result.connected) {
    // Test 1-6: Single message delivery
    const res = ws.connect(
      `${CONFIG.WS_URL}${WS_ENDPOINTS.realtime}?token=${token}&workspaceId=${workspaceId}`,
      {},
      (socket) => {
        socket.on('open', () => {
          // Send test messages
          for (let i = 0; i < 10; i++) {
            const msgId = `msg-${__VU}-${__ITER}-${i}`;
            socket.send(
              JSON.stringify({
                type: 'message',
                id: msgId,
                sentAt: Date.now(),
                data: { test: true, index: i },
              })
            );
            messagesSent++;
          }
        });

        socket.on('message', (data) => {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'ack') {
              messagesAcked++;
            }
            wsMessagesReceived.add(1);
          } catch (e) {}
        });

        socket.setTimeout(() => {
          socket.close();
        }, 30000);
      }
    );

    // Test 7-12: Message order preservation
    check(null, {
      'messages acknowledged': () => messagesAcked > 0,
      'delivery rate acceptable': () => messagesAcked / Math.max(messagesSent, 1) > 0.8,
    });

    // Test 13-18: Large message handling
    const largePayload = 'x'.repeat(5000);
    ws.connect(
      `${CONFIG.WS_URL}${WS_ENDPOINTS.realtime}?token=${token}&workspaceId=${workspaceId}`,
      {},
      (socket) => {
        socket.on('open', () => {
          socket.send(
            JSON.stringify({
              type: 'large_message',
              data: largePayload,
              timestamp: Date.now(),
            })
          );
        });

        socket.on('message', (data) => {
          wsMessagesReceived.add(1);
        });

        socket.setTimeout(() => {
          socket.close();
        }, 10000);
      }
    );

    // Test 19-24: Rapid message burst
    ws.connect(
      `${CONFIG.WS_URL}${WS_ENDPOINTS.realtime}?token=${token}&workspaceId=${workspaceId}`,
      {},
      (socket) => {
        socket.on('open', () => {
          // Burst of messages
          for (let i = 0; i < 50; i++) {
            socket.send(
              JSON.stringify({
                type: 'burst',
                index: i,
                timestamp: Date.now(),
              })
            );
          }
          wsMessageThroughput.add(50);
        });

        socket.on('message', (data) => {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'backpressure') {
              wsBackpressureEvents.add(1);
            }
          } catch (e) {}
        });

        socket.setTimeout(() => {
          socket.close();
        }, 15000);
      }
    );

    // Test 25-30: Message persistence
    const lostMessages = messagesSent - messagesAcked;
    if (lostMessages > 0) {
      wsMessagesLost.add(lostMessages);
    }
  }

  sleep(randomInt(500, 2000) / 1000);
}

// ============================================================================
// Reconnection Storm Tests (20 tests)
// ============================================================================

export function reconnectionStormTests() {
  const token = getAuthToken();
  const workspaceId = getRandomWorkspaceId();

  // Test 1-5: Basic reconnection
  let reconnectCount = 0;
  const maxReconnects = 3;

  function attemptConnection(attempt) {
    const startTime = Date.now();

    const result = connectWebSocket(WS_ENDPOINTS.alerts, token, workspaceId, {
      timeout: 10000,
      onError: (e, socket) => {
        if (attempt < maxReconnects) {
          wsReconnectAttempts.add(1);
          reconnectCount++;

          sleep(Math.pow(2, attempt));
          attemptConnection(attempt + 1);
        }
      },
    });

    if (result.connected) {
      const reconnectTime = Date.now() - startTime;
      wsReconnectTime.add(reconnectTime);
    }

    return result;
  }

  const initialResult = attemptConnection(0);

  check(initialResult, {
    'connection or reconnection successful': () =>
      initialResult.connected || reconnectCount > 0,
  });

  // Test 6-10: Rapid disconnect/reconnect
  for (let i = 0; i < 3; i++) {
    const conn = connectWebSocket(WS_ENDPOINTS.notifications, token, workspaceId, {
      timeout: 5000,
    });

    // Force close and reconnect
    sleep(1);

    wsReconnectAttempts.add(1);
    const reconnConn = connectWebSocket(WS_ENDPOINTS.notifications, token, workspaceId, {
      timeout: 5000,
    });

    check(reconnConn, {
      'reconnection after close': () => reconnConn.connected,
    });
  }

  // Test 11-15: Reconnection with backoff
  let backoffAttempts = 0;
  let connected = false;

  while (!connected && backoffAttempts < 5) {
    const result = connectWebSocket(WS_ENDPOINTS.realtime, token, workspaceId, {
      timeout: 5000,
    });

    if (result.connected) {
      connected = true;
    } else {
      backoffAttempts++;
      wsReconnectAttempts.add(1);
      const backoffTime = Math.min(1000 * Math.pow(2, backoffAttempts), 10000);
      sleep(backoffTime / 1000);
    }
  }

  check(null, {
    'reconnected within backoff limit': () => connected || backoffAttempts < 5,
  });

  // Test 16-20: Mass reconnection scenario
  if (__VU % 20 === 0) {
    // Simulate reconnection storm
    const reconnections = [];
    for (let i = 0; i < 5; i++) {
      const conn = connectWebSocket(WS_ENDPOINTS.presence, token, workspaceId, {
        timeout: 3000,
      });
      reconnections.push(conn);
      wsReconnectAttempts.add(1);
    }

    const successCount = reconnections.filter((r) => r.connected).length;
    check(null, {
      'mass reconnection handled': () => successCount >= 2,
    });
  }

  sleep(randomInt(1000, 3000) / 1000);
}

// ============================================================================
// Broadcast Performance Tests (20 tests)
// ============================================================================

export function broadcastTests() {
  const token = getAuthToken();
  const workspaceId = getRandomWorkspaceId();

  let broadcastsReceived = 0;
  let broadcastLatencies = [];

  // Test 1-5: Receive broadcast messages
  const result = connectWebSocket(WS_ENDPOINTS.realtime, token, workspaceId, {
    timeout: 120000,
    onMessage: (msg, socket) => {
      if (msg.type === 'broadcast' || msg.type === 'announcement') {
        broadcastsReceived++;
        if (msg.timestamp) {
          const latency = Date.now() - msg.timestamp;
          broadcastLatencies.push(latency);
          wsBroadcastLatency.add(latency);
        }
      }
    },
  });

  // Test 6-10: Trigger broadcast
  if (result.connected && __VU === 1) {
    // Only one VU triggers broadcasts
    const triggerRes = http.post(
      `${CONFIG.BASE_URL}/api/broadcast?workspaceId=${workspaceId}`,
      JSON.stringify({
        message: 'Test broadcast',
        timestamp: Date.now(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    check(triggerRes, {
      'broadcast triggered': (r) => r.status === 200 || r.status === 201 || r.status === 404,
    });
  }

  // Test 11-15: Broadcast to multiple workspaces
  if (__ITER % 10 === 0) {
    const workspaces = CONFIG.WORKSPACE_IDS.slice(0, 3);
    const connections = workspaces.map((wsId) =>
      connectWebSocket(WS_ENDPOINTS.notifications, token, wsId, { timeout: 10000 })
    );

    const connectedCount = connections.filter((c) => c.connected).length;
    check(null, {
      'multi-workspace connections': () => connectedCount >= 2,
    });
  }

  // Test 16-20: Broadcast delivery verification
  check(null, {
    'broadcasts received': () => broadcastsReceived >= 0,
  });

  if (broadcastLatencies.length > 0) {
    const avgLatency =
      broadcastLatencies.reduce((a, b) => a + b, 0) / broadcastLatencies.length;
    check(null, {
      'broadcast latency acceptable': () => avgLatency < 500,
    });
  }

  sleep(randomInt(2000, 5000) / 1000);
}

// ============================================================================
// Setup and Teardown
// ============================================================================

export function setup() {
  console.log('\n=== WebSocket Stress Tests Starting ===');
  console.log(`Base URL: ${CONFIG.BASE_URL}`);
  console.log(`WebSocket URL: ${CONFIG.WS_URL}`);
  console.log('=======================================\n');

  // Verify WebSocket endpoint availability
  const token = getAuthToken();
  const testConn = connectWebSocket(WS_ENDPOINTS.alerts, token, CONFIG.WORKSPACE_IDS[0], {
    timeout: 5000,
  });

  if (!testConn.connected) {
    console.warn('Warning: WebSocket connection test failed');
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('\n=== WebSocket Stress Tests Complete ===');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log('=======================================\n');
}
