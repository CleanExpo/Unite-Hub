// src/lib/ai/pipelines/bookkeeper-to-advisory.ts
// Pipeline: data-analyst (Xero/financial data analysis) → analyze (strategic advisory brief).
// Use for post-bookkeeper-run advisory: analyse the numbers first, then synthesise insights.

import type { Pipeline } from '../pipeline'

export const bookkeeperToAdvisoryPipeline: Pipeline = {
  id: 'bookkeeper-to-advisory',
  description: 'Analyse financial data with the code sandbox, then generate a strategic advisory summary.',
  steps: [
    {
      capabilityId: 'data-analyst',
      buildInput: (prior) => {
        // prior is empty on step 1 — seed (question + data) comes from route
        void prior
        return {
          messages: [], // populated by route
        }
      },
    },
    {
      capabilityId: 'analyze',
      buildInput: (prior) => {
        const analysis = prior[0]?.output.content ?? ''
        const sandboxOutput = prior[0]?.output.sandboxResult?.output
        const numerical = sandboxOutput
          ? `\n\n## Computed Results\n\`\`\`\n${sandboxOutput}\n\`\`\``
          : ''

        return {
          messages: [
            {
              role: 'user',
              content: [
                'Based on the following financial data analysis, produce a strategic advisory brief for the founder.',
                'Focus on key risks, opportunities, and recommended actions.',
                '',
                '## Data Analysis',
                analysis,
                numerical,
              ].join('\n'),
            },
          ],
        }
      },
    },
  ],
}
