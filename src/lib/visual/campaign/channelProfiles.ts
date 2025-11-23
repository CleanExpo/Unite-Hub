/**
 * Channel Profiles
 * Phase 69: Platform channel definitions for campaign planning
 */

export type CampaignChannel =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'youtube_shorts'
  | 'twitter'
  | 'pinterest'
  | 'reddit'
  | 'podcast'
  | 'email'
  | 'web'
  | 'display_ads'
  | 'google_business';

export interface ChannelProfile {
  id: CampaignChannel;
  name: string;
  category: 'social' | 'video' | 'professional' | 'content' | 'advertising';
  formats: ChannelFormat[];
  usage_notes: string[];
  best_for: string[];
  audience_type: string;
  engagement_style: string;
  posting_frequency: string;
}

export interface ChannelFormat {
  id: string;
  name: string;
  aspect_ratio: string;
  dimensions: { width: number; height: number };
  safe_zones?: { top: number; bottom: number; left: number; right: number };
  is_primary: boolean;
  supports_motion: boolean;
  max_duration_seconds?: number;
}

export const CHANNEL_PROFILES: Record<CampaignChannel, ChannelProfile> = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    formats: [
      { id: 'fb_feed', name: 'Feed Post', aspect_ratio: '1.91:1', dimensions: { width: 1200, height: 630 }, is_primary: true, supports_motion: true },
      { id: 'fb_square', name: 'Square Post', aspect_ratio: '1:1', dimensions: { width: 1080, height: 1080 }, is_primary: false, supports_motion: true },
      { id: 'fb_story', name: 'Story', aspect_ratio: '9:16', dimensions: { width: 1080, height: 1920 }, safe_zones: { top: 200, bottom: 200, left: 40, right: 40 }, is_primary: false, supports_motion: true, max_duration_seconds: 20 },
    ],
    usage_notes: ['Native videos get 10x more reach', 'Questions drive engagement', 'Avoid over-using hashtags'],
    best_for: ['Brand awareness', 'Community building', 'Events', 'Local business'],
    audience_type: 'General consumer, 35-65 demographic skew',
    engagement_style: 'Community-focused, conversational',
    posting_frequency: '1-2 times daily',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    formats: [
      { id: 'ig_feed', name: 'Feed Post', aspect_ratio: '1:1', dimensions: { width: 1080, height: 1080 }, is_primary: true, supports_motion: true },
      { id: 'ig_portrait', name: 'Portrait', aspect_ratio: '4:5', dimensions: { width: 1080, height: 1350 }, is_primary: false, supports_motion: true },
      { id: 'ig_story', name: 'Story', aspect_ratio: '9:16', dimensions: { width: 1080, height: 1920 }, safe_zones: { top: 150, bottom: 150, left: 30, right: 30 }, is_primary: false, supports_motion: true, max_duration_seconds: 15 },
      { id: 'ig_reel', name: 'Reel', aspect_ratio: '9:16', dimensions: { width: 1080, height: 1920 }, is_primary: false, supports_motion: true, max_duration_seconds: 90 },
    ],
    usage_notes: ['Visual quality is paramount', 'Reels get highest reach', 'Use 20-30 hashtags', 'Carousel posts get high saves'],
    best_for: ['Visual products', 'Lifestyle brands', 'Influencer marketing', 'E-commerce'],
    audience_type: 'Visual-first, 18-44 demographic',
    engagement_style: 'Aesthetic-driven, aspirational',
    posting_frequency: '1-3 times daily',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    category: 'video',
    formats: [
      { id: 'tt_video', name: 'Video', aspect_ratio: '9:16', dimensions: { width: 1080, height: 1920 }, safe_zones: { top: 150, bottom: 200, left: 30, right: 100 }, is_primary: true, supports_motion: true, max_duration_seconds: 180 },
    ],
    usage_notes: ['Hook in first 1-3 seconds', 'Use trending sounds', '21-34 seconds performs best', 'Authentic over polished'],
    best_for: ['Gen Z reach', 'Viral potential', 'Trend participation', 'Behind-the-scenes'],
    audience_type: 'Younger demographics, entertainment-focused',
    engagement_style: 'Fast-paced, trend-driven, authentic',
    posting_frequency: '1-4 times daily',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'professional',
    formats: [
      { id: 'li_post', name: 'Feed Post', aspect_ratio: '1.91:1', dimensions: { width: 1200, height: 627 }, is_primary: true, supports_motion: true },
      { id: 'li_square', name: 'Square Post', aspect_ratio: '1:1', dimensions: { width: 1080, height: 1080 }, is_primary: false, supports_motion: true },
      { id: 'li_document', name: 'Document', aspect_ratio: '1:1', dimensions: { width: 1080, height: 1080 }, is_primary: false, supports_motion: false },
    ],
    usage_notes: ['PDF documents get high engagement', 'Personal stories perform well', '3-5 hashtags max', 'Long-form text works'],
    best_for: ['B2B marketing', 'Thought leadership', 'Recruiting', 'Professional services'],
    audience_type: 'Business professionals, decision-makers',
    engagement_style: 'Professional, educational, value-driven',
    posting_frequency: '1 time daily (weekdays)',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    category: 'video',
    formats: [
      { id: 'yt_video', name: 'Video', aspect_ratio: '16:9', dimensions: { width: 1920, height: 1080 }, is_primary: true, supports_motion: true },
      { id: 'yt_thumbnail', name: 'Thumbnail', aspect_ratio: '16:9', dimensions: { width: 1280, height: 720 }, is_primary: false, supports_motion: false },
    ],
    usage_notes: ['Thumbnail is critical for CTR', '8-12 min ideal for monetization', 'Hook in first 15 seconds', 'End screens drive subs'],
    best_for: ['Educational content', 'Product demos', 'Long-form storytelling', 'Tutorials'],
    audience_type: 'All demographics, search-intent driven',
    engagement_style: 'Search-focused, entertainment and education',
    posting_frequency: '1-3 times weekly',
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    category: 'video',
    formats: [
      { id: 'yt_short', name: 'Short', aspect_ratio: '9:16', dimensions: { width: 1080, height: 1920 }, is_primary: true, supports_motion: true, max_duration_seconds: 60 },
    ],
    usage_notes: ['Quick hook essential', 'Repurpose from TikTok', 'Drives main channel subs', 'No end screens'],
    best_for: ['Quick tips', 'Behind-the-scenes', 'Highlights', 'Cross-platform reach'],
    audience_type: 'Mobile-first viewers',
    engagement_style: 'Quick, entertaining, snackable',
    posting_frequency: '3-7 times weekly',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    category: 'social',
    formats: [
      { id: 'x_post', name: 'Post Image', aspect_ratio: '16:9', dimensions: { width: 1200, height: 675 }, is_primary: true, supports_motion: true },
      { id: 'x_square', name: 'Square', aspect_ratio: '1:1', dimensions: { width: 1080, height: 1080 }, is_primary: false, supports_motion: true },
    ],
    usage_notes: ['71-100 chars optimal', 'Images boost engagement 150%', '1-2 hashtags max', 'Threads for long-form'],
    best_for: ['Real-time updates', 'News', 'Customer service', 'Tech audience'],
    audience_type: 'News-focused, tech-savvy, opinionated',
    engagement_style: 'Real-time, conversational, witty',
    posting_frequency: '3-5 times daily',
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    category: 'content',
    formats: [
      { id: 'pin_standard', name: 'Standard Pin', aspect_ratio: '2:3', dimensions: { width: 1000, height: 1500 }, is_primary: true, supports_motion: true },
      { id: 'pin_square', name: 'Square Pin', aspect_ratio: '1:1', dimensions: { width: 1000, height: 1000 }, is_primary: false, supports_motion: true },
    ],
    usage_notes: ['Vertical performs 50% better', 'Text overlay increases saves', 'SEO-rich descriptions', 'Rich Pins for products'],
    best_for: ['E-commerce', 'DIY/How-to', 'Recipes', 'Inspiration boards'],
    audience_type: 'Planning-focused, predominantly female',
    engagement_style: 'Aspirational, planning-oriented',
    posting_frequency: '5-10 pins daily',
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    category: 'content',
    formats: [
      { id: 'reddit_image', name: 'Image Post', aspect_ratio: '1.91:1', dimensions: { width: 1200, height: 628 }, is_primary: true, supports_motion: true },
    ],
    usage_notes: ['Value first, no self-promotion', 'Read subreddit rules', 'Authenticity is key', 'AMAs build trust'],
    best_for: ['Community engagement', 'Product feedback', 'Niche audiences', 'Tech products'],
    audience_type: 'Niche communities, detail-oriented',
    engagement_style: 'Community-driven, authentic, helpful',
    posting_frequency: 'Quality over quantity',
  },
  podcast: {
    id: 'podcast',
    name: 'Podcast',
    category: 'content',
    formats: [
      { id: 'podcast_cover', name: 'Show Art', aspect_ratio: '1:1', dimensions: { width: 3000, height: 3000 }, is_primary: true, supports_motion: false },
      { id: 'podcast_episode', name: 'Episode Art', aspect_ratio: '1:1', dimensions: { width: 1400, height: 1400 }, is_primary: false, supports_motion: false },
    ],
    usage_notes: ['Show art is your billboard', 'Episode art aids discovery', 'Readable at small sizes', 'Consistent branding'],
    best_for: ['Thought leadership', 'Interviews', 'Educational content', 'Brand storytelling'],
    audience_type: 'Engaged listeners, commuters, multitaskers',
    engagement_style: 'Long-form, intimate, conversational',
    posting_frequency: 'Weekly or bi-weekly',
  },
  email: {
    id: 'email',
    name: 'Email',
    category: 'advertising',
    formats: [
      { id: 'email_header', name: 'Header', aspect_ratio: '3:1', dimensions: { width: 600, height: 200 }, is_primary: true, supports_motion: true },
      { id: 'email_hero', name: 'Hero Image', aspect_ratio: '2:1', dimensions: { width: 600, height: 300 }, is_primary: false, supports_motion: true },
    ],
    usage_notes: ['Keep images under 100KB', 'Design for image-off view', 'Mobile-first', 'CTA above fold'],
    best_for: ['Nurturing', 'Promotions', 'Newsletters', 'Transactional'],
    audience_type: 'Opted-in subscribers, various intents',
    engagement_style: 'Direct, personal, action-oriented',
    posting_frequency: '2-4 times weekly',
  },
  web: {
    id: 'web',
    name: 'Web',
    category: 'content',
    formats: [
      { id: 'web_hero', name: 'Hero', aspect_ratio: '16:9', dimensions: { width: 1920, height: 1080 }, is_primary: true, supports_motion: true },
      { id: 'web_og', name: 'OG Image', aspect_ratio: '1.91:1', dimensions: { width: 1200, height: 630 }, is_primary: false, supports_motion: false },
    ],
    usage_notes: ['Optimize for performance', 'Consider retina displays', 'Lazy load below fold', 'WebP format preferred'],
    best_for: ['Brand presence', 'Conversion', 'SEO', 'All content'],
    audience_type: 'Varies by site purpose',
    engagement_style: 'Conversion-focused, informational',
    posting_frequency: 'As needed',
  },
  display_ads: {
    id: 'display_ads',
    name: 'Display Ads',
    category: 'advertising',
    formats: [
      { id: 'display_mrec', name: 'Medium Rectangle', aspect_ratio: '1.2:1', dimensions: { width: 300, height: 250 }, is_primary: true, supports_motion: true },
      { id: 'display_leaderboard', name: 'Leaderboard', aspect_ratio: '8.5:1', dimensions: { width: 728, height: 90 }, is_primary: false, supports_motion: true },
      { id: 'display_skyscraper', name: 'Skyscraper', aspect_ratio: '1:3.75', dimensions: { width: 160, height: 600 }, is_primary: false, supports_motion: true },
    ],
    usage_notes: ['Clear CTA essential', 'Brand visible immediately', 'Animate sparingly', 'Test multiple sizes'],
    best_for: ['Retargeting', 'Brand awareness', 'Traffic driving', 'Remarketing'],
    audience_type: 'Targeted based on intent/behavior',
    engagement_style: 'Interruptive, attention-grabbing',
    posting_frequency: 'Campaign-based',
  },
  google_business: {
    id: 'google_business',
    name: 'Google Business',
    category: 'content',
    formats: [
      { id: 'gbp_post', name: 'Post', aspect_ratio: '4:3', dimensions: { width: 1200, height: 900 }, is_primary: true, supports_motion: false },
      { id: 'gbp_cover', name: 'Cover', aspect_ratio: '16:9', dimensions: { width: 1080, height: 608 }, is_primary: false, supports_motion: false },
    ],
    usage_notes: ['Regular posts improve local SEO', 'Respond to all reviews', 'Add products/services', 'Update hours/info'],
    best_for: ['Local businesses', 'Service areas', 'Retail', 'Restaurants'],
    audience_type: 'Local searchers, high intent',
    engagement_style: 'Informational, transactional',
    posting_frequency: 'Weekly minimum',
  },
};

export function getChannelProfile(id: CampaignChannel): ChannelProfile {
  return CHANNEL_PROFILES[id];
}

export function getChannelsByCategory(category: ChannelProfile['category']): ChannelProfile[] {
  return Object.values(CHANNEL_PROFILES).filter(c => c.category === category);
}

export function getPrimaryFormat(channelId: CampaignChannel): ChannelFormat {
  const profile = CHANNEL_PROFILES[channelId];
  return profile.formats.find(f => f.is_primary) || profile.formats[0];
}

export default CHANNEL_PROFILES;
