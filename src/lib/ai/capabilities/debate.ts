// src/lib/ai/capabilities/debate.ts
// MACAS debate capability — placeholder config for the multi-agent competitive accounting system.
// The debate engine (src/lib/advisory/debate-engine.ts) manages its own orchestration;
// this capability exists for registry completeness and future unified dispatching.

import { createCapability } from '../types'

export const debateCapability = createCapability({
  id: 'debate',
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  systemPrompt:
    'You are a specialist accounting firm agent participating in a multi-agent debate. Follow the debate protocol and respond with structured JSON proposals.',
})
