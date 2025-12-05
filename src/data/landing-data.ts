/**
 * Landing Page Data - Case Studies and Integrations
 */

export interface CaseStudy {
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  metrics: {
    label: string;
    before: string;
    after: string;
  }[];
  logoUrl?: string;
  testimonial: string;
  testimonialAuthor: string;
}

export interface Integration {
  name: string;
  description: string;
  iconName: string;
  status: 'Connected' | 'Available' | 'Coming Soon';
  actionText: string;
  badgeText?: string;
}

export const caseStudies: CaseStudy[] = [
  {
    company: 'Gold Coast Glass & Balustrades',
    industry: 'Trade Services - Glass & Balustrades',
    challenge:
      '50+ leads per month from Hipages and ServiceSeeking, no way to qualify them. Lost 30% to competitors due to slow response times.',
    solution:
      'Synthex auto-scored every lead based on engagement and intent. Prioritized hot opportunities in real-time.',
    metrics: [
      { label: 'Lead Response Time', before: '3 days', after: '4 hours' },
      { label: 'Close Rate', before: '18%', after: '31%' },
      { label: 'Monthly Revenue', before: 'A$42K', after: 'A$89K (+112%)' },
    ],
    testimonial:
      "Been in the glass game for 20 years. Wasted $45K on agencies that didn't deliver. Synthex actually works - we're not competing on price anymore because we reply first.",
    testimonialAuthor: 'Dave Mitchell, Owner - Gold Coast',
  },
  {
    company: 'Perth Plumbing Solutions',
    industry: 'Trade Services - Plumbing',
    challenge:
      "Managing quotes, follow-ups, and Google reviews while on the tools. Wife was doing admin nights and weekends - couldn't scale.",
    solution:
      'Synthex handles follow-up emails, review requests, and social media automatically. AI personalizes every message based on job type.',
    metrics: [
      { label: 'Follow-up Time', before: '3-5 days', after: 'Same day' },
      {
        label: 'Google Reviews',
        before: '2 per month',
        after: '15 per month',
      },
      { label: 'Quote Acceptance', before: '28%', after: '47%' },
    ],
    testimonial:
      "Mate, I'm a plumber not a marketer. This thing sends follow-ups while I'm under a house. Reviews come in automatically. My missus finally has her weekends back.",
    testimonialAuthor: 'Tony Rizzo, Owner - Perth',
  },
  {
    company: 'Melbourne Bricklaying Co.',
    industry: 'Trade Services - Bricklaying & Masonry',
    challenge:
      "70+ enquiries a month, couldn't keep up. Spent $28K on an agency for 18 months - they made a Facebook page and disappeared.",
    solution:
      'Synthex handles lead qualification, follow-ups, and sends before/after photos to prospects automatically. Built trust without lifting a finger.',
    metrics: [
      { label: 'Lead Response', before: '2-4 days', after: '2 hours' },
      { label: 'Quote Conversion', before: '19%', after: '38%' },
      { label: 'Monthly Revenue', before: 'A$63K', after: 'A$127K (+102%)' },
    ],
    testimonial:
      "That agency took my money and ghosted. Synthex costs less than their monthly retainer and actually brings in jobs. My crew's booked 3 months out now.",
    testimonialAuthor: 'Marco Battaglia, Owner - Melbourne',
  },
];

export const integrations: Integration[] = [
  {
    name: 'Gmail',
    description: 'Email parsing, lead extraction, open/click tracking',
    iconName: 'gmail',
    status: 'Connected',
    actionText: 'Configure',
    badgeText: 'Most Popular',
  },
  {
    name: 'Slack',
    description: 'Real-time alerts, approval notifications, deployment status',
    iconName: 'slack',
    status: 'Connected',
    actionText: 'Configure',
  },
  {
    name: 'Zapier',
    description: 'Workflow automation, trigger webhooks, CRM sync',
    iconName: 'zapier',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'HubSpot',
    description: 'Contact sync, lead scoring feed, pipeline visibility',
    iconName: 'hubspot',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'Stripe',
    description: 'Payment processing, invoice tracking, revenue attribution',
    iconName: 'stripe',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'Salesforce',
    description: 'Enterprise CRM sync, reporting, forecasting',
    iconName: 'salesforce',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'Mailchimp',
    description: 'Email list management, campaign integration',
    iconName: 'mailchimp',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'Pipedrive',
    description: 'Sales pipeline, deal tracking, revenue forecasting',
    iconName: 'pipedrive',
    status: 'Available',
    actionText: 'Connect',
  },
];
