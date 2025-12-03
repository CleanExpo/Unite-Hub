/**
 * VEO Video Data
 * Professional 4K marketing videos generated using Gemini VEO
 * Following 5 Whys methodology for authentic, human-centered storytelling
 */

export interface VeoVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailUrl?: string;
  videoUrl: string;
  vimeoId?: string;
  duration: number; // in seconds
  category: 'lead-management' | 'sales-automation' | 'analytics' | 'workflow' | 'onboarding';
  tags: string[];
  resolution: '4K' | '1080p' | '720p';
  aspectRatio: '16:9' | '9:16' | '1:1';
  watermark: {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    opacity: number;
    size: string;
  };
  metadata: {
    uploadDate: string;
    views?: number;
    likes?: number;
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'revised';
  };
  scenes: Array<{
    startTime: number;
    endTime: number;
    description: string;
    emotion: string;
  }>;
}

/**
 * VEO Video Library - 6 Professional Marketing Videos
 * Based on scripts/generate-veo-videos.mjs
 */
export const veoVideos: VeoVideo[] = [
  {
    id: 'video-scattered-leads',
    title: 'Your Best Leads Are Hiding in 5 Different Places',
    description:
      'See the chaos of managing leads across Gmail, Facebook, Sheets, Slack, and notebooks. Watch how Synthex consolidates everything into one intelligent dashboard that automatically prioritizes your hottest prospects.',
    thumbnail: '/images/veo-thumbnails/scattered-leads-thumb.jpg',
    videoUrl: '/videos/veo/scattered-leads.mp4',
    vimeoId: 'placeholder-1',
    duration: 30,
    category: 'lead-management',
    tags: ['lead consolidation', 'inbox chaos', 'hot leads', 'organization'],
    resolution: '4K',
    aspectRatio: '16:9',
    watermark: {
      position: 'bottom-right',
      opacity: 0.45,
      size: '120px',
    },
    metadata: {
      uploadDate: '2025-12-02',
      approvalStatus: 'approved',
    },
    scenes: [
      {
        startTime: 0,
        endTime: 4,
        description: 'Split-screen chaos: 5 different tools with scattered leads',
        emotion: 'Chaos, overwhelm',
      },
      {
        startTime: 5,
        endTime: 10,
        description: 'Salesperson wasting 6+ hours searching for one lead',
        emotion: 'Frustration, wasted time',
      },
      {
        startTime: 11,
        endTime: 20,
        description: 'Hot prospect buried in inbox, competitor wins the deal',
        emotion: 'Regret, lost revenue',
      },
      {
        startTime: 21,
        endTime: 30,
        description: 'Synthex consolidates all leads, finds hot prospect in 10 seconds',
        emotion: 'Relief, control, winning',
      },
    ],
  },
  {
    id: 'video-5-minute-rule',
    title: 'The 5-Minute Conversion Rule Nobody Talks About',
    description:
      'MIT research reveals your window to convert a lead is just 5 minutes. After that, conversion odds drop 21x. See how Synthex alerts you instantly so you respond in minutes, not hours.',
    thumbnail: '/images/veo-thumbnails/5-minute-rule-thumb.jpg',
    videoUrl: '/videos/veo/5-minute-rule.mp4',
    vimeoId: 'placeholder-2',
    duration: 30,
    category: 'sales-automation',
    tags: ['speed-to-lead', 'conversion rate', 'mit research', 'instant alerts'],
    resolution: '4K',
    aspectRatio: '16:9',
    watermark: {
      position: 'bottom-right',
      opacity: 0.45,
      size: '120px',
    },
    metadata: {
      uploadDate: '2025-12-02',
      approvalStatus: 'approved',
    },
    scenes: [
      {
        startTime: 0,
        endTime: 5,
        description: 'MIT research visualization: 5-minute window vs 30-minute drop',
        emotion: 'Urgency, high stakes',
      },
      {
        startTime: 6,
        endTime: 12,
        description: 'Prospect waits 5 minutes, then moves to competitor',
        emotion: 'FOMO, competitive threat',
      },
      {
        startTime: 13,
        endTime: 22,
        description: '$47K per week lost from slow responses',
        emotion: 'Financial pain, urgency',
      },
      {
        startTime: 23,
        endTime: 30,
        description: 'Synthex instant alerts: respond in 3 minutes, close deals',
        emotion: 'Confidence, winning',
      },
    ],
  },
  {
    id: 'video-lead-scoring',
    title: 'Why Your Salesperson Is Wasting 40+ Hours on Cold Leads',
    description:
      'Watch a salesperson make 12 calls to cold leads while hot prospects sit ignored in the inbox. See how Synthex AI scoring identifies who\'s ready to buy RIGHT NOW.',
    thumbnail: '/images/veo-thumbnails/lead-scoring-thumb.jpg',
    videoUrl: '/videos/veo/lead-scoring.mp4',
    vimeoId: 'placeholder-3',
    duration: 30,
    category: 'sales-automation',
    tags: ['lead scoring', 'ai prioritization', 'sales efficiency', 'qualification'],
    resolution: '4K',
    aspectRatio: '16:9',
    watermark: {
      position: 'bottom-right',
      opacity: 0.45,
      size: '120px',
    },
    metadata: {
      uploadDate: '2025-12-02',
      approvalStatus: 'approved',
    },
    scenes: [
      {
        startTime: 0,
        endTime: 5,
        description: '12 cold calls, 0 conversions, 6 wasted hours',
        emotion: 'Frustration, wasted effort',
      },
      {
        startTime: 6,
        endTime: 13,
        description: 'No way to distinguish hot from cold leads',
        emotion: 'Helplessness, system failure',
      },
      {
        startTime: 14,
        endTime: 22,
        description: 'Hot prospect missed, competitor wins $45K deal',
        emotion: 'Regret, competitive loss',
      },
      {
        startTime: 23,
        endTime: 30,
        description: 'Synthex AI scores every lead, 3% to 5% conversion improvement',
        emotion: 'Control, intelligence, winning',
      },
    ],
  },
  {
    id: 'video-realtime-data',
    title: 'The 48-Hour Information Problem',
    description:
      'It\'s Friday. Your dashboard shows Wednesday\'s data. You\'ve already burned $3,200 on a failing campaign. See how Synthex real-time updates let you pivot the same day.',
    thumbnail: '/images/veo-thumbnails/realtime-data-thumb.jpg',
    videoUrl: '/videos/veo/realtime-data.mp4',
    vimeoId: 'placeholder-4',
    duration: 30,
    category: 'analytics',
    tags: ['real-time data', 'campaign monitoring', 'roi optimization', 'dashboard'],
    resolution: '4K',
    aspectRatio: '16:9',
    watermark: {
      position: 'bottom-right',
      opacity: 0.45,
      size: '120px',
    },
    metadata: {
      uploadDate: '2025-12-02',
      approvalStatus: 'approved',
    },
    scenes: [
      {
        startTime: 0,
        endTime: 4,
        description: 'Dashboard showing 48-hour old data',
        emotion: 'Uncertainty, lack of control',
      },
      {
        startTime: 5,
        endTime: 12,
        description: 'Campaign failing Thursday, discovered Friday: $3.2K wasted',
        emotion: 'Financial pain, frustration',
      },
      {
        startTime: 13,
        endTime: 22,
        description: 'Competitor sees problem in real-time, pivots, wins',
        emotion: 'Competitive anxiety, falling behind',
      },
      {
        startTime: 23,
        endTime: 30,
        description: 'Synthex real-time dashboard: pivot same day, ROI doubled',
        emotion: 'Control, confidence, empowerment',
      },
    ],
  },
  {
    id: 'video-approval-bottleneck',
    title: 'Why Approval Processes Kill Your Best Ideas',
    description:
      'Your campaign needs approval from 5 people in 8 time zones. By the time everyone signs off, the trend is dead. Watch how Synthex gets approvals in minutes, not days.',
    thumbnail: '/images/veo-thumbnails/approval-bottleneck-thumb.jpg',
    videoUrl: '/videos/veo/approval-bottleneck.mp4',
    vimeoId: 'placeholder-5',
    duration: 30,
    category: 'workflow',
    tags: ['approval workflow', 'team collaboration', 'campaign launch', 'efficiency'],
    resolution: '4K',
    aspectRatio: '16:9',
    watermark: {
      position: 'bottom-right',
      opacity: 0.45,
      size: '120px',
    },
    metadata: {
      uploadDate: '2025-12-02',
      approvalStatus: 'approved',
    },
    scenes: [
      {
        startTime: 0,
        endTime: 7,
        description: 'Campaign needs approval from 5 people, all busy',
        emotion: 'Dread, helplessness',
      },
      {
        startTime: 8,
        endTime: 16,
        description: 'Trend window closing while waiting for approvals',
        emotion: 'Panic, pressure',
      },
      {
        startTime: 17,
        endTime: 26,
        description: '23 emails, 5 revisions, 8 days elapsed',
        emotion: 'Exhaustion, futility',
      },
      {
        startTime: 27,
        endTime: 30,
        description: 'Synthex unified approvals: 5 minutes, launch same day',
        emotion: 'Relief, momentum, winning',
      },
    ],
  },
  {
    id: 'video-setup-tax',
    title: 'The Setup Tax That\'s Killing Your Growth',
    description:
      'Setup takes 6 weeks and a $12K developer bill. Your competitor launches in 18 minutes. By week 12, they\'re 3x ahead. See how Synthex eliminates the setup tax.',
    thumbnail: '/images/veo-thumbnails/setup-tax-thumb.jpg',
    videoUrl: '/videos/veo/setup-tax.mp4',
    vimeoId: 'placeholder-6',
    duration: 30,
    category: 'onboarding',
    tags: ['fast onboarding', 'no setup', 'quick start', 'time-to-value'],
    resolution: '4K',
    aspectRatio: '16:9',
    watermark: {
      position: 'bottom-right',
      opacity: 0.45,
      size: '120px',
    },
    metadata: {
      uploadDate: '2025-12-02',
      approvalStatus: 'approved',
    },
    scenes: [
      {
        startTime: 0,
        endTime: 5,
        description: '6-week setup, $12K developer cost',
        emotion: 'Dread, financial pain',
      },
      {
        startTime: 6,
        endTime: 13,
        description: 'Competitor launches Day 1 while you wait 6 weeks',
        emotion: 'Competitive disadvantage, regret',
      },
      {
        startTime: 14,
        endTime: 21,
        description: '6-week delay = $180K in lost revenue',
        emotion: 'Financial pain, urgency',
      },
      {
        startTime: 22,
        endTime: 30,
        description: 'Synthex: 18-minute setup, leads by tomorrow',
        emotion: 'Relief, momentum, empowerment',
      },
    ],
  },
];

/**
 * Get videos by category
 */
export function getVideosByCategory(
  category: VeoVideo['category']
): VeoVideo[] {
  return veoVideos.filter((video) => video.category === category);
}

/**
 * Get featured videos (approved only)
 */
export function getFeaturedVideos(): VeoVideo[] {
  return veoVideos.filter(
    (video) => video.metadata.approvalStatus === 'approved'
  );
}

/**
 * Get video by ID
 */
export function getVideoById(id: string): VeoVideo | undefined {
  return veoVideos.find((video) => video.id === id);
}

/**
 * Video categories for filtering
 */
export const veoVideoCategories = [
  { id: 'all', label: 'All Videos' },
  { id: 'lead-management', label: 'Lead Management' },
  { id: 'sales-automation', label: 'Sales Automation' },
  { id: 'analytics', label: 'Analytics & Insights' },
  { id: 'workflow', label: 'Workflow Optimization' },
  { id: 'onboarding', label: 'Quick Start' },
];

export default veoVideos;
