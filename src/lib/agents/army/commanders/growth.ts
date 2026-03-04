/**
 * Commander Growth — Senior Growth PM configuration
 *
 * Orchestrates 10 growth-focused skill agents covering content production,
 * SEO, social media, email campaigns, and paid acquisition for the Australian
 * market across the Unite-Group business portfolio.
 *
 * UNI-1446: Commander Growth deploy
 */

export const COMMANDER_GROWTH = {
  id: 'commander-growth',
  name: 'Commander Growth',
  model: 'claude-sonnet-4-6',
  role: 'Senior Growth PM',
  briefTime: '08:00', // AEST daily
  colour: '#00F5FF',

  orchestrator: {
    id: 'growth-orchestrator',
    model: 'claude-haiku-4-5-20251001',
    role: 'Growth Orchestrator',
  },

  skills: [
    {
      id: 'growth-content-drafter',
      name: 'Content Drafter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Draft blog posts, case studies, and LinkedIn articles for NRPG/DR/Unite-Group brands',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'growth-seo-tracker',
      name: 'SEO Tracker',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Monitor keyword rankings, identify quick-win optimisation opportunities',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'growth-social-watcher',
      name: 'Social Watcher',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'hourly',
      description: 'Monitor social channels for engagement opportunities, trending topics in AU market',
      outputTable: 'army_opportunities',
      urgent: true,
    },
    {
      id: 'growth-email-campaign',
      name: 'Email Campaign Builder',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Draft and schedule email nurture sequences for leads in CRM',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'growth-ad-copy',
      name: 'Ad Copy Writer',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Generate Google Ads and Meta ad copy variants for A/B testing',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'growth-conversion-analyst',
      name: 'Conversion Analyst',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Analyse landing page performance, recommend CRO improvements',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'growth-referral-hunter',
      name: 'Referral Hunter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Identify happy customers and partners for referral programme outreach',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'growth-webinar-planner',
      name: 'Webinar Planner',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Plan monthly webinar topics, draft invitations, prepare run sheets',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'growth-partner-scout',
      name: 'Partner Scout',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Identify strategic partnership opportunities in AU tech and HR sectors',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'growth-reporter',
      name: 'Growth Reporter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Compile daily growth metrics: traffic, leads, social reach, conversion rates',
      outputTable: 'army_opportunities',
      urgent: false,
    },
  ],
} as const;

export type GrowthSkillId = typeof COMMANDER_GROWTH.skills[number]['id'];
