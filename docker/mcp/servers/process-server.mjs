#!/usr/bin/env node

/**
 * Process MCP Server
 * Executes bash commands and manages long-running processes
 * Prevents VS terminal from blocking during builds/commands
 *
 * Capabilities:
 * - execute_command: Run bash commands with timeout
 * - execute_background: Run background processes
 * - get_process_output: Stream stdout/stderr
 * - kill_process: Terminate running process
 * - list_processes: Show running MCP-spawned processes
 * - docker_control: Start/stop/restart Docker containers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { execSync, spawn, exec } from 'child_process';
import { createServer as createHttpServer } from 'http';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/workspace';
const COMMAND_TIMEOUT_MS = parseInt(process.env.COMMAND_TIMEOUT_MS || '300000'); // 5 min default
const MAX_CONCURRENT_PROCESSES = parseInt(process.env.MAX_CONCURRENT_PROCESSES || '5');
const ENABLE_DOCKER_CONTROL = process.env.ENABLE_DOCKER_CONTROL === 'true';

// Process tracking
const processes = new Map();
let processCounter = 0;

// HTTP Health check server
const healthServer = createHttpServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      active_processes: processes.size,
      max_concurrent: MAX_CONCURRENT_PROCESSES,
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

healthServer.listen(3101, 'localhost', () => {
  console.error('[Process MCP] Health server listening on http://localhost:3101');
});

// MCP Server setup
const server = new Server({
  name: 'process-mcp',
  version: '1.0.0',
});

// Tool definitions
const tools = [
  {
    name: 'execute_command',
    description: 'Execute a bash command synchronously. Returns stdout/stderr.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Bash command to execute',
        },
        cwd: {
          type: 'string',
          description: 'Working directory (relative to workspace, default: ".")',
        },
        timeout_ms: {
          type: 'number',
          description: `Command timeout in milliseconds (default: ${COMMAND_TIMEOUT_MS})`,
        },
        shell: {
          type: 'string',
          description: 'Shell to use (default: "/bin/bash")',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'execute_background',
    description: 'Execute a command in the background. Returns process ID for monitoring.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Bash command to execute',
        },
        name: {
          type: 'string',
          description: 'Human-readable process name',
        },
        cwd: {
          type: 'string',
          description: 'Working directory (relative to workspace)',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'get_process_output',
    description: 'Get output from a background process.',
    inputSchema: {
      type: 'object',
      properties: {
        process_id: {
          type: 'string',
          description: 'Process ID returned from execute_background',
        },
      },
      required: ['process_id'],
    },
  },
  {
    name: 'kill_process',
    description: 'Terminate a background process.',
    inputSchema: {
      type: 'object',
      properties: {
        process_id: {
          type: 'string',
          description: 'Process ID to terminate',
        },
        signal: {
          type: 'string',
          description: 'Signal to send (default: "SIGTERM", use "SIGKILL" for force)',
        },
      },
      required: ['process_id'],
    },
  },
  {
    name: 'list_processes',
    description: 'List all MCP-spawned background processes.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'docker_control',
    description: 'Control Docker containers (start, stop, restart, logs).',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['start', 'stop', 'restart', 'logs', 'list', 'inspect'],
          description: 'Docker action to perform',
        },
        container: {
          type: 'string',
          description: 'Container name or ID',
        },
        lines: {
          type: 'number',
          description: 'Number of log lines to retrieve (for "logs" action)',
        },
      },
      required: ['action'],
    },
  },
];

/**
 * Tool implementations
 */

