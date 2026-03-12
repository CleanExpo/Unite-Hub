// src/lib/mcp/__tests__/client.test.ts
// Unit tests for the MCP client connector layer.

import { describe, it, expect } from 'vitest'
import { MCPClient } from '../client'
import type { MCPToolDefinition, MCPToolResult, MCPServerConfig } from '../types'

describe('MCPClient', () => {
  const config: MCPServerConfig = {
    serverUrl: 'http://localhost:3100',
    apiKey: 'test-key-123',
  }

  it('MCPClient class is defined', () => {
    expect(MCPClient).toBeDefined()
  })

  it('constructs with serverUrl', () => {
    const client = new MCPClient(config)
    expect(client.serverUrl).toBe('http://localhost:3100')
  })

  it('getToolDefinitions returns an array', () => {
    const client = new MCPClient(config)
    const tools: MCPToolDefinition[] = client.getToolDefinitions()
    expect(Array.isArray(tools)).toBe(true)
  })

  it('executeTool is defined', () => {
    const client = new MCPClient(config)
    expect(typeof client.executeTool).toBe('function')
  })
})
