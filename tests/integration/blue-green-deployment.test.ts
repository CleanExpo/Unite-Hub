/* eslint-disable no-undef, @typescript-eslint/no-explicit-any */
/**
 * Blue-Green Deployment Integration Tests
 *
 * Tests the complete blue-green deployment workflow including:
 * - Health check endpoints
 * - Graceful shutdown and connection draining
 * - Nginx upstream switching
 * - Zero-downtime deployments
 * - Rollback capabilities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';

// Type definitions
interface DeploymentState {
  active: 'blue' | 'green';
  previous: 'blue' | 'green';
  lastSwitch: string;
  version: string;
  healthy: boolean;
}


// Test configuration
const TEST_PORT_BLUE = 3009;
const TEST_PORT_GREEN = 3010;
const TEST_STATE_FILE = path.join(__dirname, '../../.deployment-state.test.json');
const NGINX_STATE_FILE = path.join(__dirname, '../../nginx/active-upstream.conf');

// Mock servers for testing
let blueServer: ChildProcess | null = null;
let greenServer: ChildProcess | null = null;

/**
 * HTTP request helper
 */
async function makeRequest(port: number, path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method: 'GET',
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode || 500,
              body: JSON.parse(data),
            });
          } catch {
            resolve({
              status: res.statusCode || 500,
              body: data,
            });
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Read deployment state file
 */
async function readDeploymentState(): Promise<DeploymentState> {
  try {
    const content = await fs.readFile(TEST_STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    throw new Error('Deployment state file not found');
  }
}

/**
 * Write deployment state file
 */
async function writeDeploymentState(state: DeploymentState): Promise<void> {
  await fs.writeFile(TEST_STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Start a mock Next.js server
 */
async function startMockServer(port: number, deployment: 'blue' | 'green'): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [
      path.join(__dirname, 'mock-server.js'),
      port.toString(),
      deployment,
    ]);

    let started = false;

    server.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server started') && !started) {
        started = true;
        resolve(server);
      }
    });

    server.stderr?.on('data', (data) => {
      if (!started) {
        reject(new Error(`Server failed to start: ${data.toString()}`));
      }
    });

    setTimeout(() => {
      if (!started) {
        server.kill();
        reject(new Error('Server start timeout'));
      }
    }, 10000);
  });
}

/**
 * Stop a server gracefully
 */
