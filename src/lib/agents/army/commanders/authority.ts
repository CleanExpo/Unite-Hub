/**
 * Commander Authority — Senior Authority PM configuration
 *
 * Orchestrates 10 authority-building skill agents covering PR monitoring,
 * review management, thought leadership, AI citation tracking, schema auditing,
 * GEO visibility, partnership scouting, awards, media list building, and
 * reputation reporting for the Australian market.
 *
 * UNI-1448: Commander Authority deploy
 */

export const COMMANDER_AUTHORITY = {
  id: 'commander-authority',
  name: 'Commander Authority',
  model: 'claude-sonnet-4-6',
  role: 'Senior Authority PM',
  briefTime: '07:30', // AEST daily
  colour: '#FFB800',

  orchestrator: {
    id: 'authority-orchestrator',
    model: 'claude-haiku-4-5-20251001',
    role: 'Authority Orchestrator',
  },

  skills: [
    {
      id: 'auth-pr-monitor',
      name: 'PR Monitor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Monitor industry press for PR opportunities — award nominations, speaking slots, features',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-review-monitor',
      name: 'Review Monitor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'hourly',
      description: 'Monitor Google/Trustpilot/Product Hunt reviews across all brands, flag negative',
      outputTable: 'army_opportunities',
      urgent: true,
    },
    {
      id: 'auth-thought-leadership',
      name: 'Thought Leadership',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Draft opinion pieces, LinkedIn articles, and podcast talking points for Phill',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'auth-citation-tracker',
      name: 'Citation Tracker',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Track AI engine citations (Perplexity, ChatGPT, Claude) for brand mentions',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-schema-auditor',
      name: 'Schema Auditor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Audit structured data on all sites, flag missing/broken schema',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-geo-monitor',
      name: 'GEO Monitor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Test GEO visibility — query AI engines for target terms, check if our brands appear',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-partnership-scout',
      name: 'Partnership Scout',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Find strategic partnership opportunities — referral programs, co-marketing, integrations',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'auth-award-tracker',
      name: 'Award Tracker',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'monthly',
      description: 'Track industry award submissions — deadlines, requirements, application status',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-media-list',
      name: 'Media List Builder',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Build and maintain journalist/blogger contact list for each industry vertical',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'auth-reputation-report',
      name: 'Reputation Reporter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Daily brand sentiment + mention summary across web and social',
      outputTable: 'army_opportunities',
      urgent: false,
    },
  ],
} as const;

export type AuthoritySkillId = typeof COMMANDER_AUTHORITY.skills[number]['id'];
