/**
 * MCP Suburb Authority Server - Entry Point
 * Provides suburb authority data to Scout Agent via Model Context Protocol
 */

import { config as loadEnv } from 'dotenv';
import { Server } from './server.js';
import { createLogger } from './utils/logger.js';

// Load environment variables
loadEnv();

const log = createLogger('Main');

// Load configuration from environment
const config = {
  supabase: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  transport: (process.env.MCP_TRANSPORT as 'stdio' | 'sse') || 'stdio',
  port: parseInt(process.env.MCP_PORT || '3009', 10),
};

// Validate configuration
if (!config.supabase.supabaseUrl || !config.supabase.supabaseServiceRoleKey) {
  log.error('Missing required environment variables:');
  log.error('  NEXT_PUBLIC_SUPABASE_URL');
  log.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create and start server
const server = new Server(config);

server.start().catch((error) => {
  log.error('Fatal error starting MCP server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  log.info('Received SIGINT, shutting down gracefully...');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM, shutting down gracefully...');
  await server.shutdown();
  process.exit(0);
});

log.info('MCP Suburb Authority Server started successfully');
