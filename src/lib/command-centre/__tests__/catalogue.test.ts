import { describe, it, expect } from 'vitest'
import {
  getToolCatalogue,
  getKnownTools,
  parseMcpServerNames,
  KNOWN_TOOLS,
} from '@/lib/command-centre/tools/catalogue'

const EXPECTED_KEYS = [
  'linear',
  'supabase',
  'github',
  'google',
  'slack',
  'chrome',
  'playwright',
  'context7',
  'ref',
  'exa',
  'hermes:tools',
  'hermes:toolsets',
  'codex',
  'claude-code',
]

describe('command-centre tool catalogue', () => {
  it('returns the known static sources', () => {
    const keys = getKnownTools().map((t) => t.tool_key)
    for (const expected of EXPECTED_KEYS) {
      expect(keys).toContain(expected)
    }
  })

  it('marks NOTHING as invocable (list-only, zero execution risk)', async () => {
    const tools = await getToolCatalogue()
    expect(tools.length).toBeGreaterThanOrEqual(EXPECTED_KEYS.length)
    for (const tool of tools) {
      expect(tool.invocable).toBe(false)
    }
    // The static set is also entirely non-invocable.
    for (const tool of KNOWN_TOOLS) {
      expect(tool.invocable).toBe(false)
    }
  })

  it('assigns a valid risk_class and source to every entry', async () => {
    const validRisk = new Set(['read', 'write-local', 'write-shared', 'external', 'destructive'])
    const validSource = new Set(['hermes', 'mcp', 'project', 'codex', 'claude-code', 'local'])
    const tools = await getToolCatalogue()
    for (const tool of tools) {
      expect(validRisk.has(tool.risk_class)).toBe(true)
      expect(validSource.has(tool.source)).toBe(true)
    }
  })

  it('parses MCP server names from a Hermes-style YAML config (names only)', () => {
    const yaml = [
      'gateway:',
      '  port: 9119',
      'mcpServers:',
      '  linear:',
      '    command: npx',
      '    apiKey: lin_api_SHOULD_NOT_BE_READ',
      '  custom-server:',
      '    url: http://localhost:1234',
      'other:',
      '  foo: bar',
    ].join('\n')

    const names = parseMcpServerNames(yaml)
    expect(names).toContain('linear')
    expect(names).toContain('custom-server')
    // It must NOT capture nested value keys (no secret leakage).
    expect(names).not.toContain('apiKey')
    expect(names).not.toContain('command')
    expect(names).not.toContain('port')
  })
})
