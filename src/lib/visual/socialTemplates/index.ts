/**
 * Social Platform Templates
 * Phase 68: Cross-platform template engines for 12 social/media platforms
 */

export interface PlatformSpec {
  id: string;
  name: string;
  formats: FormatSpec[];
  best_practices: string[];
  content_guidelines: ContentGuideline[];
  optimal_posting: PostingSchedule;
  hashtag_strategy: HashtagStrategy;
}

export interface FormatSpec {
  id: string;
  name: string;
  type: 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'cover';
  dimensions: { width: number; height: number };
  aspect_ratio: string;
  max_file_size_mb: number;
  max_duration_seconds?: number;
  supported_formats: string[];
  safe_zones?: SafeZone[];
}

export interface SafeZone {
  name: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
  description: string;
}

export interface ContentGuideline {
  element: string;
  rule: string;
  priority: 'required' | 'recommended' | 'optional';
}

export interface PostingSchedule {
  best_days: string[];
  best_times: string[];
  timezone_note: string;
}

export interface HashtagStrategy {
  max_count: number;
  placement: 'inline' | 'end' | 'comment';
  recommendations: string[];
}

// Platform specifications for 12 platforms
export const PLATFORM_SPECS: PlatformSpec[] = [
  // 1. Facebook
  {
    id: 'facebook',
    name: 'Facebook',
    formats: [
      {
        id: 'fb_post',
        name: 'Feed Post',
        type: 'image',
        dimensions: { width: 1200, height: 630 },
        aspect_ratio: '1.91:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png', 'gif'],
        safe_zones: [
          { name: 'text_overlay', top: 20, right: 20, bottom: 100, left: 20, description: 'Keep text away from edges' },
        ],
      },
      {
        id: 'fb_square',
        name: 'Square Post',
        type: 'image',
        dimensions: { width: 1080, height: 1080 },
        aspect_ratio: '1:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'fb_story',
        name: 'Story',
        type: 'story',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 4,
        max_duration_seconds: 20,
        supported_formats: ['jpg', 'png', 'mp4'],
        safe_zones: [
          { name: 'header', top: 0, right: 0, bottom: 1800, left: 0, description: 'Username/time overlay' },
          { name: 'footer', top: 1700, right: 0, bottom: 0, left: 0, description: 'Reply bar area' },
        ],
      },
      {
        id: 'fb_cover',
        name: 'Page Cover',
        type: 'cover',
        dimensions: { width: 820, height: 312 },
        aspect_ratio: '2.63:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'fb_video',
        name: 'Video Post',
        type: 'video',
        dimensions: { width: 1280, height: 720 },
        aspect_ratio: '16:9',
        max_file_size_mb: 4000,
        max_duration_seconds: 240,
        supported_formats: ['mp4', 'mov'],
      },
    ],
    best_practices: [
      'Use eye-catching visuals with minimal text',
      'Include clear CTA',
      'Optimal post length: 40-80 characters',
      'Native videos get 10x more reach than links',
    ],
    content_guidelines: [
      { element: 'text_overlay', rule: 'Keep under 20% of image', priority: 'recommended' },
      { element: 'cta', rule: 'Include clear call-to-action', priority: 'recommended' },
      { element: 'branding', rule: 'Logo visible but not dominant', priority: 'optional' },
    ],
    optimal_posting: {
      best_days: ['Wednesday', 'Thursday', 'Friday'],
      best_times: ['9am', '1pm', '3pm'],
      timezone_note: 'Adjust to target audience timezone',
    },
    hashtag_strategy: {
      max_count: 3,
      placement: 'end',
      recommendations: ['Use branded hashtags', 'Avoid overusing - reduces reach'],
    },
  },

  // 2. Instagram
  {
    id: 'instagram',
    name: 'Instagram',
    formats: [
      {
        id: 'ig_feed',
        name: 'Feed Post',
        type: 'image',
        dimensions: { width: 1080, height: 1080 },
        aspect_ratio: '1:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'ig_portrait',
        name: 'Portrait Post',
        type: 'image',
        dimensions: { width: 1080, height: 1350 },
        aspect_ratio: '4:5',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'ig_story',
        name: 'Story',
        type: 'story',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 4,
        max_duration_seconds: 15,
        supported_formats: ['jpg', 'png', 'mp4'],
        safe_zones: [
          { name: 'top_bar', top: 0, right: 0, bottom: 1770, left: 0, description: 'Story bar, username' },
          { name: 'bottom_bar', top: 1750, right: 0, bottom: 0, left: 0, description: 'Swipe up, reply' },
        ],
      },
      {
        id: 'ig_reel',
        name: 'Reel',
        type: 'reel',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 4000,
        max_duration_seconds: 90,
        supported_formats: ['mp4'],
      },
      {
        id: 'ig_carousel',
        name: 'Carousel',
        type: 'carousel',
        dimensions: { width: 1080, height: 1080 },
        aspect_ratio: '1:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
    ],
    best_practices: [
      'High-quality, visually appealing images',
      'Use all 2200 characters in caption if valuable',
      'First 125 characters are critical (preview)',
      'Reels get 22% more engagement than videos',
    ],
    content_guidelines: [
      { element: 'quality', rule: 'High resolution, sharp images', priority: 'required' },
      { element: 'aesthetic', rule: 'Consistent visual style', priority: 'recommended' },
      { element: 'caption', rule: 'Front-load important info', priority: 'recommended' },
    ],
    optimal_posting: {
      best_days: ['Tuesday', 'Wednesday', 'Friday'],
      best_times: ['11am', '2pm', '7pm'],
      timezone_note: 'Peak times vary by audience',
    },
    hashtag_strategy: {
      max_count: 30,
      placement: 'end',
      recommendations: ['Mix popular and niche', 'Use 20-30 relevant hashtags', 'Rotate hashtag sets'],
    },
  },

  // 3. TikTok
  {
    id: 'tiktok',
    name: 'TikTok',
    formats: [
      {
        id: 'tt_video',
        name: 'Video',
        type: 'video',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 287,
        max_duration_seconds: 180,
        supported_formats: ['mp4', 'mov'],
        safe_zones: [
          { name: 'right_icons', top: 400, right: 0, bottom: 400, left: 980, description: 'Like, comment, share buttons' },
          { name: 'bottom_caption', top: 1600, right: 100, bottom: 0, left: 0, description: 'Caption and music ticker' },
        ],
      },
      {
        id: 'tt_photo',
        name: 'Photo Mode',
        type: 'carousel',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 10,
        supported_formats: ['jpg', 'png'],
      },
    ],
    best_practices: [
      'Hook viewers in first 1-3 seconds',
      'Use trending sounds for 30% reach boost',
      '21-34 second videos perform best',
      'Vertical format only, no letterboxing',
    ],
    content_guidelines: [
      { element: 'hook', rule: 'Capture attention in 1-3 seconds', priority: 'required' },
      { element: 'audio', rule: 'Use trending or original sounds', priority: 'recommended' },
      { element: 'text', rule: 'On-screen captions for accessibility', priority: 'recommended' },
    ],
    optimal_posting: {
      best_days: ['Tuesday', 'Thursday', 'Friday'],
      best_times: ['7am', '12pm', '7pm'],
      timezone_note: 'Algorithm favors consistency',
    },
    hashtag_strategy: {
      max_count: 5,
      placement: 'inline',
      recommendations: ['Use trending hashtags', 'Include niche tags', '#fyp still works'],
    },
  },

  // 4. LinkedIn
  {
    id: 'linkedin',
    name: 'LinkedIn',
    formats: [
      {
        id: 'li_post',
        name: 'Feed Post',
        type: 'image',
        dimensions: { width: 1200, height: 627 },
        aspect_ratio: '1.91:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'li_square',
        name: 'Square Post',
        type: 'image',
        dimensions: { width: 1080, height: 1080 },
        aspect_ratio: '1:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'li_carousel',
        name: 'Document/Carousel',
        type: 'carousel',
        dimensions: { width: 1080, height: 1080 },
        aspect_ratio: '1:1',
        max_file_size_mb: 100,
        supported_formats: ['pdf'],
      },
      {
        id: 'li_video',
        name: 'Video',
        type: 'video',
        dimensions: { width: 1920, height: 1080 },
        aspect_ratio: '16:9',
        max_file_size_mb: 5000,
        max_duration_seconds: 600,
        supported_formats: ['mp4'],
      },
      {
        id: 'li_banner',
        name: 'Profile Banner',
        type: 'cover',
        dimensions: { width: 1584, height: 396 },
        aspect_ratio: '4:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
    ],
    best_practices: [
      'Professional, value-driven content',
      'Sweet spot: 1300 characters',
      'PDF carousels get high engagement',
      'Native documents outperform links',
    ],
    content_guidelines: [
      { element: 'tone', rule: 'Professional yet personable', priority: 'required' },
      { element: 'value', rule: 'Educational or insightful content', priority: 'required' },
      { element: 'formatting', rule: 'Use line breaks, emojis sparingly', priority: 'recommended' },
    ],
    optimal_posting: {
      best_days: ['Tuesday', 'Wednesday', 'Thursday'],
      best_times: ['8am', '10am', '12pm'],
      timezone_note: 'Business hours in target timezone',
    },
    hashtag_strategy: {
      max_count: 5,
      placement: 'end',
      recommendations: ['Use industry hashtags', 'Include 3-5 relevant tags', 'Avoid trending/viral tags'],
    },
  },

  // 5. YouTube
  {
    id: 'youtube',
    name: 'YouTube',
    formats: [
      {
        id: 'yt_video',
        name: 'Standard Video',
        type: 'video',
        dimensions: { width: 1920, height: 1080 },
        aspect_ratio: '16:9',
        max_file_size_mb: 128000,
        max_duration_seconds: 43200,
        supported_formats: ['mp4', 'mov', 'avi'],
      },
      {
        id: 'yt_short',
        name: 'Short',
        type: 'reel',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 1000,
        max_duration_seconds: 60,
        supported_formats: ['mp4'],
      },
      {
        id: 'yt_thumbnail',
        name: 'Thumbnail',
        type: 'image',
        dimensions: { width: 1280, height: 720 },
        aspect_ratio: '16:9',
        max_file_size_mb: 2,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'yt_banner',
        name: 'Channel Banner',
        type: 'cover',
        dimensions: { width: 2560, height: 1440 },
        aspect_ratio: '16:9',
        max_file_size_mb: 6,
        supported_formats: ['jpg', 'png'],
        safe_zones: [
          { name: 'tv_safe', top: 312, right: 507, bottom: 312, left: 507, description: 'Visible on TV' },
          { name: 'desktop_safe', top: 423, right: 277, bottom: 423, left: 277, description: 'Visible on desktop' },
          { name: 'mobile_safe', top: 518, right: 862, bottom: 518, left: 862, description: 'Visible on mobile' },
        ],
      },
    ],
    best_practices: [
      'Custom thumbnails increase CTR 154%',
      '8-12 minute videos ideal for monetization',
      'Hook viewers in first 15 seconds',
      'End screens in last 20 seconds',
    ],
    content_guidelines: [
      { element: 'thumbnail', rule: 'Faces, contrast, readable text', priority: 'required' },
      { element: 'title', rule: 'Under 60 characters, keyword-rich', priority: 'required' },
      { element: 'description', rule: 'First 150 chars appear in search', priority: 'required' },
    ],
    optimal_posting: {
      best_days: ['Thursday', 'Friday', 'Saturday'],
      best_times: ['2pm', '4pm'],
      timezone_note: 'Post 2-3 hours before peak viewing',
    },
    hashtag_strategy: {
      max_count: 15,
      placement: 'end',
      recommendations: ['3-5 in description', 'Use in title sparingly', 'Include branded tag'],
    },
  },

  // 6. Twitter/X
  {
    id: 'twitter',
    name: 'X (Twitter)',
    formats: [
      {
        id: 'x_post',
        name: 'Post Image',
        type: 'image',
        dimensions: { width: 1200, height: 675 },
        aspect_ratio: '16:9',
        max_file_size_mb: 5,
        supported_formats: ['jpg', 'png', 'gif'],
      },
      {
        id: 'x_square',
        name: 'Square Image',
        type: 'image',
        dimensions: { width: 1080, height: 1080 },
        aspect_ratio: '1:1',
        max_file_size_mb: 5,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'x_header',
        name: 'Header',
        type: 'cover',
        dimensions: { width: 1500, height: 500 },
        aspect_ratio: '3:1',
        max_file_size_mb: 5,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'x_video',
        name: 'Video',
        type: 'video',
        dimensions: { width: 1920, height: 1080 },
        aspect_ratio: '16:9',
        max_file_size_mb: 512,
        max_duration_seconds: 140,
        supported_formats: ['mp4'],
      },
    ],
    best_practices: [
      '71-100 characters get 17% more engagement',
      'Tweets with images get 150% more retweets',
      'Use threads for long-form content',
      'Quote tweets perform well',
    ],
    content_guidelines: [
      { element: 'brevity', rule: 'Concise, impactful messaging', priority: 'required' },
      { element: 'media', rule: 'Include image/video when possible', priority: 'recommended' },
      { element: 'thread', rule: 'Use for detailed content', priority: 'optional' },
    ],
    optimal_posting: {
      best_days: ['Wednesday', 'Friday'],
      best_times: ['9am', '12pm', '5pm'],
      timezone_note: 'Real-time platform, timing matters',
    },
    hashtag_strategy: {
      max_count: 2,
      placement: 'inline',
      recommendations: ['1-2 hashtags max', 'Avoid hashtag stuffing', 'Use trending wisely'],
    },
  },

  // 7. Pinterest
  {
    id: 'pinterest',
    name: 'Pinterest',
    formats: [
      {
        id: 'pin_standard',
        name: 'Standard Pin',
        type: 'image',
        dimensions: { width: 1000, height: 1500 },
        aspect_ratio: '2:3',
        max_file_size_mb: 20,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'pin_square',
        name: 'Square Pin',
        type: 'image',
        dimensions: { width: 1000, height: 1000 },
        aspect_ratio: '1:1',
        max_file_size_mb: 20,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'pin_video',
        name: 'Video Pin',
        type: 'video',
        dimensions: { width: 1000, height: 1500 },
        aspect_ratio: '2:3',
        max_file_size_mb: 2000,
        max_duration_seconds: 900,
        supported_formats: ['mp4'],
      },
      {
        id: 'pin_idea',
        name: 'Idea Pin',
        type: 'carousel',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 20,
        supported_formats: ['jpg', 'png', 'mp4'],
      },
    ],
    best_practices: [
      'Vertical images perform 50% better',
      'Text overlay on images increases saves',
      'Rich Pins for products/recipes',
      'Consistent pinning schedule',
    ],
    content_guidelines: [
      { element: 'orientation', rule: 'Vertical 2:3 preferred', priority: 'required' },
      { element: 'text_overlay', rule: 'Clear, readable title on image', priority: 'recommended' },
      { element: 'description', rule: 'Keyword-rich, 500 chars', priority: 'required' },
    ],
    optimal_posting: {
      best_days: ['Saturday', 'Sunday'],
      best_times: ['8pm', '9pm', '11pm'],
      timezone_note: 'Evening and weekend browsing',
    },
    hashtag_strategy: {
      max_count: 20,
      placement: 'end',
      recommendations: ['Use 5-10 descriptive tags', 'Include in description', 'Keyword-focused'],
    },
  },

  // 8. Reddit
  {
    id: 'reddit',
    name: 'Reddit',
    formats: [
      {
        id: 'reddit_image',
        name: 'Image Post',
        type: 'image',
        dimensions: { width: 1200, height: 628 },
        aspect_ratio: '1.91:1',
        max_file_size_mb: 20,
        supported_formats: ['jpg', 'png', 'gif'],
      },
      {
        id: 'reddit_gallery',
        name: 'Gallery',
        type: 'carousel',
        dimensions: { width: 1200, height: 628 },
        aspect_ratio: '1.91:1',
        max_file_size_mb: 20,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'reddit_video',
        name: 'Video',
        type: 'video',
        dimensions: { width: 1920, height: 1080 },
        aspect_ratio: '16:9',
        max_file_size_mb: 1000,
        max_duration_seconds: 900,
        supported_formats: ['mp4'],
      },
    ],
    best_practices: [
      'Value first, promotion never',
      'Engage authentically in comments',
      'Respect subreddit rules',
      'Title is everything - 60-80 chars',
    ],
    content_guidelines: [
      { element: 'authenticity', rule: 'No blatant self-promotion', priority: 'required' },
      { element: 'value', rule: 'Educational/entertaining content', priority: 'required' },
      { element: 'disclosure', rule: 'Disclose affiliations', priority: 'required' },
    ],
    optimal_posting: {
      best_days: ['Monday', 'Saturday', 'Sunday'],
      best_times: ['6am', '8am', '12pm'],
      timezone_note: 'US morning times for US audience',
    },
    hashtag_strategy: {
      max_count: 0,
      placement: 'inline',
      recommendations: ['Hashtags not used on Reddit', 'Use flair instead', 'Tag in title if required'],
    },
  },

  // 9. Snapchat
  {
    id: 'snapchat',
    name: 'Snapchat',
    formats: [
      {
        id: 'snap_story',
        name: 'Story',
        type: 'story',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 5,
        max_duration_seconds: 60,
        supported_formats: ['jpg', 'png', 'mp4'],
        safe_zones: [
          { name: 'top', top: 0, right: 0, bottom: 1770, left: 0, description: 'Username area' },
          { name: 'bottom', top: 1750, right: 0, bottom: 0, left: 0, description: 'Swipe up area' },
        ],
      },
      {
        id: 'snap_spotlight',
        name: 'Spotlight',
        type: 'reel',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 256,
        max_duration_seconds: 60,
        supported_formats: ['mp4'],
      },
    ],
    best_practices: [
      'Authentic, unpolished content',
      'Use AR lenses and filters',
      'Vertical full-screen only',
      'Hook in first second',
    ],
    content_guidelines: [
      { element: 'authenticity', rule: 'Raw, real content preferred', priority: 'required' },
      { element: 'format', rule: 'Full-screen vertical only', priority: 'required' },
      { element: 'engagement', rule: 'Use interactive elements', priority: 'recommended' },
    ],
    optimal_posting: {
      best_days: ['Tuesday', 'Wednesday', 'Friday'],
      best_times: ['10pm', '11pm'],
      timezone_note: 'Late night engagement peaks',
    },
    hashtag_strategy: {
      max_count: 0,
      placement: 'inline',
      recommendations: ['Not applicable to Snapchat', 'Use stickers and text instead'],
    },
  },

  // 10. Threads
  {
    id: 'threads',
    name: 'Threads',
    formats: [
      {
        id: 'threads_post',
        name: 'Post',
        type: 'image',
        dimensions: { width: 1080, height: 1080 },
        aspect_ratio: '1:1',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png', 'gif'],
      },
      {
        id: 'threads_carousel',
        name: 'Carousel',
        type: 'carousel',
        dimensions: { width: 1080, height: 1350 },
        aspect_ratio: '4:5',
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'png'],
      },
    ],
    best_practices: [
      'Text-first platform',
      'Conversational tone',
      'Cross-post from Instagram',
      'Engage in replies',
    ],
    content_guidelines: [
      { element: 'text', rule: '500 character limit', priority: 'required' },
      { element: 'tone', rule: 'Casual, conversational', priority: 'recommended' },
      { element: 'engagement', rule: 'Reply to build community', priority: 'recommended' },
    ],
    optimal_posting: {
      best_days: ['Tuesday', 'Thursday'],
      best_times: ['8am', '12pm', '8pm'],
      timezone_note: 'Still emerging - test and learn',
    },
    hashtag_strategy: {
      max_count: 1,
      placement: 'inline',
      recommendations: ['Minimal hashtag use', 'Tags for discovery only'],
    },
  },

  // 11. WhatsApp Status
  {
    id: 'whatsapp',
    name: 'WhatsApp Status',
    formats: [
      {
        id: 'wa_status_image',
        name: 'Status Image',
        type: 'story',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 16,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'wa_status_video',
        name: 'Status Video',
        type: 'story',
        dimensions: { width: 1080, height: 1920 },
        aspect_ratio: '9:16',
        max_file_size_mb: 16,
        max_duration_seconds: 30,
        supported_formats: ['mp4'],
      },
    ],
    best_practices: [
      'Personal, direct communication',
      'Use for announcements and updates',
      'Link to catalog for products',
      '24-hour visibility window',
    ],
    content_guidelines: [
      { element: 'personal', rule: 'Direct, personal messaging', priority: 'required' },
      { element: 'timing', rule: 'Consider 24-hour expiry', priority: 'recommended' },
    ],
    optimal_posting: {
      best_days: ['Monday', 'Wednesday', 'Friday'],
      best_times: ['10am', '4pm', '8pm'],
      timezone_note: 'Match contact active hours',
    },
    hashtag_strategy: {
      max_count: 0,
      placement: 'inline',
      recommendations: ['Not applicable'],
    },
  },

  // 12. Google Business Profile
  {
    id: 'google_business',
    name: 'Google Business Profile',
    formats: [
      {
        id: 'gbp_post',
        name: 'Post Image',
        type: 'image',
        dimensions: { width: 1200, height: 900 },
        aspect_ratio: '4:3',
        max_file_size_mb: 5,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'gbp_logo',
        name: 'Logo',
        type: 'image',
        dimensions: { width: 250, height: 250 },
        aspect_ratio: '1:1',
        max_file_size_mb: 5,
        supported_formats: ['jpg', 'png'],
      },
      {
        id: 'gbp_cover',
        name: 'Cover Photo',
        type: 'cover',
        dimensions: { width: 1080, height: 608 },
        aspect_ratio: '16:9',
        max_file_size_mb: 5,
        supported_formats: ['jpg', 'png'],
      },
    ],
    best_practices: [
      'Regular posting improves local SEO',
      'Use for offers, events, updates',
      'High-quality business photos',
      'Respond to all reviews',
    ],
    content_guidelines: [
      { element: 'relevance', rule: 'Business-related content only', priority: 'required' },
      { element: 'cta', rule: 'Include button CTA', priority: 'recommended' },
      { element: 'frequency', rule: 'Post weekly minimum', priority: 'recommended' },
    ],
    optimal_posting: {
      best_days: ['Monday', 'Tuesday', 'Wednesday'],
      best_times: ['9am', '12pm'],
      timezone_note: 'Business hours in your timezone',
    },
    hashtag_strategy: {
      max_count: 0,
      placement: 'inline',
      recommendations: ['Not applicable for GBP'],
    },
  },
];

// Helper functions
export function getPlatformById(id: string): PlatformSpec | undefined {
  return PLATFORM_SPECS.find(p => p.id === id);
}

export function getFormatById(platformId: string, formatId: string): FormatSpec | undefined {
  const platform = getPlatformById(platformId);
  return platform?.formats.find(f => f.id === formatId);
}

export function getFormatsForType(type: FormatSpec['type']): { platform: string; format: FormatSpec }[] {
  const results: { platform: string; format: FormatSpec }[] = [];

  for (const platform of PLATFORM_SPECS) {
    for (const format of platform.formats) {
      if (format.type === type) {
        results.push({ platform: platform.id, format });
      }
    }
  }

  return results;
}

export function getAllPlatformIds(): string[] {
  return PLATFORM_SPECS.map(p => p.id);
}

export default PLATFORM_SPECS;
