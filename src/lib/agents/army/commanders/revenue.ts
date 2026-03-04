/**
 * Commander Revenue — Senior Revenue PM configuration
 *
 * Orchestrates 10 revenue-focused skill agents covering lead generation,
 * pricing intelligence, funnel monitoring, upsell, invoicing, and outreach
 * for the Australian market (NRPG, DR, aged care, childcare, mining sectors).
 *
 * UNI-1446: Commander Revenue deploy
 */

export const COMMANDER_REVENUE = {
  id: 'commander-revenue',
  name: 'Commander Revenue',
  model: 'claude-sonnet-4-6',
  role: 'Senior Revenue PM',
  briefTime: '07:30', // AEST daily
  colour: '#00FF88',

  orchestrator: {
    id: 'rev-orchestrator',
    model: 'claude-haiku-4-5-20251001',
    role: 'Revenue Orchestrator',
  },

  skills: [
    {
      id: 'rev-lead-hunter',
      name: 'Lead Hunter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Monitor tenders, RFPs, job boards for NRPG/DR leads',
      targets: ['tenders.net.au', 'seek.com.au', 'linkedin.com/jobs'],
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'rev-price-watch',
      name: 'Price Watch',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Track competitor pricing changes',
      outputTable: 'army_competitor_updates',
      urgent: false,
    },
    {
      id: 'rev-funnel',
      name: 'Funnel Monitor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'hourly',
      description: 'Monitor Stripe conversions, cart abandonment',
      outputTable: 'army_opportunities',
      urgent: true,
    },
    {
      id: 'rev-upsell',
      name: 'Upsell Finder',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Analyse existing customers for upsell opportunities',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'rev-invoice',
      name: 'Invoice Tracker',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Track overdue invoices, draft payment reminders',
      outputTable: 'army_opportunities',
      urgent: false,
    },
    {
      id: 'rev-mining',
      name: 'Mining Outreach',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Research mining company contacts, draft outreach for DR',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'rev-agedcare',
      name: 'Aged Care Outreach',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Research aged care facility contacts for DR services',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'rev-childcare',
      name: 'Childcare Outreach',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'weekly',
      description: 'Research childcare chain contacts for DR services',
      outputTable: 'army_leads',
      urgent: false,
    },
    {
      id: 'rev-reviews',
      name: 'Reviews Monitor',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'hourly',
      description: 'Monitor Google/product reviews, flag negative, draft responses',
      outputTable: 'army_opportunities',
      urgent: true,
    },
    {
      id: 'rev-reporter',
      name: 'Revenue Reporter',
      model: 'claude-haiku-4-5-20251001',
      schedule: 'daily',
      description: 'Compile daily revenue metrics from Stripe + Xero',
      outputTable: 'army_opportunities',
      urgent: false,
    },
  ],
} as const;

export type RevenueSkillId = typeof COMMANDER_REVENUE.skills[number]['id'];
