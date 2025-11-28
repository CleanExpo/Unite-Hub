/**
 * Blue Ocean Strategy Engine
 *
 * Generates Blue Ocean strategy frameworks for businesses.
 * Based on the Blue Ocean Strategy (Kim & Mauborgne) - Eliminate, Reduce, Raise, Create.
 */

export interface BlueOceanInput {
  businessName?: string;
  industry?: string;
  marketNotes?: string;
  competitorInsights?: string[];
  currentChallenges?: string[];
}

export interface BlueOceanOpportunity {
  name: string;
  description: string;
  potentialImpact: 'low' | 'medium' | 'high';
}

export interface StrategicCanvas {
  current_industry: string[];
  your_new_space: string[];
}

export interface BlueOceanOutput {
  eliminate: string[];
  reduce: string[];
  raise: string[];
  create: string[];
  opportunities: BlueOceanOpportunity[];
  strategic_canvas: StrategicCanvas;
}

export const BlueOceanEngine = {
  /**
   * Generate a Blue Ocean strategy framework based on business context
   */
  generate(input: BlueOceanInput): BlueOceanOutput {
    const baseName = input.businessName || 'Your business';
    const industry = input.industry || 'your industry';

    return {
      eliminate: [
        'racing competitors to the bottom on price',
        'copycat offers that look like everyone else in ' + industry,
        'over-complicated funnels clients never finish',
        'vanilla messaging that could belong to any provider',
        'low-value services that dilute your core offering',
        'time-wasting activities that don\'t move the needle'
      ],
      reduce: [
        'dependence on a single traffic source or platform',
        'time wasted on low-intent channels',
        'internal manual busywork through automation',
        'noise in dashboards and metrics that don\'t drive decisions',
        'complexity in client onboarding',
        'friction in the sales process'
      ],
      raise: [
        'perceived value and clarity of your core offers',
        'execution speed from idea to test to rollout',
        'differentiation in how results are achieved and reported',
        'quality of client education and expectation-setting',
        'trust through transparency and client-in-the-loop governance',
        'expertise positioning in your specific niche'
      ],
      create: [
        `a named category around automation-led local market dominance for ${baseName}`,
        `signature frameworks and visuals clients associate only with ${baseName}`,
        'done-with-you strategic AI sessions guided by AI Phill',
        'an owned data moat around client performance and insights',
        'proprietary methodology that competitors cannot easily replicate',
        'community or ecosystem that locks in long-term relationships'
      ],
      opportunities: [
        {
          name: 'Value Innovation Path',
          description: `Redesign services so clients get 3x perceived value while ${baseName}'s cost to deliver drops through automation and standardisation.`,
          potentialImpact: 'high'
        },
        {
          name: 'Category Creation Path',
          description: `Position ${baseName} as the creator of a new category (e.g., Founder Intelligence OS for Local Service Businesses).`,
          potentialImpact: 'high'
        },
        {
          name: 'Non-Customer Conversion Path',
          description: 'Turn people who currently do nothing (never call anyone) into your main growth segment using low-friction entry offers.',
          potentialImpact: 'medium'
        },
        {
          name: 'Premium Experience Path',
          description: 'Create a premium tier with white-glove service, faster execution, and exclusive access to new features.',
          potentialImpact: 'medium'
        },
        {
          name: 'Ecosystem Lock-In Path',
          description: 'Build integrations, community, and switching costs that make leaving expensive.',
          potentialImpact: 'high'
        }
      ],
      strategic_canvas: {
        current_industry: [
          'price competition and race to the bottom',
          'channel chasing and platform dependency',
          'short-term campaigns with no compounding',
          'manual reporting and reactive adjustments',
          'generic messaging across all providers',
          'fragmented tools requiring manual coordination'
        ],
        your_new_space: [
          'AI-orchestrated growth OS with autonomous execution',
          'always-on experimentation loops with continuous learning',
          'client-in-the-loop governance for trust and alignment',
          'founder intelligence and historical memory',
          'proprietary frameworks and named methodologies',
          'unified platform with everything in one place'
        ]
      }
    };
  },

  /**
   * Generate a quick summary of the Blue Ocean strategy
   */
  generateSummary(output: BlueOceanOutput): string {
    return `
## Blue Ocean Strategy Summary

### What to ELIMINATE (stop doing entirely)
${output.eliminate.slice(0, 3).map(item => `- ${item}`).join('\n')}

### What to REDUCE (do less of)
${output.reduce.slice(0, 3).map(item => `- ${item}`).join('\n')}

### What to RAISE (do more of, better)
${output.raise.slice(0, 3).map(item => `- ${item}`).join('\n')}

### What to CREATE (new value nobody else offers)
${output.create.slice(0, 3).map(item => `- ${item}`).join('\n')}

### Top Opportunities
${output.opportunities.slice(0, 3).map(opp => `- **${opp.name}**: ${opp.description}`).join('\n')}
    `.trim();
  }
};

export default BlueOceanEngine;
