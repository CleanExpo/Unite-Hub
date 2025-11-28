/**
 * Strategy Generator
 *
 * Generates multi-path strategic choices for clients to review and approve.
 * Integrates Blue Ocean framework, leak-aligned SEO tactics, and conservative/aggressive options.
 */

import { BlueOceanEngine, type BlueOceanOutput } from './blueOceanEngine';

export type ExplanationMode = 'eli5' | 'beginner' | 'technical' | 'founder';

export interface StrategyContext {
  businessName?: string;
  industry?: string;
  marketNotes?: string;
  seoFindings?: Record<string, unknown>;
  boostBumpEligible?: boolean;
  currentPerformance?: {
    traffic?: number;
    conversions?: number;
    rankings?: Record<string, number>;
  };
}

export interface StrategyOption {
  label: string;
  description: string;
  moves?: string[];
  risks?: string[];
  timeframe?: string;
  estimatedImpact?: string;
}

export interface BlueOceanOption extends StrategyOption {
  eliminate: string[];
  reduce: string[];
  raise: string[];
  create: string[];
  opportunities: BlueOceanOutput['opportunities'];
  canvas: BlueOceanOutput['strategic_canvas'];
}

export interface StrategyChoices {
  conservative: StrategyOption;
  aggressive: StrategyOption;
  blue_ocean: BlueOceanOption;
  data_driven: StrategyOption;
}