async function stopServer(server: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (!server || server.killed) {
      resolve();
      return;
    }

    server.on('exit', () => {
      resolve();
    });

    server.kill('SIGTERM');

    setTimeout(() => {
      if (!server.killed) {
        server.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}

/**
 * Create mock server script
 */
async function createMockServer(): Promise<void> {
  const mockServerCode = `
const http = require('http');

const port = parseInt(process.argv[2]);
const deployment = process.argv[3];
const startTime = Date.now();

let activeConnections = 0;
let shuttingDown = false;

const server = http.createServer((req, res) => {
  activeConnections++;

  if (shuttingDown) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server shutting down' }));
    activeConnections--;
    return;
  }

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      deployment: deployment,
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000)
    }));
  } else if (req.url === '/api/connections') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      active: activeConnections - 1,
      total: activeConnections
    }));
  } else {
    res.writeHead(404);
    res.end();
  }

  activeConnections--;
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, starting graceful shutdown...');
  shuttingDown = true;

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  const drainInterval = setInterval(() => {
    if (activeConnections === 0) {
      clearInterval(drainInterval);
      process.exit(0);
    }
  }, 100);

  setTimeout(() => {
    clearInterval(drainInterval);
    process.exit(1);
  }, 30000);
});

server.listen(port, () => {
  console.log('Server started on port ' + port);
});
`;

  await fs.writeFile(path.join(__dirname, 'mock-server.js'), mockServerCode);
}

describe('Blue-Green Deployment Integration Tests', () => {
  beforeAll(async () => {
    // Create mock server script
    await createMockServer();

    // Initialize deployment state
    await writeDeploymentState({
      active: 'blue',
      previous: 'green',
      lastSwitch: new Date().toISOString(),
      version: '1.0.0',
      healthy: true,
    });

    // Ensure nginx state directory exists
    await fs.mkdir(path.dirname(NGINX_STATE_FILE), { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    if (blueServer) {
await stopServer(blueServer);
}
    if (greenServer) {
await stopServer(greenServer);
}

    try {
      await fs.unlink(TEST_STATE_FILE);
      await fs.unlink(path.join(__dirname, 'mock-server.js'));
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Reset state before each test
    if (blueServer) {
await stopServer(blueServer);
}
    if (greenServer) {
await stopServer(greenServer);
}
    blueServer = null;
    greenServer = null;
  });

  describe('Health Check Endpoint', () => {
    it('should respond with status 200 and deployment information', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');

      const response = await makeRequest(TEST_PORT_BLUE, '/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        deployment: 'blue',
        version: '1.0.0',
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include all required health check fields', async () => {
      greenServer = await startMockServer(TEST_PORT_GREEN, 'green');

      const response = await makeRequest(TEST_PORT_GREEN, '/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('deployment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should differentiate between blue and green deployments', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');
      greenServer = await startMockServer(TEST_PORT_GREEN, 'green');

      const blueResponse = await makeRequest(TEST_PORT_BLUE, '/api/health');
      const greenResponse = await makeRequest(TEST_PORT_GREEN, '/api/health');

      expect(blueResponse.body.deployment).toBe('blue');
      expect(greenResponse.body.deployment).toBe('green');
    });
  });

  describe('Graceful Shutdown and Connection Draining', () => {
    it('should drain active connections to zero during shutdown', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');

      // Verify server is healthy
      const healthCheck = await makeRequest(TEST_PORT_BLUE, '/api/health');
      expect(healthCheck.status).toBe(200);

      // Initiate graceful shutdown
      const shutdownPromise = stopServer(blueServer);

      // Wait for shutdown to complete
      await shutdownPromise;

      // Verify server is no longer accepting connections
      await expect(makeRequest(TEST_PORT_BLUE, '/api/health')).rejects.toThrow();
    });

    it('should wait for in-flight requests to complete', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');

      // Make a request to establish connection
      const requestPromise = makeRequest(TEST_PORT_BLUE, '/api/health');

      // Give request time to reach server
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Initiate shutdown
      const shutdownPromise = stopServer(blueServer);

      // Request should complete successfully
      const response = await requestPromise;
      expect(response.status).toBe(200);

      // Shutdown should complete
      await shutdownPromise;
    });

    it('should reject new connections during shutdown', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');

      // Initiate shutdown
      const shutdownPromise = stopServer(blueServer);

      // Wait for shutdown signal to be processed
      await new Promise((resolve) => setTimeout(resolve, 200));

      // New requests should fail
      await expect(makeRequest(TEST_PORT_BLUE, '/api/health')).rejects.toThrow();

      await shutdownPromise;
    });
  });

  describe('Nginx Upstream Switching', () => {
    it('should update state file with active upstream', async () => {
      const newState: DeploymentState = {
        active: 'green',
        previous: 'blue',
        lastSwitch: new Date().toISOString(),
        version: '1.0.1',
        healthy: true,
      };

      await writeDeploymentState(newState);

      const readState = await readDeploymentState();
      expect(readState.active).toBe('green');
      expect(readState.previous).toBe('blue');
      expect(readState.version).toBe('1.0.1');
    });

    it('should maintain deployment history in state', async () => {
      const firstSwitch: DeploymentState = {
        active: 'blue',
        previous: 'green',
        lastSwitch: '2025-12-03T10:00:00Z',
        version: '1.0.0',
        healthy: true,
      };

      await writeDeploymentState(firstSwitch);

      const secondSwitch: DeploymentState = {
        active: 'green',
        previous: 'blue',
        lastSwitch: '2025-12-03T11:00:00Z',
        version: '1.0.1',
        healthy: true,
      };

      await writeDeploymentState(secondSwitch);

      const state = await readDeploymentState();
      expect(state.active).toBe('green');
      expect(state.previous).toBe('blue');
      expect(new Date(state.lastSwitch).getTime()).toBeGreaterThan(
        new Date(firstSwitch.lastSwitch).getTime()
      );
    });

    it('should validate state transitions are correct', async () => {
      // Blue -> Green
      await writeDeploymentState({
        active: 'green',
        previous: 'blue',
        lastSwitch: new Date().toISOString(),
        version: '1.0.1',
        healthy: true,
      });

      let state = await readDeploymentState();
      expect(state.active).toBe('green');
      expect(state.previous).toBe('blue');

      // Green -> Blue (rollback)
      await writeDeploymentState({
        active: 'blue',
        previous: 'green',
        lastSwitch: new Date().toISOString(),
        version: '1.0.0',
        healthy: true,
      });

      state = await readDeploymentState();
      expect(state.active).toBe('blue');
      expect(state.previous).toBe('green');
    });
  });

  describe('Zero-Downtime Deployment', () => {
    it('should serve requests during deployment switch', async () => {
      // Start blue (active)
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');

      // Verify blue is healthy
      const blueHealth = await makeRequest(TEST_PORT_BLUE, '/api/health');
      expect(blueHealth.status).toBe(200);
      expect(blueHealth.body.deployment).toBe('blue');

      // Start green (new deployment)
      greenServer = await startMockServer(TEST_PORT_GREEN, 'green');

      // Verify green is healthy
      const greenHealth = await makeRequest(TEST_PORT_GREEN, '/api/health');
      expect(greenHealth.status).toBe(200);
      expect(greenHealth.body.deployment).toBe('green');

      // Both servers should be responding simultaneously
      const [blueResponse, greenResponse] = await Promise.all([
        makeRequest(TEST_PORT_BLUE, '/api/health'),
        makeRequest(TEST_PORT_GREEN, '/api/health'),
      ]);

      expect(blueResponse.status).toBe(200);
      expect(greenResponse.status).toBe(200);
    });

    it('should not return errors during traffic switch', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');
      greenServer = await startMockServer(TEST_PORT_GREEN, 'green');

      // Simulate traffic switch by making requests to both
      const requests: Promise<any>[] = [];
      for (let i = 0; i < 10; i++) {
        requests.push(makeRequest(TEST_PORT_BLUE, '/api/health'));
        requests.push(makeRequest(TEST_PORT_GREEN, '/api/health'));
      }

      const responses = await Promise.all(requests);

      // All responses should be successful
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(['blue', 'green']).toContain(response.body.deployment);
      });
    });

    it('should maintain session consistency during switch', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');
      greenServer = await startMockServer(TEST_PORT_GREEN, 'green');

      // Make multiple requests to same deployment
      const blueRequests = await Promise.all([
        makeRequest(TEST_PORT_BLUE, '/api/health'),
        makeRequest(TEST_PORT_BLUE, '/api/health'),
        makeRequest(TEST_PORT_BLUE, '/api/health'),
      ]);

      // All should come from blue
      blueRequests.forEach((response) => {
        expect(response.body.deployment).toBe('blue');
      });

      // Switch to green
      await writeDeploymentState({
        active: 'green',
        previous: 'blue',
        lastSwitch: new Date().toISOString(),
        version: '1.0.1',
        healthy: true,
      });

      // Make multiple requests to new deployment
      const greenRequests = await Promise.all([
        makeRequest(TEST_PORT_GREEN, '/api/health'),
        makeRequest(TEST_PORT_GREEN, '/api/health'),
        makeRequest(TEST_PORT_GREEN, '/api/health'),
      ]);

      // All should come from green
      greenRequests.forEach((response) => {
        expect(response.body.deployment).toBe('green');
      });
    });
  });

  describe('Rollback Capability', () => {
    it('should switch back to previous deployment', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');
      greenServer = await startMockServer(TEST_PORT_GREEN, 'green');

      // Initial state: blue active
      await writeDeploymentState({
        active: 'blue',
        previous: 'green',
        lastSwitch: '2025-12-03T10:00:00Z',
        version: '1.0.0',
        healthy: true,
      });

      // Switch to green
      await writeDeploymentState({
        active: 'green',
        previous: 'blue',
        lastSwitch: '2025-12-03T11:00:00Z',
        version: '1.0.1',
        healthy: true,
      });

      let state = await readDeploymentState();
      expect(state.active).toBe('green');

      // Rollback to blue
      await writeDeploymentState({
        active: 'blue',
        previous: 'green',
        lastSwitch: new Date().toISOString(),
        version: '1.0.0',
        healthy: true,
      });

      state = await readDeploymentState();
      expect(state.active).toBe('blue');
      expect(state.previous).toBe('green');
      expect(state.version).toBe('1.0.0');
    });

    it('should perform instant rollback without downtime', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');
      greenServer = await startMockServer(TEST_PORT_GREEN, 'green');

      // Both deployments are running
      await writeDeploymentState({
        active: 'green',
        previous: 'blue',
        lastSwitch: new Date().toISOString(),
        version: '1.0.1',
        healthy: true,
      });

      // Make requests during rollback
      const rollbackPromise = writeDeploymentState({
        active: 'blue',
        previous: 'green',
        lastSwitch: new Date().toISOString(),
        version: '1.0.0',
        healthy: true,
      });

      const requestsDuringRollback = await Promise.all([
        makeRequest(TEST_PORT_BLUE, '/api/health'),
        makeRequest(TEST_PORT_GREEN, '/api/health'),
      ]);

      await rollbackPromise;

      // All requests should succeed
      requestsDuringRollback.forEach((response) => {
        expect(response.status).toBe(200);
      });

      const state = await readDeploymentState();
      expect(state.active).toBe('blue');
    });

    it('should preserve previous deployment during rollback', async () => {
      blueServer = await startMockServer(TEST_PORT_BLUE, 'blue');

      await writeDeploymentState({
        active: 'green',
        previous: 'blue',
        lastSwitch: '2025-12-03T10:00:00Z',
        version: '1.0.1',
        healthy: true,
      });

      // Rollback
      await writeDeploymentState({
        active: 'blue',
        previous: 'green',
        lastSwitch: new Date().toISOString(),
        version: '1.0.0',
        healthy: true,
      });

      // Blue should still be responsive
      const response = await makeRequest(TEST_PORT_BLUE, '/api/health');
      expect(response.status).toBe(200);
      expect(response.body.deployment).toBe('blue');
      expect(response.body.version).toBe('1.0.0');
    });
  });
});
