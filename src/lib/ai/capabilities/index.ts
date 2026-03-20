// src/lib/ai/capabilities/index.ts
// Barrel export for all capability configs + idempotent registration helper

import { registerCapability } from '../router'
import { analyzeCapability } from './analyze'
import { ideasCapability } from './ideas'
import { debateCapability } from './debate'
import { contentGenerateCapability } from './content-generate'
import { emailTriageCapability } from './email-triage'

export { analyzeCapability } from './analyze'
export { ideasCapability } from './ideas'
export { debateCapability } from './debate'
export { contentGenerateCapability } from './content-generate'
export { emailTriageCapability } from './email-triage'

let _registered = false

/** Register all capabilities with the router. Idempotent — safe to call multiple times. */
export function registerAllCapabilities(): void {
  if (_registered) return

  registerCapability(analyzeCapability)
  registerCapability(ideasCapability)
  registerCapability(debateCapability)
  registerCapability(contentGenerateCapability)
  registerCapability(emailTriageCapability)

  _registered = true
}
