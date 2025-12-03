#!/usr/bin/env node

/**
 * Database MCP Server
 * Handles database queries, migrations, and schema inspection
 * Prevents blocking terminal during long-running database operations
 *
 * Capabilities:
 * - execute_query: Run SQL queries against Supabase
 * - list_tables: Schema inspection and metadata
 * - get_table_schema: Detailed column information
 * - run_migration: Execute SQL migration files
 * - get_query_plan: EXPLAIN ANALYZE for optimization
 * - backup_table: Create timestamped backups
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, TextContent, Tool } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { createServer as createHttpServer } from 'http';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/workspace';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUERY_TIMEOUT_MS = parseInt(process.env.QUERY_TIMEOUT_MS || '30000');
const MAX_RESULT_ROWS = parseInt(process.env.MAX_RESULT_ROWS || '1000');

// HTTP Health check server
const healthServer = createHttpServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: supabase ? 'connected' : 'disconnected',
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

healthServer.listen(3102, 'localhost', () => {
  console.error('[Database MCP] Health server listening on http://localhost:3102');
});

// Initialize Supabase client
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} else {
  console.error('[Database MCP] Warning: Supabase credentials not configured');
}

// MCP Server setup
const server = new Server({
  name: 'database-mcp',
  version: '1.0.0',
});

// Tool definitions
const tools = [
  {
    name: 'execute_query',
    description: 'Execute a SQL query against Supabase database. Returns up to MAX_RESULT_ROWS.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute (SELECT, INSERT, UPDATE, DELETE)',
        },
        params: {
          type: 'array',
          description: 'Query parameters for parameterized queries (optional)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_tables',
    description: 'List all tables in the database with row counts and approximate sizes.',
    inputSchema: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          description: 'Schema name (default: "public")',
        },
      },
    },
  },
  {
    name: 'get_table_schema',
    description: 'Get detailed schema information for a table (columns, types, constraints).',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name',
        },
      },
      required: ['table'],
    },
  },
  {
    name: 'run_migration',
    description: 'Execute a SQL migration file from the supabase/migrations directory.',
    inputSchema: {
      type: 'object',
      properties: {
        migration_file: {
          type: 'string',
          description: 'Relative path to migration file (e.g., "001_init.sql")',
        },
      },
      required: ['migration_file'],
    },
  },
  {
    name: 'get_query_plan',
    description: 'Get EXPLAIN ANALYZE plan for a query (helps optimize slow queries).',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL SELECT query to analyze',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'backup_table',
    description: 'Create a timestamped backup of a table by copying it.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name to backup',
        },
      },
      required: ['table'],
    },
  },
];

/**
 * Tool implementations
 */

async function execute_query(args) {
  if (!supabase) {
    throw new Error('Database not connected');
  }

  try {
    // Use RPC to execute raw SQL for better compatibility
    const { data, error } = await supabase.rpc('execute_raw_sql', {
      sql_query: args.query,
    });

    if (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }

    const rowCount = Array.isArray(data) ? data.length : 1;
    const truncated = rowCount > MAX_RESULT_ROWS;
    const results = Array.isArray(data) ? data.slice(0, MAX_RESULT_ROWS) : data;

    return {
      type: 'text',
      text: `Query executed successfully.\nRows: ${rowCount}${truncated ? ` (showing first ${MAX_RESULT_ROWS})` : ''}\n\n${JSON.stringify(results, null, 2)}`,
      metadata: {
        rows: rowCount,
        truncated,
        max_rows: MAX_RESULT_ROWS,
      },
    };
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
}

async function list_tables(args) {
  if (!supabase) {
    throw new Error('Database not connected');
  }

  try {
    const schema = args.schema || 'public';

    const query = `
      SELECT
        t.table_name,
        (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as table_size
      FROM information_schema.tables t
      WHERE t.table_schema = $1
      ORDER BY t.table_name
    `;

    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', schema);

    if (error) {
      throw new Error(`Failed to list tables: ${error.message}`);
    }

    const tableList = tables.map(t => `${t.table_name}`).join('\n');

    return {
      type: 'text',
      text: `Tables in schema "${schema}" (${tables.length}):\n${tableList}`,
      metadata: {
        schema,
        table_count: tables.length,
      },
    };
  } catch (error) {
    throw new Error(`List tables failed: ${error.message}`);
  }
}

async function get_table_schema(args) {
  if (!supabase) {
    throw new Error('Database not connected');
  }

  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', args.table)
      .order('ordinal_position');

    if (error) {
      throw new Error(`Failed to get schema: ${error.message}`);
    }

    if (columns.length === 0) {
      throw new Error(`Table "${args.table}" not found`);
    }

    const schema = columns
      .map(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        return `${col.column_name} ${col.data_type} ${nullable}${defaultVal}`;
      })
      .join('\n');

    return {
      type: 'text',
      text: `Schema for table "${args.table}":\n\n${schema}`,
      metadata: {
        table: args.table,
        column_count: columns.length,
      },
    };
  } catch (error) {
    throw new Error(`Get table schema failed: ${error.message}`);
  }
}

