// src/lib/ai/capabilities/index.ts
// Barrel export for all capability configs + idempotent registration helper

import { registerCapability } from '../router'
import { analyzeCapability } from './analyze'
import { ideasCapability } from './ideas'
import { debateCapability } from './debate'
import { contentGenerateCapability } from './content-generate'
import { emailTriageCapability } from './email-triage'
import { researchCapability } from './research'
import { dataAnalystCapability } from './data-analyst'
import { coachCapability } from './coach'

export { analyzeCapability } from './analyze'
export { ideasCapability } from './ideas'
export { debateCapability } from './debate'
export { contentGenerateCapability } from './content-generate'
export { emailTriageCapability } from './email-triage'
export { researchCapability } from './research'
export { dataAnalystCapability } from './data-analyst'
export { coachCapability } from './coach'

let _registered = false

/** Register all capabilities with the router. Idempotent — safe to call multiple times. */
export function registerAllCapabilities(): void {
  if (_registered) return

  registerCapability(analyzeCapability)
  registerCapability(ideasCapability)
  registerCapability(debateCapability)
  registerCapability(contentGenerateCapability)
  registerCapability(emailTriageCapability)
  registerCapability(researchCapability)
  registerCapability(dataAnalystCapability)
  registerCapability(coachCapability)

  _registered = true
}
