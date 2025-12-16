/**
 * Centralized Guardian Anthropic Mock
 * Provides consistent Claude API mocking with fallback support
 */
import { vi } from 'vitest';

/**
 * Create a mock Anthropic message response
 */
export function createMockClaudeResponse(content: string = 'Test response') {
  return {
    id: 'msg-test-123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: content }],
    model: 'claude-3-5-sonnet-20250929',
    stop_reason: 'end_turn',
    usage: { input_tokens: 10, output_tokens: 20 },
  };
}

/**
 * Create a mock Anthropic client with all required methods
 */
export function createMockAnthropicClient() {
  return {
    messages: {
      create: vi.fn().mockResolvedValue(createMockClaudeResponse()),
    },
    beta: {
      messages: {
        create: vi.fn().mockResolvedValue(createMockClaudeResponse()),
      },
    },
  };
}

/**
 * Setup global Anthropic mocks
 */
export function mockGuardianAnthropic() {
  // Mock getAnthropicClient() function
  vi.mock('@/lib/guardian/meta/statusNarrativeAiHelper', () => ({
    getAnthropicClient: vi.fn(() => createMockAnthropicClient()),
  }));

  // Mock callAnthropicWithRetry()
  vi.mock('@/lib/anthropic/rate-limiter', () => ({
    callAnthropicWithRetry: vi.fn().mockResolvedValue({
      data: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              narrative: 'Test fallback narrative',
              summary: 'All systems operational',
            }),
          },
        ],
      },
      attempts: 1,
      totalTime: 100,
    }),
  }));

  // Mock getAnthropicClient from client module
  vi.mock('@/lib/anthropic/client', () => ({
    getAnthropicClient: vi.fn(() => createMockAnthropicClient()),
  }));
}

/**
 * Configure mock to return specific response
 */
export function configureClaudeResponse(client: any, content: string) {
  client.messages.create.mockResolvedValue(createMockClaudeResponse(content));
}

/**
 * Ensure fallback responses are always available
 */
export const FALLBACK_RESPONSES = {
  governance: {
    narrative: 'System governance is operating normally with all policies enforced.',
    summary: 'Governance status: healthy',
  },
  readiness: {
    narrative: 'Readiness assessment: foundational. Focus on core capabilities.',
    summary: 'Readiness: baseline level',
  },
  adoption: {
    narrative: 'Adoption tracking enabled. Usage patterns are being monitored.',
    summary: 'Adoption: monitoring active',
  },
  status: {
    narrative: 'Status page generated. All major systems nominal.',
    summary: 'Status: nominal',
  },
};
