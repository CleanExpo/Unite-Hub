#!/usr/bin/env node

/**
 * Git MCP Server
 * Version control operations: commits, branches, PRs, diffs
 * Prevents blocking terminal during git operations
 *
 * Capabilities:
 * - get_status: Show git status
 * - get_log: View commit history
 * - get_diff: Show changes between commits
 * - create_commit: Stage and commit changes
 * - create_branch: Create new branch
 * - switch_branch: Switch to another branch
 * - get_branches: List all branches
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, TextContent, Tool } from '@modelcontextprotocol/sdk/types.js';
import { execSync, spawn } from 'child_process';
import { createServer as createHttpServer } from 'http';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/workspace';

// HTTP Health check server
const healthServer = createHttpServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

healthServer.listen(3103, 'localhost', () => {
  console.error('[Git MCP] Health server listening on http://localhost:3103');
});

// MCP Server setup
const server = new Server({
  name: 'git-mcp',
  version: '1.0.0',
});

// Tool definitions
const tools = [
  {
    name: 'get_status',
    description: 'Show git status (modified files, staged changes, untracked files).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_log',
    description: 'View recent commit history.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of commits to show (default: 10)',
        },
        format: {
          type: 'string',
          description: 'Format string (default: "%h %s" for hash + subject)',
        },
      },
    },
  },
  {
    name: 'get_diff',
    description: 'Show differences between commits or working directory.',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'From commit/branch (default: HEAD)',
        },
        to: {
          type: 'string',
          description: 'To commit/branch (default: working directory)',
        },
        file: {
          type: 'string',
          description: 'Specific file to diff (optional)',
        },
      },
    },
  },
  {
    name: 'create_commit',
    description: 'Stage all changes and create a commit.',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to stage (optional, defaults to all)',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'create_branch',
    description: 'Create a new branch.',
    inputSchema: {
      type: 'object',
      properties: {
        branch_name: {
          type: 'string',
          description: 'Name of the new branch',
        },
        from: {
          type: 'string',
          description: 'Branch to create from (default: main)',
        },
      },
      required: ['branch_name'],
    },
  },
  {
    name: 'switch_branch',
    description: 'Switch to another branch.',
    inputSchema: {
      type: 'object',
      properties: {
        branch_name: {
          type: 'string',
          description: 'Branch to switch to',
        },
      },
      required: ['branch_name'],
    },
  },
  {
    name: 'get_branches',
    description: 'List all branches (local and remote).',
    inputSchema: {
      type: 'object',
      properties: {
        remote: {
          type: 'boolean',
          description: 'Show remote branches (default: false)',
        },
      },
    },
  },
];

/**
 * Tool implementations
 */

function executeGit(command, options = {}) {
  try {
    const result = execSync(`git ${command}`, {
      cwd: WORKSPACE_ROOT,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    });
    return result.trim();
  } catch (error) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

async function get_status(args) {
  try {
    const status = executeGit('status --porcelain');
    const summary = executeGit('status --short --branch');

    return {
      type: 'text',
      text: `Git Status:\n\n${summary}\n\nDetailed:\n${status || '(clean)'}`,
    };
  } catch (error) {
    throw new Error(`Get status failed: ${error.message}`);
  }
}

async function get_log(args) {
  try {
    const limit = args.limit || 10;
    const format = args.format || '%h %s';
    const log = executeGit(`log -${limit} --pretty=format:"${format}"`);

    return {
      type: 'text',
      text: `Recent commits (last ${limit}):\n\n${log}`,
      metadata: {
        limit,
        format,
      },
    };
  } catch (error) {
    throw new Error(`Get log failed: ${error.message}`);
  }
}

async function get_diff(args) {
  try {
    const from = args.from || 'HEAD';
    const to = args.to || '';
    const file = args.file ? ` -- ${args.file}` : '';

    let command = `diff ${from}`;
    if (to) {
      command += ` ${to}`;
    }
    command += file;

    const diff = executeGit(command);

    return {
      type: 'text',
      text: `Diff:\n\n${diff || '(no differences)'}`,
      metadata: {
        from,
        to: to || 'working directory',
        file: args.file || 'all files',
      },
    };
  } catch (error) {
    throw new Error(`Get diff failed: ${error.message}`);
  }
}

async function create_commit(args) {
  try {
    // Stage files
    if (args.files && args.files.length > 0) {
      executeGit(`add ${args.files.join(' ')}`);
    } else {
      executeGit('add -A');
    }

    // Create commit
    const commitHash = executeGit(`commit -m "${args.message.replace(/"/g, '\\"')}" --quiet && git rev-parse --short HEAD`);

    return {
      type: 'text',
      text: `Commit created: ${commitHash}\n\nMessage: ${args.message}`,
      metadata: {
        message: args.message,
        commit_hash: commitHash,
      },
    };
  } catch (error) {
    throw new Error(`Create commit failed: ${error.message}`);
  }
}

async function create_branch(args) {
  try {
    const from = args.from || 'main';
    executeGit(`branch ${args.branch_name} ${from}`);

    return {
      type: 'text',
      text: `Branch created: ${args.branch_name}\nFrom: ${from}`,
      metadata: {
        branch_name: args.branch_name,
        from,
      },
    };
  } catch (error) {
    throw new Error(`Create branch failed: ${error.message}`);
  }
}

async function switch_branch(args) {
  try {
    executeGit(`checkout ${args.branch_name}`);
    const status = executeGit('status --short --branch');

    return {
      type: 'text',
      text: `Switched to branch: ${args.branch_name}\n\n${status}`,
      metadata: {
        branch_name: args.branch_name,
      },
    };
  } catch (error) {
    throw new Error(`Switch branch failed: ${error.message}`);
  }
}

async function get_branches(args) {
  try {
    const remote = args.remote || false;
    const flag = remote ? '-r' : '-l';
    const branches = executeGit(`branch ${flag}`);

    return {
      type: 'text',
      text: `${remote ? 'Remote' : 'Local'} branches:\n\n${branches}`,
      metadata: {
        remote,
      },
    };
  } catch (error) {
    throw new Error(`Get branches failed: ${error.message}`);
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
      case 'get_status':
        result = await get_status(args);
        break;
      case 'get_log':
        result = await get_log(args);
        break;
      case 'get_diff':
        result = await get_diff(args);
        break;
      case 'create_commit':
        result = await create_commit(args);
        break;
      case 'create_branch':
        result = await create_branch(args);
        break;
      case 'switch_branch':
        result = await switch_branch(args);
        break;
      case 'get_branches':
        result = await get_branches(args);
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
  console.error('[Git MCP] Server started via stdio');
}

main().catch((error) => {
  console.error('[Git MCP] Fatal error:', error);
  process.exit(1);
});
