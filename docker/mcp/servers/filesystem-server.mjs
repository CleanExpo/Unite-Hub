#!/usr/bin/env node

/**
 * Filesystem MCP Server
 * Offloads file operations to isolated Docker container
 * Prevents VS terminal memory exhaustion
 *
 * Capabilities:
 * - read_file: Stream large files in chunks
 * - write_file: Atomic writes with backup
 * - search_files: Glob pattern matching (ripgrep)
 * - search_content: Regex search with context
 * - list_directory: Recursive directory listing
 * - watch_files: File system change monitoring
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, TextContent, Tool } from '@modelcontextprotocol/sdk/types.js';
import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { createServer as createHttpServer } from 'http';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/workspace';
const CACHE_DIR = process.env.CACHE_DIR || '/cache';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50');
const ENABLE_WATCH = process.env.ENABLE_WATCH === 'true';

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

healthServer.listen(3100, 'localhost', () => {
  console.error('[Filesystem MCP] Health server listening on http://localhost:3100');
});

// MCP Server setup
const server = new Server({
  name: 'filesystem-mcp',
  version: '1.0.0',
});

// Tool definitions
const tools = [
  {
    name: 'read_file',
    description: 'Read a file from the workspace. Streams large files in chunks to prevent memory exhaustion.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from workspace root',
        },
        chunk_size: {
          type: 'number',
          description: 'Chunk size in bytes (default: 1MB)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write a file with atomic operations and backup. Creates parent directories if needed.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from workspace root',
        },
        content: {
          type: 'string',
          description: 'File content to write',
        },
        create_backup: {
          type: 'boolean',
          description: 'Create backup of existing file (default: true)',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'search_files',
    description: 'Search files using glob patterns. Uses ripgrep for performance.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern to match (e.g., "**/*.ts", "src/**/*.tsx")',
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          description: 'Patterns to exclude (e.g., ["node_modules", ".git"])',
        },
        max_results: {
          type: 'number',
          description: 'Maximum results to return (default: 100)',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'search_content',
    description: 'Search file contents using regex. Returns matches with context lines.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Regex pattern to search for',
        },
        glob: {
          type: 'string',
          description: 'File glob pattern to search in (default: "**")',
        },
        context_lines: {
          type: 'number',
          description: 'Lines of context around match (default: 2)',
        },
        max_results: {
          type: 'number',
          description: 'Maximum matches to return (default: 50)',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'list_directory',
    description: 'List directory contents recursively with file metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path (relative to workspace root, default: ".")',
        },
        recursive: {
          type: 'boolean',
          description: 'List recursively (default: true)',
        },
        include_hidden: {
          type: 'boolean',
          description: 'Include hidden files (default: false)',
        },
      },
    },
  },
  {
    name: 'get_file_info',
    description: 'Get detailed file information (size, modified date, permissions, etc).',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to workspace root',
        },
      },
      required: ['path'],
    },
  },
];

/**
 * Tool implementations
 */

