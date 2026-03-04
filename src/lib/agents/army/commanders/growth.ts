/**
 * Commander Growth — Senior Growth PM configuration
 *
 * Orchestrates 10 growth-focused skill agents covering SEO monitoring,
 * content ideation, social posting, backlink acquisition, email nurture,
 * GSC analysis, competitor content tracking, paid ads, CRO, and reporting
 * for the Australian market across the Unite-Group business portfolio.
 *
 * UNI-1447: Commander Growth deploy
 */

export const COMMANDER_GROWTH = {
  id: 'commander-growth',
  name: 'Commander Growth',
  model: 'claude-sonnet-4-6',
  role: 'Senior Growth PM',
  briefTime: '07:30', // AEST daily
  colour: '#00F5FF',

  orchestrator: {
    id: 'growth-orchestrator',
    model: 'claude-haiku-4-5-20251001',
    role: 'Growth Orchestrator',
  },

  skills: [
    {
      id: 'growth-seo-monitor',
      name: 'SEO Monitor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Track keyword rankings across all 5 sites, flag position drops > 5',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'growth-content-ideas',
      name: 'Content Ideas',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Generate 10 content ideas per site based on keyword gaps and competitor content',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'growth-social-post',
      name: 'Social Poster',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Draft LinkedIn + Twitter posts for each business from recent news/updates',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'growth-backlink-finder',
      name: 'Backlink Finder',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Find link building opportunities — directories, industry publications, partners',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'growth-email-nurture',
      name: 'Email Nurture',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Draft email nurture sequences for new leads based on industry/source',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'growth-gsc-analyser',
      name: 'GSC Analyser',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Analyse Search Console data for CTR improvement opportunities',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'growth-competitor-content',
      name: 'Competitor Content',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Monitor competitor blog/social content, identify gaps to fill',
      outputTable: 'army_competitor_updates',
      urgent: false,
    },
    {
      id: 'growth-google-ads',
      name: 'Google Ads Monitor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Monitor ad performance, flag underperforming campaigns, suggest bid adjustments',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'growth-conversion-rate',
      name: 'CRO Analyser',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Analyse Clarity heatmaps + session recordings, flag rage-click pages',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'growth-weekly-brief',
      name: 'Growth Reporter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Compile weekly growth metrics — traffic, rankings, content performance',
      outputTable: 'army_opportunities',
      urgent: false,
    },
  ],
} as const;

export type GrowthSkillId = typeof COMMANDER_GROWTH.skills[number]['id'];
