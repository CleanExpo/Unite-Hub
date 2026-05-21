// src/lib/ai/features/mcp.ts
// MCP (Model Context Protocol) server registry and builder for Anthropic API requests.
// Capabilities declare which MCP servers they need via features.mcpServers: ['supabase', ...].
// The router resolves names to connection configs and injects them as mcp_servers.
//
// Note: MCP server URLs and auth tokens must be set as environment variables.
// Unknown server names are skipped (logged at warn level) so missing env vars
// don't hard-fail the request.

// ── Types ────────────────────────────────────────────────────────────────────

export interface McpServerConfig {
  /** Display name for logging */
  name: string
  /** WebSocket or HTTP endpoint for the MCP server */
  url: string
  /** Optional API key / auth token */
  authToken?: string
}

// ── Registry ─────────────────────────────────────────────────────────────────

/**
 * Known MCP servers available to capabilities.
 * Add new entries here as MCP integrations are configured.
 * All values are resolved from environment variables at call-time.
 */
export const MCP_SERVER_REGISTRY: Record<string, () => McpServerConfig | null> = {
  supabase: () => {
    const url = process.env.SUPABASE_MCP_URL
    if (!url) return null
    return {
      name: 'supabase',
      url,
      authToken: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  },
  slack: () => {
    const url = process.env.SLACK_MCP_URL
    if (!url) return null
    return {
      name: 'slack',
      url,
      authToken: process.env.SLACK_BOT_TOKEN,
    }
  },
  github: () => {
    const url = process.env.GITHUB_MCP_URL
    if (!url) return null
    return {
      name: 'github',
      url,
      authToken: process.env.GITHUB_TOKEN,
    }
  },
}

// ── Builder ──────────────────────────────────────────────────────────────────

/**
 * Resolve a list of server names to their Anthropic mcp_servers config objects.
 * Unknown names and servers with missing env vars are silently skipped.
 *
 * The returned array is ready to spread into the Anthropic API params:
 *   (params as any).mcp_servers = buildMcpServers(['supabase'])
 */
export function buildMcpServers(
  names: string[]
): Array<{ name: string; url: string; authorization_token?: string }> {
  const servers: Array<{ name: string; url: string; authorization_token?: string }> = []

  for (const name of names) {
    const factory = MCP_SERVER_REGISTRY[name]
    if (!factory) {
      console.warn(`[mcp] Unknown server name: "${name}" — skipping`)
      continue
    }
    const config = factory()
    if (!config) {
      console.warn(`[mcp] Server "${name}" has no URL configured — skipping`)
      continue
    }
    servers.push({
      name: config.name,
      url: config.url,
      ...(config.authToken ? { authorization_token: config.authToken } : {}),
    })
  }

  return servers
}