async function run_migration(args) {
  if (!supabase) {
    throw new Error('Database not connected');
  }

  try {
    const migrationPath = path.join(WORKSPACE_ROOT, 'supabase/migrations', args.migration_file);

    // Validate path is within workspace
    if (!migrationPath.startsWith(WORKSPACE_ROOT)) {
      throw new Error('Access denied: Path outside workspace');
    }

    const migrationContent = await fs.readFile(migrationPath, 'utf-8');

    // Execute migration
    const { data, error } = await supabase.rpc('execute_raw_sql', {
      sql_query: migrationContent,
    });

    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }

    return {
      type: 'text',
      text: `Migration executed successfully: ${args.migration_file}`,
      metadata: {
        migration_file: args.migration_file,
      },
    };
  } catch (error) {
    throw new Error(`Run migration failed: ${error.message}`);
  }
}

async function get_query_plan(args) {
  if (!supabase) {
    throw new Error('Database not connected');
  }

  try {
    const planQuery = `EXPLAIN ANALYZE ${args.query}`;

    const { data, error } = await supabase.rpc('execute_raw_sql', {
      sql_query: planQuery,
    });

    if (error) {
      throw new Error(`Query plan failed: ${error.message}`);
    }

    const plan = Array.isArray(data)
      ? data.map(row => row['QUERY PLAN'] || JSON.stringify(row)).join('\n')
      : JSON.stringify(data, null, 2);

    return {
      type: 'text',
      text: `Query Execution Plan:\n\n${plan}`,
    };
  } catch (error) {
    throw new Error(`Get query plan failed: ${error.message}`);
  }
}

async function backup_table(args) {
  if (!supabase) {
    throw new Error('Database not connected');
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTable = `${args.table}_backup_${timestamp}`;

    const query = `CREATE TABLE ${backupTable} AS SELECT * FROM ${args.table}`;

    const { error } = await supabase.rpc('execute_raw_sql', {
      sql_query: query,
    });

    if (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }

    return {
      type: 'text',
      text: `Table backup created: ${backupTable}`,
      metadata: {
        original_table: args.table,
        backup_table: backupTable,
        timestamp,
      },
    };
  } catch (error) {
    throw new Error(`Backup table failed: ${error.message}`);
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
      case 'execute_query':
        result = await execute_query(args);
        break;
      case 'list_tables':
        result = await list_tables(args);
        break;
      case 'get_table_schema':
        result = await get_table_schema(args);
        break;
      case 'run_migration':
        result = await run_migration(args);
        break;
      case 'get_query_plan':
        result = await get_query_plan(args);
        break;
      case 'backup_table':
        result = await backup_table(args);
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
  console.error('[Database MCP] Server started via stdio');
}

main().catch((error) => {
  console.error('[Database MCP] Fatal error:', error);
  process.exit(1);
});
