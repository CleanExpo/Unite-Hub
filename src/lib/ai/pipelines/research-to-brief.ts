// src/lib/ai/pipelines/research-to-brief.ts
// Pipeline: research (web search) → analyze (structured brief).
// Use when a founder asks a strategic question that requires live research
// before deep analysis — e.g. "What's happening in NZ construction pricing?"

import type { Pipeline } from '../pipeline'

export const researchToBriefPipeline: Pipeline = {
  id: 'research-to-brief',
  description: 'Research a topic with web search, then produce a strategic brief via deep analysis.',
  steps: [
    {
      capabilityId: 'research',
      buildInput: (prior) => {
        // prior is empty on step 1 — seed comes from context via the route
        void prior
        return {
          messages: [], // populated by route with the seed question
        }
      },
    },
    {
      capabilityId: 'analyze',
      buildInput: (prior) => {
        const research = prior[0]?.output.content ?? ''
        return {
          messages: [
            {
              role: 'user',
              content: [
                'Based on the following research findings, produce a structured strategic brief for the founder.',
                '',
                '## Research Findings',
                research,
              ].join('\n'),
            },
          ],
        }
      },
    },
  ],
}
