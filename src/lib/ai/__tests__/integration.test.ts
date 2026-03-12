// src/lib/ai/__tests__/integration.test.ts
// Integration test — verifies the full AI service layer barrel exports and execute flow.

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Provide a fake API key so the client singleton initialises without throwing.
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-integration')

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Integration test response' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-sonnet-4-6',
      }),
    },
  })),
}))

import {
  // Client
  getAIClient,
  resetAIClient,
  // Router
  registerCapability,
  execute,
  resetRegistry,
  // Capabilities
  chatCapability,
  registerAllCapabilities,
  // Types
  createCapability,
  MODEL_IDS,
  // Features — thinking
  calculateThinkingBudget,
  detectComplexity,
  // Features — web search
  buildWebSearchTool,
  parseWebSearchResults,
  // Features — citations
  extractCitations,
  formatCitationsForUI,
  // Features — structured
  zodToToolSchema,
  parseStructuredResponse,
  // Features — batch
  createBatch,
  checkBatchStatus,
  buildBatchRequest,
  // Features — files
  uploadFile,
  buildFileReference,
  addToFileCache,
  getFileCache,
  clearFileCache,
  // Features — memory
  buildMemoryToolConfig,
  // Features — sandbox
  buildSandboxTool,
  parseSandboxResult,
  // Cost tracker
  trackUsage,
  getUsageSummary,
  resetUsage,
} from '@/lib/ai'

describe('AI Service Layer Integration', () => {
  beforeEach(() => {
    resetRegistry()
    resetAIClient()
    resetUsage()
  })

  it('full flow: register capabilities, execute chat, verify response shape', async () => {
    registerAllCapabilities()
    registerCapability(chatCapability)

    const response = await execute('chat', {
      messages: [{ role: 'user', content: 'Hello from integration test' }],
      context: { userId: 'test-user' },
    })

    expect(response.content).toBe('Integration test response')
    expect(response.usage.inputTokens).toBe(10)
    expect(response.usage.outputTokens).toBe(5)
    expect(response.model).toBe('claude-sonnet-4-6')
  })

  it('all feature module exports are accessible', () => {
    // Thinking
    expect(typeof calculateThinkingBudget).toBe('function')
    expect(typeof detectComplexity).toBe('function')

    // Web search
    expect(typeof buildWebSearchTool).toBe('function')
    expect(typeof parseWebSearchResults).toBe('function')

    // Citations
    expect(typeof extractCitations).toBe('function')
    expect(typeof formatCitationsForUI).toBe('function')

    // Structured
    expect(typeof zodToToolSchema).toBe('function')
    expect(typeof parseStructuredResponse).toBe('function')

    // Batch
    expect(typeof createBatch).toBe('function')
    expect(typeof checkBatchStatus).toBe('function')
    expect(typeof buildBatchRequest).toBe('function')

    // Files
    expect(typeof uploadFile).toBe('function')
    expect(typeof buildFileReference).toBe('function')
    expect(typeof addToFileCache).toBe('function')
    expect(typeof getFileCache).toBe('function')
    expect(typeof clearFileCache).toBe('function')

    // Memory
    expect(typeof buildMemoryToolConfig).toBe('function')

    // Sandbox
    expect(typeof buildSandboxTool).toBe('function')
    expect(typeof parseSandboxResult).toBe('function')

    // Cost tracker
    expect(typeof trackUsage).toBe('function')
    expect(typeof getUsageSummary).toBe('function')
    expect(typeof resetUsage).toBe('function')

    // Client + types
    expect(typeof getAIClient).toBe('function')
    expect(typeof createCapability).toBe('function')
    expect(Array.isArray(MODEL_IDS)).toBe(true)
  })
})
