/**
 * Composio Integration Client
 *
 * Unified API gateway for 800+ third-party app integrations.
 * Uses the official @composio/core SDK for connection management,
 * tool discovery, and action execution.
 *
 * @see .claude/skills/composio/SKILL.md for full documentation
 */

import { Composio } from "@composio/core";

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_USER_ID = process.env.COMPOSIO_USER_ID;

// Re-export useful types from the SDK
export type { Composio };

/**
 * Singleton Composio client instance.
 * Lazy-initialized on first access.
 */
let _client: Composio | null = null;

function getClient(): Composio {
  if (!COMPOSIO_API_KEY) {
    throw new Error(
      "COMPOSIO_API_KEY is not configured. Set it in .env.local"
    );
  }
  if (!_client) {
    _client = new Composio({ apiKey: COMPOSIO_API_KEY });
  }
  return _client;
}

function getUserId(): string {
  if (!COMPOSIO_USER_ID) {
    throw new Error(
      "COMPOSIO_USER_ID is not configured. Set it in .env.local"
    );
  }
  return COMPOSIO_USER_ID;
}

/**
 * Composio client for Unite-Hub server-side operations.
 *
 * Usage:
 *   import { composio } from '@/lib/integrations/composio';
 *
 *   const connections = await composio.listConnections();
 *   const tools = await composio.getTools(['GMAIL_SEND_EMAIL']);
 *   const session = await composio.createSession();
 */
export const composio = {
  /** Get the raw Composio SDK client */
  getClient,

  /**
   * Create a session for the current user.
   * Sessions provide tool access scoped to the user's connections.
   */
  async createSession() {
    const client = getClient();
    return client.create(getUserId());
  },

  /**
   * List all connected accounts for the current user.
   */
  async listConnections() {
    const client = getClient();
    const result = await client.connectedAccounts.list({
      user_id: getUserId(),
    });
    return result.items ?? [];
  },

  /**
   * Get connections filtered by toolkit (e.g., "gmail", "github").
   */
  async getConnectionByApp(toolkitSlug: string) {
    const connections = await this.listConnections();
    return connections.find(
      (c) =>
        c.toolkit?.slug?.toLowerCase() === toolkitSlug.toLowerCase()
    );
  },

  /**
   * Initiate a new OAuth connection for an app.
   * Returns a URL the user must visit to complete authentication.
   */
  async initiateConnection(
    toolkitSlug: string,
    redirectUrl?: string
  ) {
    const client = getClient();
    const session = await client.create(getUserId());
    return session.authorize(toolkitSlug, {
      redirectUrl:
        redirectUrl ??
        `${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3008"}/api/integrations/composio/callback`,
    });
  },

  /**
   * Get tools for specific actions (e.g., ['GMAIL_SEND_EMAIL', 'GMAIL_FETCH_EMAILS']).
   * Returns tools formatted for use with AI agent frameworks.
   */
  async getTools(actions?: string[]) {
    const session = await this.createSession();
    return session.tools(actions ? { actions } : undefined);
  },

  /**
   * Check health of all connections.
   */
  async checkHealth() {
    const connections = await this.listConnections();
    const active = connections.filter((c) => c.status === "ACTIVE");
    const inactive = connections.filter((c) => c.status !== "ACTIVE");
    return {
      active,
      inactive,
      total: connections.length,
      toolkits: active.map((c) => c.toolkit?.slug).filter(Boolean),
    };
  },
};
