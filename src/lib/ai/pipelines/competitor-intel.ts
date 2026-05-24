// src/lib/ai/pipelines/competitor-intel.ts
// Pipeline: research competitor landscape → produce strategic intelligence brief.
// Use for: "What is CleanCo doing in the NSW market?" or "Who are DR's main competitors?"

import type { Pipeline } from '../pipeline'

export const competitorIntelPipeline: Pipeline = {
  id: 'competitor-intel',
  description: 'Research a competitor or market player, then produce a strategic intelligence brief with threat assessment and counter-moves.',
  steps: [
    {
      capabilityId: 'research',
      buildInput: (prior) => {
        void prior
        return { messages: [] } // seed injected by route
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
                'You are a strategic intelligence analyst for a specialised cleaning and restoration company network.',
                'The network competes in the AUS/NZ market across disaster recovery, mould remediation, NRPG, and restoration.',
                '',
                'Based on the following research about a competitor or market entity, produce a structured intelligence brief.',
                'Structure your output with:',
                '## Threat Level  (Low / Medium / High / Critical)',
                '## Company Profile  (who they are, size, market position)',
                '## Competitive Strengths  (what they do well)',
                '## Competitive Weaknesses  (exploitable gaps)',
                '## Overlap Analysis  (which of our 6 businesses they directly threaten)',
                '## Counter-Move Recommendations  (3-5 specific actions for Phill)',
                '## Intelligence Gaps  (what we still need to find out)',
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