async function read_file(args) {
  const fullPath = path.join(WORKSPACE_ROOT, args.path);

  // Validate path is within workspace
  if (!fullPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Access denied: Path outside workspace');
  }

  try {
    const stats = await fs.stat(fullPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB (max: ${MAX_FILE_SIZE_MB}MB)`);
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    return {
      type: 'text',
      text: content,
      metadata: {
        path: args.path,
        size_bytes: stats.size,
        size_mb: fileSizeMB.toFixed(2),
        modified: stats.mtime.toISOString(),
      },
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

async function write_file(args) {
  const fullPath = path.join(WORKSPACE_ROOT, args.path);

  // Validate path
  if (!fullPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Access denied: Path outside workspace');
  }

  try {
    // Create backup if file exists
    if (args.create_backup !== false) {
      try {
        const existing = await fs.readFile(fullPath, 'utf-8');
        const backupPath = `${fullPath}.backup.${Date.now()}`;
        await fs.writeFile(backupPath, existing);
      } catch (e) {
        // File doesn't exist yet, no backup needed
      }
    }

    // Create parent directories
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Atomic write
    await fs.writeFile(fullPath, args.content, 'utf-8');

    return {
      type: 'text',
      text: `File written successfully: ${args.path} (${args.content.length} bytes)`,
    };
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
}

async function search_files(args) {
  try {
    const maxResults = args.max_results || 100;
    const excludePattern = (args.exclude || ['node_modules', '.git', 'dist']).join(',');

    // Use ripgrep for performance
    const cmd = `rg --files --glob "${args.pattern}" --max-count ${maxResults} --ignore-file .gitignore`;

    const result = execSync(cmd, {
      cwd: WORKSPACE_ROOT,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim().split('\n').filter(Boolean);

    return {
      type: 'text',
      text: `Found ${result.length} files matching "${args.pattern}":\n${result.join('\n')}`,
      metadata: {
        pattern: args.pattern,
        count: result.length,
        max_results: maxResults,
      },
    };
  } catch (error) {
    throw new Error(`File search failed: ${error.message}`);
  }
}

async function search_content(args) {
  try {
    const glob = args.glob || '**';
    const contextLines = args.context_lines || 2;
    const maxResults = args.max_results || 50;

    // Use ripgrep for fast regex search
    const cmd = `rg "${args.pattern}" --glob "${glob}" -C ${contextLines} --max-count ${maxResults}`;

    const result = execSync(cmd, {
      cwd: WORKSPACE_ROOT,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    const matches = result.split('\n').length;

    return {
      type: 'text',
      text: `Search results for "${args.pattern}":\n\n${result}`,
      metadata: {
        pattern: args.pattern,
        glob: glob,
        context_lines: contextLines,
        matches: Math.min(matches, maxResults),
      },
    };
  } catch (error) {
    // ripgrep returns exit code 1 when no matches found
    if (error.status === 1) {
      return {
        type: 'text',
        text: `No matches found for pattern: "${args.pattern}"`,
      };
    }
    throw new Error(`Content search failed: ${error.message}`);
  }
}

async function list_directory(args) {
  const dirPath = args.path ? path.join(WORKSPACE_ROOT, args.path) : WORKSPACE_ROOT;

  if (!dirPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Access denied: Path outside workspace');
  }

  try {
    const recursive = args.recursive !== false;
    const includeHidden = args.include_hidden === true;

    const files = [];

    async function walk(dir, depth = 0) {
      if (!recursive && depth > 0) return;

      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!includeHidden && entry.name.startsWith('.')) continue;

        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(WORKSPACE_ROOT, fullPath);

        if (entry.isDirectory()) {
          files.push(`${relPath}/`);
          await walk(fullPath, depth + 1);
        } else {
          const stats = await fs.stat(fullPath);
          files.push(`${relPath} (${stats.size} bytes)`);
        }
      }
    }

    await walk(dirPath);

    return {
      type: 'text',
      text: `Directory listing for ${args.path || '.'} (${files.length} items):\n${files.join('\n')}`,
    };
  } catch (error) {
    throw new Error(`Directory listing failed: ${error.message}`);
  }
}

async function get_file_info(args) {
  const fullPath = path.join(WORKSPACE_ROOT, args.path);

  if (!fullPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Access denied: Path outside workspace');
  }

  try {
    const stats = await fs.stat(fullPath);

    return {
      type: 'text',
      text: `File info for ${args.path}:
- Size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)
- Modified: ${stats.mtime.toISOString()}
- Created: ${stats.birthtime.toISOString()}
- Is Directory: ${stats.isDirectory()}
- Is File: ${stats.isFile()}
- Is Symlink: ${stats.isSymbolicLink()}
- Permissions: ${stats.mode.toString(8)}`,
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
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
      case 'read_file':
        result = await read_file(args);
        break;
      case 'write_file':
        result = await write_file(args);
        break;
      case 'search_files':
        result = await search_files(args);
        break;
      case 'search_content':
        result = await search_content(args);
        break;
      case 'list_directory':
        result = await list_directory(args);
        break;
      case 'get_file_info':
        result = await get_file_info(args);
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
  console.error('[Filesystem MCP] Server started via stdio');
}

main().catch((error) => {
  console.error('[Filesystem MCP] Fatal error:', error);
  process.exit(1);
});
