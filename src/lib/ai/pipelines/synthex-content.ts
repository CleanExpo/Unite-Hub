// src/lib/ai/pipelines/synthex-content.ts
// Pipeline: research AUS/NZ industry trends → generate Synthex content batch.
// Use to fuel the Synthex distribution flywheel with fresh, relevant content.
// Seed: topic or industry angle e.g. "mould remediation after floods in QLD"

import type { Pipeline } from '../pipeline'

export const synthexContentPipeline: Pipeline = {
  id: 'synthex-content',
  description: 'Research an AUS/NZ cleaning/restoration industry topic then generate a multi-format Synthex content batch (LinkedIn, email hook, blog outline).',
  steps: [
    {
      capabilityId: 'research',
      buildInput: (prior) => {
        void prior
        return { messages: [] } // seed injected by route
      },
    },
    {
      capabilityId: 'content-generate',
      buildInput: (prior) => {
        const research = prior[0]?.output.content ?? ''
        return {
          messages: [
            {
              role: 'user',
              content: [
                'You are the Synthex content engine — the distribution flywheel for a specialised cleaning & restoration network in AUS/NZ.',
                'Synthex generates authority content that drives leads to all 6 businesses in the network.',
                '',
                'Using the research below, generate a content batch with these 4 assets:',
                '',
                '### 1. LinkedIn Post (300–500 words)',
                '- Opens with a bold claim or surprising statistic',
                '- Tells a real-world scenario from the AUS/NZ market',
                '- Ends with a clear CTA (not salesy — educational)',
                '- Uses short paragraphs, no hashtag stuffing (max 3)',
                '',
                '### 2. Email Subject Line + Preview Text',
                '- 3 subject line variants (A/B/C test options)',
                '- 1 preview text per variant (max 100 chars)',
                '',
                '### 3. Blog Post Outline',
                '- Target keyword (AUS/NZ local intent)',
                '- H1 title (60 chars max)',
                '- H2 sections (4–6 sections)',
                '- Word count target',
                '- Schema markup recommendation (Article / HowTo / FAQ)',
                '',
                '### 4. Quick Social Hooks (3 options)',
                '- Twitter/X-style hooks (280 chars max each)',
                '- Can become Facebook posts or SMS openers',
                '',
                '## Research',
                research,
              ].join('\n'),
            },
          ],
        }
      },
    },
  ],
}
