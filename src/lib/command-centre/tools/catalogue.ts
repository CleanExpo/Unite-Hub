// src/lib/command-centre/tools/catalogue.ts
//
// READ-ONLY tool-catalogue discovery for the Nexus Command Centre.
//
// This module LISTS the tool sources the command centre is aware of. It NEVER
// invokes, executes, spawns, or connects to any tool — discovery only. It proves
// "access to all tools" with zero execution risk.
//
// Sources:
//   (a) A static, known set of MCP servers + Hermes toolsets + code-execution
//       surfaces from the Nexus spec.
//   (b) Optional read-only enrichment: if a Hermes config file is present we read
//       *server names only* (never values/secrets) and append any not already known.
//
// risk_class / source enums mirror cc_tools in the master spec.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

export type ToolSource = 'hermes' | 'mcp' | 'project' | 'codex' | 'claude-code' | 'local'

export type ToolRiskClass =
  | 'read'
  | 'write-local'
  | 'write-shared'
  | 'external'
  | 'destructive'

export interface CommandCentreTool {
  /** Stable key for the tool / toolset / surface. */
  tool_key: string
  /** Where the capability comes from. */
  source: ToolSource
  /** Human-readable description. */
  description: string
  /** Risk classification (conservative default). */
  risk_class: ToolRiskClass
  /** Whether a human approval is required before any (future) invocation. */
  approval_required: boolean
  /**
   * Discovery is list-only. This flag is ALWAYS false in the starter slice —
   * the catalogue never marks anything as invocable.
   */
  invocable: false
}

/**
 * The static, authoritative known set. MCP servers, Hermes toolsets, and
 * code-execution surfaces named in the Nexus spec (Section "access to all tools").
 */
export const KNOWN_TOOLS: readonly CommandCentreTool[] = [
  // --- MCP servers --------------------------------------------------------
  { tool_key: 'linear', source: 'mcp', description: 'Linear MCP — issues, projects, cycles (read/write).', risk_class: 'write-shared', approval_required: true, invocable: false },
  { tool_key: 'supabase', source: 'mcp', description: 'Supabase MCP — database, migrations, advisors.', risk_class: 'write-shared', approval_required: true, invocable: false },
  { tool_key: 'github', source: 'mcp', description: 'GitHub MCP — repos, PRs, issues, code search.', risk_class: 'write-shared', approval_required: true, invocable: false },
  { tool_key: 'google', source: 'mcp', description: 'Google MCP — Gmail / Drive / Calendar surfaces.', risk_class: 'external', approval_required: true, invocable: false },
  { tool_key: 'slack', source: 'mcp', description: 'Slack MCP — channels, messages, canvases.', risk_class: 'external', approval_required: true, invocable: false },
  { tool_key: 'chrome', source: 'mcp', description: 'Chrome MCP — browser automation / page reading.', risk_class: 'external', approval_required: true, invocable: false },
  { tool_key: 'playwright', source: 'mcp', description: 'Playwright MCP — headless browser control.', risk_class: 'external', approval_required: true, invocable: false },
  { tool_key: 'context7', source: 'mcp', description: 'Context7 MCP — up-to-date library documentation (read).', risk_class: 'read', approval_required: false, invocable: false },
  { tool_key: 'ref', source: 'mcp', description: 'Ref MCP — documentation search / URL reading (read).', risk_class: 'read', approval_required: false, invocable: false },
  { tool_key: 'exa', source: 'mcp', description: 'Exa MCP — web/code/company research search (read).', risk_class: 'read', approval_required: false, invocable: false },

  // --- Hermes ------------------------------------------------------------
  { tool_key: 'hermes:tools', source: 'hermes', description: 'Hermes tool registry (70+ tools) via the Hermes API / mcp-serve.', risk_class: 'external', approval_required: true, invocable: false },
  { tool_key: 'hermes:toolsets', source: 'hermes', description: 'Hermes toolsets (28 toolsets) — grouped capabilities.', risk_class: 'external', approval_required: true, invocable: false },

  // --- Code-execution surfaces -------------------------------------------
  { tool_key: 'codex', source: 'codex', description: 'Codex — senior-engineering code execution surface.', risk_class: 'write-local', approval_required: true, invocable: false },
  { tool_key: 'claude-code', source: 'claude-code', description: 'Claude Code — agentic code execution surface.', risk_class: 'write-local', approval_required: true, invocable: false },
] as const

/** Candidate Hermes config locations (read-only). First existing wins. */
function hermesConfigCandidates(): string[] {
  const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local')
  return [
    process.env.HERMES_CONFIG?.trim() || '',
    path.join(localAppData, 'hermes', 'config.yaml'),
    path.join(os.homedir(), '.hermes', 'config.yaml'),
  ].filter(Boolean)
}

/**
 * Read-only enrichment: extract MCP *server names only* from a Hermes config.
 * Never reads values — only the keys directly under an `mcpServers:` / `mcp:`
 * mapping — so no secret can leak. Returns [] on any error (best-effort).
 */
async function discoverHermesMcpServerNames(): Promise<string[]> {
  for (const candidate of hermesConfigCandidates()) {
    try {
      const raw = await readFile(candidate, 'utf-8')
      const names = parseMcpServerNames(raw)
      if (names.length) return names
    } catch {
      // ignore — try the next candidate / fall back to the static set
    }
  }
  return []
}

/**
 * Minimal, dependency-free YAML scan for keys under an `mcpServers:` or `mcp:`
 * block. Captures only the child key names (server identifiers), not values.
 */
export function parseMcpServerNames(yaml: string): string[] {
  const lines = yaml.split(/\r?\n/)
  const names: string[] = []
  let inBlock = false
  let blockIndent = -1

  for (const line of lines) {
    if (/^\s*#/.test(line) || line.trim() === '') continue
    const indent = line.length - line.trimStart().length

    if (!inBlock) {
      if (/^\s*(mcpServers|mcp_servers|mcp)\s*:/.test(line)) {
        inBlock = true
        blockIndent = indent
      }
      continue
    }

    // A line at or below the block's own indent ends the block.
    if (indent <= blockIndent) {
      inBlock = false
      blockIndent = -1
      continue
    }

    // Direct children of the block (first nesting level) are server names.
    const childMatch = line.match(/^\s+([A-Za-z0-9_.-]+)\s*:/)
    if (childMatch && indent === blockIndent + 2) {
      names.push(childMatch[1])
    }
  }

  return Array.from(new Set(names))
}

/**
 * Return the full read-only tool catalogue: the known static set plus any extra
 * MCP server names discovered from the Hermes config. Nothing is ever invoked,
 * and every entry has `invocable: false`.
 */
export async function getToolCatalogue(): Promise<CommandCentreTool[]> {
  const known = [...KNOWN_TOOLS]
  const knownKeys = new Set(known.map((t) => t.tool_key.toLowerCase()))

  const discovered = await discoverHermesMcpServerNames()
  for (const name of discovered) {
    const key = name.toLowerCase()
    if (knownKeys.has(key)) continue
    knownKeys.add(key)
    known.push({
      tool_key: name,
      source: 'mcp',
      description: `MCP server discovered from Hermes config (read-only listing).`,
      risk_class: 'external',
      approval_required: true,
      invocable: false,
    })
  }

  return known
}

/** Synchronous accessor for the static known set (no filesystem access). */
export function getKnownTools(): CommandCentreTool[] {
  return [...KNOWN_TOOLS]
}
