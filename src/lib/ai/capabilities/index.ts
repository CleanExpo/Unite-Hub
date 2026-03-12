// src/lib/ai/capabilities/index.ts
// Barrel export for all capability configs + idempotent registration helper

import { registerCapability } from '../router'
import { chatCapability } from './chat'
import { analyzeCapability } from './analyze'
import { ideasCapability } from './ideas'
import { debateCapability } from './debate'

export { chatCapability } from './chat'
export { analyzeCapability } from './analyze'
export { ideasCapability } from './ideas'
export { debateCapability } from './debate'

let _registered = false

/** Register all capabilities with the router. Idempotent — safe to call multiple times. */
export function registerAllCapabilities(): void {
  if (_registered) return

  registerCapability(chatCapability)
  registerCapability(analyzeCapability)
  registerCapability(ideasCapability)
  registerCapability(debateCapability)

  _registered = true
}
