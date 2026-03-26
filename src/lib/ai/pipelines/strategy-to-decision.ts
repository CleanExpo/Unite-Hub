// src/lib/ai/pipelines/strategy-to-decision.ts
// Pipeline: analyze strategic context → structured CEO decision recommendation.
// Use when the CEO needs a recommended course of action with reasoning, risks, and trade-offs.
// Example: "Should we expand DR into Queensland this year?"

import type { Pipeline } from '../pipeline'

export const strategyToDecisionPipeline: Pipeline = {
  id: 'strategy-to-decision',
  description: 'Analyze a strategic question and produce a structured CEO decision recommendation with risks, trade-offs, and action plan.',
  steps: [
    {
      capabilityId: 'debate',
      buildInput: (prior) => {
        // Step 1: deep strategic debate — steelman both sides before concluding
        void prior
        return {
          messages: [
            {
              role: 'user',
              content:
                'I need you to think deeply about this strategic question. ' +
                'First explore the strongest arguments FOR the proposal, then the strongest arguments AGAINST, ' +
                'then weigh them up and reach a clear recommendation. ' +
                'Seed question (injected by route): [PLACEHOLDER — replaced by route]',
            },
          ],
        }
      },
    },
    {
      capabilityId: 'analyze',
      buildInput: (prior) => {
        const debate = prior[0]?.output.content ?? ''
        return {
          messages: [
            {
              role: 'user',
              content: [
                'You are a CEO decision-support system for a 6-business specialised cleaning & restoration network in AUS/NZ.',
                'North Star: dominate the specialised cleaning industry. Synthex is the distribution flywheel — everything feeds into it.',
                '',
                'Based on the strategic debate below, produce a structured CEO Decision Brief.',
                '',
                '## Recommended Decision  (one clear YES / NO / CONDITIONAL with rationale)',
                '## Confidence Level  (High / Medium / Low + why)',
                '## Key Risks  (top 3, with likelihood and mitigation)',
                '## Financial Impact  (estimated AUD range + timeframe)',
                '## Opportunity Cost  (what we give up by choosing this)',
                '## 90-Day Action Plan  (5 concrete steps if we proceed)',
                '## Decision Deadline  (by when must this be decided)',
                '',
                '## Strategic Debate',
                debate,
              ].join('\n'),
            },
          ],
        }
      },
    },
  ],
}
