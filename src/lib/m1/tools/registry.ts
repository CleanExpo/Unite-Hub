/**
 * M1 Tool Registry
 *
 * Central registry of all tools available to agents. All tools must be explicitly
 * allowlisted here - agents cannot call tools outside this registry.
 *
 * This is the "policy" layer that enforces what tools agents can use.
 */

import type { ToolDefinition, ToolScope } from "../types";

/**
 * Core M1 Tools
 *
 * These are the foundational tools for the agent control layer:
 * 1. tool_registry_list - Inspect available tools (read scope)
 * 2. tool_policy_check - Validate before execution (read scope)
 * 3. request_approval - Ask for approval (execute scope)
 * 4. log_agent_run - Record execution (write scope)
 */
export const TOOL_REGISTRY: Map<string, ToolDefinition> = new Map([
  [
    "tool_registry_list",
    {
      name: "tool_registry_list",
      description:
        "List all available tools and their scopes. Used by agents to discover what operations they can perform.",
      scope: "read",
      parameters: {
        filter: {
          type: "string",
          description: "Optional: filter by scope (read|write|execute) or name pattern",
        },
      },
    },
  ],

  [
    "tool_policy_check",
    {
      name: "tool_policy_check",
      description:
        "Validate a tool call against policy. Checks if tool exists, scope is allowed, and approval is satisfied. Returns policy decision before execution.",
      scope: "read",
      parameters: {
        toolName: {
          type: "string",
          description: "Name of the tool to validate",
        },
        scope: {
          type: "string",
          enum: ["read", "write", "execute"],
          description: "The scope of the operation",
        },
        approvalToken: {
          type: "string",
          description: "Optional: approval token for write/execute scope",
        },
        args: {
          type: "object",
          description: "Optional: arguments that would be passed",
        },
      },
    },
  ],

  [
    "request_approval",
    {
      name: "request_approval",
      description:
        "Request explicit approval for a restricted operation (write/execute scope). Returns an approval token if granted by authority.",
      scope: "execute",
      requiresApproval: true, // Meta: this tool itself needs approval
      parameters: {
        toolName: {
          type: "string",
          description: "Tool that needs approval",
        },
        reason: {
          type: "string",
          description: "Why this action is needed",
        },
        scope: {
          type: "string",
          enum: ["write", "execute"],
          description: "Level of approval needed",
        },
        args: {
          type: "object",
          description: "Arguments for the tool",
        },
      },
    },
  ],

  [
    "log_agent_run",
    {
      name: "log_agent_run",
      description:
        "Record an agent execution run to the observability system. Logs run metadata, tool calls, and results for audit trail.",
      scope: "write",
      parameters: {
        runId: {
          type: "string",
          description: "Unique run identifier (UUID)",
        },
        agentName: {
          type: "string",
          description: "Name of the agent",
        },
        goal: {
          type: "string",
          description: "What the agent was asked to do",
        },
        toolCalls: {
          type: "array",
          description: "Array of tool calls made during this run",
        },
        stopReason: {
          type: "string",
          enum: ["completed", "limit_exceeded", "approval_required", "policy_denied", "error"],
          description: "Why the run ended",
        },
      },
    },
  ],
]);

/**
 * Tool metadata cache
 * Allows fast lookups by scope
 */
class ToolRegistryManager {
  private registry: Map<string, ToolDefinition>;
  private byScope: Map<ToolScope, Set<string>>;

  constructor(registry: Map<string, ToolDefinition>) {
    this.registry = registry;
    this.byScope = new Map([
      ["read", new Set()],
      ["write", new Set()],
      ["execute", new Set()],
    ]);

    // Index by scope
    for (const [name, def] of registry.entries()) {
      this.byScope.get(def.scope)?.add(name);
    }
  }

  /**
   * Get a tool definition
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.registry.get(name);
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * List all tools, optionally filtered
   */
  listTools(filterScope?: ToolScope): ToolDefinition[] {
    if (filterScope) {
      const names = this.byScope.get(filterScope) || new Set();
      return Array.from(names)
        .map((name) => this.registry.get(name)!)
        .filter(Boolean);
    }

    return Array.from(this.registry.values());
  }

  /**
   * Get tools by scope
   */
  getToolsByScope(scope: ToolScope): ToolDefinition[] {
    const names = this.byScope.get(scope) || new Set();
    return Array.from(names)
      .map((name) => this.registry.get(name)!)
      .filter(Boolean);
  }

  /**
   * Check if tool call needs approval
   */
  requiresApproval(toolName: string): boolean {
    const tool = this.registry.get(toolName);
    if (!tool) {
return false;
} // Non-existent tool will fail policy check

    // Write and execute scope always need approval
    if (tool.scope === "write" || tool.scope === "execute") {
      return true;
    }

    // Can be overridden per tool
    return tool.requiresApproval ?? false;
  }

  /**
   * Validate a tool name exists
   */
  validateToolExists(name: string): { valid: boolean; error?: string } {
    if (!this.hasTool(name)) {
      return {
        valid: false,
        error: `Tool "${name}" is not registered. Use tool_registry_list to see available tools.`,
      };
    }

    return { valid: true };
  }

  /**
   * Get tool scope
   */
  getToolScope(name: string): ToolScope | undefined {
    return this.registry.get(name)?.scope;
  }
}

/**
 * Singleton instance
 */
export const registry = new ToolRegistryManager(TOOL_REGISTRY);

/**
 * Export for testing/inspection
 */
export function getToolRegistry(): Map<string, ToolDefinition> {
  return new Map(TOOL_REGISTRY);
}

/**
 * Export manager for direct use
 */
export { ToolRegistryManager };