async function execute_command(args) {
  const cwd = args.cwd ? `${WORKSPACE_ROOT}/${args.cwd}` : WORKSPACE_ROOT;
  const timeoutMs = args.timeout_ms || COMMAND_TIMEOUT_MS;
  const shell = args.shell || '/bin/bash';

  try {
    const startTime = Date.now();

    const result = execSync(args.command, {
      cwd,
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      shell,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const duration = Date.now() - startTime;

    return {
      type: 'text',
      text: result || '(command completed with no output)',
      metadata: {
        command: args.command,
        cwd: cwd,
        duration_ms: duration,
        exit_code: 0,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      type: 'text',
      text: `Command failed:\n${error.message}\n\nStdout:\n${error.stdout || '(none)'}\n\nStderr:\n${error.stderr || '(none)'}`,
      metadata: {
        command: args.command,
        cwd: cwd,
        duration_ms: duration,
        exit_code: error.status || -1,
      },
      isError: true,
    };
  }
}

async function execute_background(args) {
  if (processes.size >= MAX_CONCURRENT_PROCESSES) {
    throw new Error(`Too many concurrent processes (max: ${MAX_CONCURRENT_PROCESSES})`);
  }

  const processId = `proc_${++processCounter}`;
  const cwd = args.cwd ? `${WORKSPACE_ROOT}/${args.cwd}` : WORKSPACE_ROOT;

  try {
    const child = spawn('bash', ['-c', args.command], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    const processInfo = {
      id: processId,
      name: args.name || args.command.substring(0, 50),
      pid: child.pid,
      command: args.command,
      cwd,
      started: new Date(),
      stdout: [],
      stderr: [],
      status: 'running',
    };

    // Capture output without blocking
    child.stdout.on('data', (data) => {
      processInfo.stdout.push(data.toString());
    });

    child.stderr.on('data', (data) => {
      processInfo.stderr.push(data.toString());
    });

    child.on('close', (code) => {
      processInfo.status = 'completed';
      processInfo.exit_code = code;
      processInfo.ended = new Date();
    });

    processes.set(processId, processInfo);

    return {
      type: 'text',
      text: `Background process started: ${processId}\nName: ${processInfo.name}\nPID: ${child.pid}`,
      metadata: {
        process_id: processId,
        pid: child.pid,
        name: processInfo.name,
      },
    };
  } catch (error) {
    throw new Error(`Failed to start background process: ${error.message}`);
  }
}

async function get_process_output(args) {
  const process = processes.get(args.process_id);

  if (!process) {
    throw new Error(`Process not found: ${args.process_id}`);
  }

  const output = {
    process_id: args.process_id,
    name: process.name,
    status: process.status,
    pid: process.pid,
    started: process.started.toISOString(),
    stdout: process.stdout.join(''),
    stderr: process.stderr.join(''),
  };

  if (process.exit_code !== undefined) {
    output.exit_code = process.exit_code;
    output.ended = process.ended.toISOString();
  }

  return {
    type: 'text',
    text: `Process Output (${args.process_id}):\n\nSTDOUT:\n${output.stdout || '(none)'}\n\nSTDERR:\n${output.stderr || '(none)'}`,
    metadata: output,
  };
}

async function kill_process(args) {
  const process = processes.get(args.process_id);

  if (!process) {
    throw new Error(`Process not found: ${args.process_id}`);
  }

  try {
    const signal = args.signal || 'SIGTERM';
    process.kill(-process.pid, signal); // Negative PID kills process group
    process.status = 'terminated';

    return {
      type: 'text',
      text: `Process terminated: ${args.process_id}\nSignal: ${signal}\nPID: ${process.pid}`,
    };
  } catch (error) {
    throw new Error(`Failed to kill process: ${error.message}`);
  }
}

async function list_processes() {
  const processList = Array.from(processes.values()).map((p) => ({
    id: p.id,
    name: p.name,
    pid: p.pid,
    status: p.status,
    started: p.started.toISOString(),
  }));

  return {
    type: 'text',
    text: processList.length === 0
      ? 'No active processes'
      : `Active processes (${processList.length}/${MAX_CONCURRENT_PROCESSES}):\n${processList.map(
          (p) => `${p.id}: ${p.name} (PID: ${p.pid}) - ${p.status}`
        ).join('\n')}`,
    metadata: {
      active_count: processList.length,
      max_concurrent: MAX_CONCURRENT_PROCESSES,
      processes: processList,
    },
  };
}

async function docker_control(args) {
  if (!ENABLE_DOCKER_CONTROL) {
    throw new Error('Docker control is disabled');
  }

  try {
    let result;

    switch (args.action) {
      case 'list':
        result = execSync('docker ps -a --format "table {{.Names}}\t{{.Status}}"', {
          encoding: 'utf-8',
        });
        break;

      case 'logs':
        if (!args.container) throw new Error('Container name required for logs action');
        const lines = args.lines || 50;
        result = execSync(`docker logs --tail ${lines} ${args.container}`, {
          encoding: 'utf-8',
          maxBuffer: 5 * 1024 * 1024,
        });
        break;

      case 'start':
      case 'stop':
      case 'restart':
        if (!args.container) throw new Error(`Container name required for ${args.action} action`);
        result = execSync(`docker ${args.action} ${args.container}`, {
          encoding: 'utf-8',
        });
        result = `Container ${args.action}ed: ${args.container}`;
        break;

      case 'inspect':
        if (!args.container) throw new Error('Container name required for inspect action');
        result = execSync(`docker inspect ${args.container}`, {
          encoding: 'utf-8',
        });
        break;

      default:
        throw new Error(`Unknown Docker action: ${args.action}`);
    }

    return {
      type: 'text',
      text: result,
      metadata: {
        action: args.action,
        container: args.container,
      },
    };
  } catch (error) {
    throw new Error(`Docker control failed: ${error.message}`);
  }
}

/**
 * MCP Request Handlers
 */

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'execute_command':
        result = await execute_command(args);
        break;
      case 'execute_background':
        result = await execute_background(args);
        break;
      case 'get_process_output':
        result = await get_process_output(args);
        break;
      case 'kill_process':
        result = await kill_process(args);
        break;
      case 'list_processes':
        result = await list_processes();
        break;
      case 'docker_control':
        result = await docker_control(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [result] };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Process MCP] Server started via stdio');
}

main().catch((error) => {
  console.error('[Process MCP] Fatal error:', error);
  process.exit(1);
});
