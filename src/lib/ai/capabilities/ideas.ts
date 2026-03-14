// src/lib/ai/capabilities/ideas.ts
// Idea capture capability — qualifying conversation that turns raw ideas into Linear issues

import { buildSystemPrompt } from '@/lib/ideas/conversation'
import { createCapability } from '../types'

export const ideasCapability = createCapability({
  id: 'ideas',
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 1024,
  systemPrompt: () => buildSystemPrompt(),
})