export const StrategyGenerator = {
  /**
   * Generate all four strategic path options
   */
  generateChoices(context: StrategyContext): StrategyChoices {
    const blue = BlueOceanEngine.generate({
      businessName: context.businessName,
      industry: context.industry,
      marketNotes: context.marketNotes
    });

    return {
      conservative: {
        label: 'Low-Risk Sustainable Option',
        description: 'Iterative improvement that respects current constraints and avoids disruption. Safe, predictable progress.',
        timeframe: '3-6 months for measurable results',
        estimatedImpact: '10-20% improvement in key metrics',
        moves: [
          'Tighten titles and meta descriptions based on real CTR benchmarks',
          'Fix obvious technical SEO and Core Web Vitals issues',
          'Update outdated content with fresh, high-effort material',
          'Improve internal linking to priority money pages',
          'Clean up broken links and redirect chains',
          'Optimize images and implement lazy loading'
        ],
        risks: [
          'Slower progress than aggressive options',
          'May lose ground to faster-moving competitors',
          'Results may plateau without bigger moves'
        ]
      },

      aggressive: {
        label: 'High-Impact Growth Option',
        description: 'Push for measurable uplift as fast as is safe for your brand. Higher risk, higher potential reward.',
        timeframe: '1-3 months for initial results',
        estimatedImpact: '30-50% improvement potential',
        moves: [
          'Deploy structured data for rich results and enhanced clickability',
          'Run controlled title/meta A/B tests using leak-aligned CTR logic',
          context.boostBumpEligible
            ? 'Schedule Boost Bump style behavioural enhancement pulses on key URLs'
            : 'Emulate Boost Bump style on-site engagement via internal traffic and warm audiences',
          'Prioritise high-intent SEO and GEO pages over vanity keywords',
          'Implement aggressive content gap filling',
          'Launch link acquisition campaign targeting high-authority domains'
        ],
        risks: [
          'Potential for short-term ranking volatility',
          'Higher resource investment required',
          'Some tactics may be affected by algorithm updates'
        ]
      },

      blue_ocean: {
        label: 'Blue Ocean Market-Creating Option',
        description: 'Deliberately move into less contested, higher-value positioning instead of fighting in red oceans. Create new demand.',
        timeframe: '6-12 months for category establishment',
        estimatedImpact: 'Potentially transformative - new market position',
        eliminate: blue.eliminate,
        reduce: blue.reduce,
        raise: blue.raise,
        create: blue.create,
        opportunities: blue.opportunities,
        canvas: blue.strategic_canvas,
        moves: [
          'Define and name your unique category/methodology',
          'Create signature frameworks competitors cannot copy',
          'Build owned audience and community',
          'Develop proprietary tools or processes',
          'Position as thought leader in new space'
        ],
        risks: [
          'Longer time to validate new positioning',
          'Requires consistent messaging discipline',
          'May need to educate market on new category'
        ]
      },

      data_driven: {
        label: 'Leak/DOJ/Yandex-Aligned Option',
        description: 'Aligns with confirmed signals from Google leaks, DOJ testimony, and Yandex documentation: NavBoost behaviour, Q* quality, Chrome data, link freshness and engagement.',
        timeframe: '2-4 months for initial signals',
        estimatedImpact: '25-40% improvement in organic performance',
        moves: [
          'Optimise for goodClicks and lastLongestClicks by matching intent and satisfying queries deeply',
          'Reinforce site_authority and Q* via higher-effort content and legitimate high-quality links',
          'Use CTR benchmarks per position to avoid patterns that look like trend_spam manipulation',
          'Clean up link profile and content clutter to avoid Panda/BabyPanda style demotions',
          'Focus on Chrome user engagement signals (time on site, scroll depth, return visits)',
          'Build topic authority through comprehensive coverage and internal linking'
        ],
        risks: [
          'Leaked information may be outdated or incomplete',
          'Google continuously updates algorithms',
          'Some signals harder to influence than others'
        ]
      }
    };
  },

  /**
   * Explain a strategy in the requested mode
   */
  explainStrategy(
    strategy: StrategyOption | BlueOceanOption,
    mode: ExplanationMode
  ): string {
    const baseExplanation = `**${strategy.label}**\n\n${strategy.description}`;

    switch (mode) {
      case 'eli5':
        return `${baseExplanation}\n\nIn simple terms: This is about ${strategy.label.toLowerCase().includes('conservative')
          ? 'making small, safe improvements that won\'t rock the boat'
          : strategy.label.toLowerCase().includes('aggressive')
          ? 'moving fast and trying bold things to grow quickly'
          : strategy.label.toLowerCase().includes('blue')
          ? 'creating something new that nobody else is doing'
          : 'using what we know works based on research and data'}.`;

      case 'beginner':
        return `${baseExplanation}\n\n**What this means for your business:**\n${strategy.moves?.slice(0, 3).map(m => `- ${m}`).join('\n') || 'See details for specific actions.'}`;

      case 'technical':
        return `${baseExplanation}\n\n**Implementation Details:**\n${strategy.moves?.map(m => `- ${m}`).join('\n') || 'N/A'}\n\n**Risk Factors:**\n${strategy.risks?.map(r => `- ${r}`).join('\n') || 'Standard implementation risks apply.'}`;

      case 'founder':
      default:
        return `${baseExplanation}\n\n**Timeline:** ${strategy.timeframe || 'Varies'}\n**Expected Impact:** ${strategy.estimatedImpact || 'See analysis'}\n\n**Key Moves:**\n${strategy.moves?.slice(0, 4).map(m => `- ${m}`).join('\n') || 'Detailed in full report.'}`;
    }
  },

  /**
   * Generate a comparison summary of all options
   */
  generateComparison(choices: StrategyChoices, mode: ExplanationMode = 'founder'): string {
    const options = [
      { key: 'conservative', data: choices.conservative },
      { key: 'aggressive', data: choices.aggressive },
      { key: 'blue_ocean', data: choices.blue_ocean },
      { key: 'data_driven', data: choices.data_driven }
    ];

    let summary = '# Strategic Options Comparison\n\n';

    for (const opt of options) {
      summary += `## ${opt.data.label}\n`;
      summary += this.explainStrategy(opt.data, mode);
      summary += '\n\n---\n\n';
    }

    return summary;
  }
};

export default StrategyGenerator;
