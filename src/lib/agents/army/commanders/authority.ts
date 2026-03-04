/**
 * Commander Authority — Senior Brand Authority PM configuration
 *
 * Orchestrates 10 authority-building skill agents covering backlink acquisition,
 * PR, thought leadership, podcast outreach, awards, and media placements for
 * Unite-Group and its business portfolio in the Australian market.
 *
 * UNI-1446: Commander Authority deploy
 */

export const COMMANDER_AUTHORITY = {
  id: 'commander-authority',
  name: 'Commander Authority',
  model: 'claude-sonnet-4-6',
  role: 'Senior Brand Authority PM',
  briefTime: '08:30', // AEST daily
  colour: '#FFB800',

  orchestrator: {
    id: 'authority-orchestrator',
    model: 'claude-haiku-4-5-20251001',
    role: 'Authority Orchestrator',
  },

  skills: [
    {
      id: 'auth-backlink-hunter',
      name: 'Backlink Hunter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Identify guest posting, link insertion, and HARO opportunities in AU market',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-pr-monitor',
      name: 'PR Monitor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Monitor news mentions, journalist queries, and PR placement opportunities',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-thought-leader',
      name: 'Thought Leadership Writer',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Draft LinkedIn articles and industry commentary pieces for Phill and Unite-Group executives',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'auth-podcast-scout',
      name: 'Podcast Scout',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Research relevant AU business and HR podcasts for guest appearance outreach',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'auth-awards-tracker',
      name: 'Awards Tracker',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Track AU business and industry award nominations, prepare submissions',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-case-study',
      name: 'Case Study Builder',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Identify customer success stories and draft case study outlines for approval',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'auth-media-pitcher',
      name: 'Media Pitcher',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Draft media pitches for AU tech, business, and HR publications',
      outputTable: 'army_content_queue',
      urgent: false,
    },
    {
      id: 'auth-community-builder',
      name: 'Community Builder',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Engage in AU LinkedIn groups, industry forums, and Reddit communities relevant to DR/NRPG',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'auth-testimonial-collector',
      name: 'Testimonial Collector',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Identify satisfied clients and draft testimonial request outreach',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'auth-reporter',
      name: 'Authority Reporter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Compile weekly authority metrics: DA growth, media mentions, backlink velocity',
      outputTable: 'army_opportunities',
      urgent: false,
    },
  ],
} as const;

export type AuthoritySkillId = typeof COMMANDER_AUTHORITY.skills[number]['id'];
