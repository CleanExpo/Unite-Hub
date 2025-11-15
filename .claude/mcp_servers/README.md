# MCP Servers for Unite-Hub

This directory contains Model Context Protocol (MCP) server configurations for Unite-Hub.

## What is MCP?

MCP (Model Context Protocol) is an open standard for providing context to AI applications. It standardizes how AI agents access:
- File systems
- Databases
- APIs
- Tools
- External services

Think of MCP as "USB-C for AI applications" - a universal connector.

## Current MCP Servers

### 1. Playwright MCP

**Configured in**: `.claude/mcp.json`

**Purpose**: Browser automation for testing and web scraping

**Configuration**:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_BROWSER": "chromium",
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

**Usage**:
- E2E testing of dashboard
- Visual regression testing
- Automated UI testing

## Planned MCP Servers (Post-V1)

### 2. File System MCP

**Purpose**: Structured file operations for agents

**Use Cases**:
- File search and navigation
- Bulk file operations
- Code refactoring across multiple files

**Not Needed for V1**: Use built-in `text_editor_20250728` tool instead

### 3. Database MCP

**Purpose**: Direct database inspection and queries

**Use Cases**:
- Schema inspection
- Data validation
- Performance analysis

**Not Needed for V1**: Use Supabase client directly

### 4. Git MCP

**Purpose**: Advanced git operations

**Use Cases**:
- Branch management
- Commit history analysis
- Code archaeology

**Not Needed for V1**: Use `bash_20250124` tool for git commands

## MCP Server Development

### Creating a Custom MCP Server

See Claude Developer Docs: https://docs.anthropic.com/en/docs/build-with-claude/mcp

**Basic Structure**:
```typescript
// mcp-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "unite-hub-custom",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Register tools
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "custom_tool",
        description: "Does something useful",
        inputSchema: {
          type: "object",
          properties: {
            param: { type: "string" }
          }
        }
      }
    ]
  };
});

server.setRequestHandler("tools/call", async (request) => {
  // Handle tool execution
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Register in `.claude/mcp.json`**:
```json
{
  "mcpServers": {
    "custom": {
      "command": "node",
      "args": [".claude/mcp_servers/custom/server.js"]
    }
  }
}
```

## Version 1 Constraints

For V1 MVP, we are NOT adding custom MCP servers. Use Claude's built-in tools:

✅ **Use These Built-in Tools**:
- `bash_20250124` - Execute commands
- `text_editor_20250728` - File operations
- `code_execution_20250825` - Run Python code
- `memory_20250818` - Store workflow state

❌ **Do NOT Build for V1**:
- Custom file system MCP
- Custom database MCP
- Custom git MCP
- Any other custom MCP servers

**Reason**: Built-in tools are sufficient for V1 scope. Custom MCP adds complexity without clear benefit for MVP.

## References

- Claude MCP Docs: https://docs.anthropic.com/en/docs/build-with-claude/mcp
- MCP Specification: https://modelcontextprotocol.io
- Remote MCP Servers: https://docs.anthropic.com/en/docs/build-with-claude/mcp-remote-servers

---

**This directory structure exists for future expansion. No custom MCP servers needed for V1.**
