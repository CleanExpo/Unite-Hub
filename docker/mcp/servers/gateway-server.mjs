#!/usr/bin/env node

/**
 * MCP Gateway Server
 * Routes requests to all MCP servers, handles auto-discovery and health checks
 * Unified entry point for Claude Code
 */

import Fastify from 'fastify';
import FastifyRateLimit from '@fastify/rate-limit';
import FastifyCors from '@fastify/cors';

// Use Node.js built-in fetch (available in Node 18+)

const PORT = parseInt(process.env.MCP_GATEWAY_PORT || '3200');
const LOG_LEVEL = process.env.MCP_LOG_LEVEL || 'info';

// Parse MCP_SERVERS environment variable
const parseServers = () => {
  const serverString = process.env.MCP_SERVERS || '';
  const servers = {};

  serverString.split(',').forEach((entry) => {
    const [name, host, port] = entry.trim().split(':');
    if (name && host && port) {
      servers[name] = {
        name,
        host,
        port: parseInt(port),
        url: `http://${host}:${port}`,
        status: 'unknown',
      };
    }
  });

  return servers;
};

const servers = parseServers();

console.error(`[MCP Gateway] Discovered servers:`, Object.keys(servers));

// Initialize Fastify
const fastify = Fastify({
  logger: LOG_LEVEL === 'debug',
});

// Rate limiting
await fastify.register(FastifyRateLimit, {
  max: parseInt(process.env.RATE_LIMIT_REQUESTS || '1000'),
  timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
});

// CORS
await fastify.register(FastifyCors, {
  origin: true,
});

/**
 * Health check all servers on startup
 */
async function checkServerHealth() {
  console.error('[MCP Gateway] Checking server health...');

  for (const [name, server] of Object.entries(servers)) {
    try {
      const response = await fetch(`${server.url}/health`, {
        timeout: 5000,
      });

      if (response.ok) {
        server.status = 'healthy';
        console.error(`✓ ${name}: healthy`);
      } else {
        server.status = 'unhealthy';
        console.error(`✗ ${name}: unhealthy (status: ${response.status})`);
      }
    } catch (error) {
      server.status = 'unreachable';
      console.error(`✗ ${name}: unreachable (${error.message})`);
    }
  }
}

/**
 * Routes
 */

// Gateway health
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    servers: Object.fromEntries(
      Object.entries(servers).map(([name, server]) => [
        name,
        {
          status: server.status,
          host: server.host,
          port: server.port,
        },
      ])
    ),
  };
});

// List all available MCPs
fastify.get('/mcps', async (request, reply) => {
  return {
    gateway: {
      port: PORT,
      version: '1.0.0',
    },
    servers: Object.fromEntries(
      Object.entries(servers).map(([name, server]) => [
        name,
        {
          url: server.url,
          status: server.status,
          endpoint: `/mcp/${name}`,
        },
      ])
    ),
  };
});

// Proxy MCP requests
fastify.all<{ Params: { server: string } }>('/mcp/:server/*', async (request, reply) => {
  const { server: serverName } = request.params;
  const server = servers[serverName];

  if (!server) {
    reply.statusCode = 404;
    return { error: `Server not found: ${serverName}` };
  }

  if (server.status === 'unreachable') {
    reply.statusCode = 503;
    return { error: `Server is unreachable: ${serverName}` };
  }

  try {
    // Build target URL
    const path = request.url.replace(`/mcp/${serverName}`, '');
    const targetUrl = `${server.url}${path}`;

    // Forward request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...request.headers,
        host: server.host,
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined,
      timeout: 30000,
    });

    const contentType = response.headers.get('content-type');
    reply.type(contentType || 'application/json');

    const body = await response.text();
    reply.statusCode = response.status;
    return body;
  } catch (error) {
    reply.statusCode = 502;
    return { error: `Proxy error: ${error.message}` };
  }
});

// Catch-all 404
fastify.all('*', async (request, reply) => {
  reply.statusCode = 404;
  return {
    error: 'Not found',
    message: 'See GET /mcps for available endpoints',
  };
});

/**
 * Startup
 */

async function start() {
  try {
    // Check server health
    await checkServerHealth();

    // Start gateway
    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    console.error(`[MCP Gateway] ✓ Running on http://localhost:${PORT}`);
    console.error(`[MCP Gateway] Endpoints:`);
    console.error(`  - Health: GET /health`);
    console.error(`  - List MCPs: GET /mcps`);
    console.error(`  - Proxy: /mcp/{server}/*`);
  } catch (error) {
    console.error('[MCP Gateway] Fatal error:', error);
    process.exit(1);
  }
}

start();
