/**
 * Channel Playbooks
 * Defines best practices, specifications, and generation rules for each content channel
 */

export interface ChannelPlaybook {
  channel: string;
  category: 'website' | 'blog' | 'social' | 'email' | 'video';
  specs: {
    maxLength?: number;
    optimalLength?: number;
    requiredElements: string[];
    optionalElements: string[];
    formatting?: Record<string, any>;
  };
  brandVoiceGuidelines: Record<string, string>;
  seoRequirements?: {
    titleLength: [number, number];
    metaDescriptionLength: [number, number];
    keywordDensity: [number, number];
    headingStructure: string[];
  };
  contentStructure: {
    hook: string;
    body: string[];
    cta: string;
  };
}

export const channelPlaybooks: Record<string, ChannelPlaybook> = {
  website_landing_page: {
    channel: 'website_landing_page',
    category: 'website',
    specs: {
      requiredElements: ['hero', 'value_proposition', 'benefits', 'social_proof', 'cta'],
      optionalElements: ['features', 'pricing', 'faq', 'trust_badges'],
      formatting: { sections: 5-7, cta_count: 2-3 },
    },
    brandVoiceGuidelines: {
      unite_group: 'Professional, authoritative, solution-focused',
      aussie_stainless: 'Craftsmanship-focused, quality-driven, Australian pride',
      rp_tech: 'Technical, innovative, efficiency-focused',
    },
    seoRequirements: {
      titleLength: [50, 60],
      metaDescriptionLength: [150, 160],
      keywordDensity: [1, 2.5],
      headingStructure: ['H1', 'H2', 'H3'],
    },
    contentStructure: {
      hook: 'Problem statement or compelling benefit',
      body: ['Value proposition', 'Key benefits (3-5)', 'Social proof', 'Features overview'],
      cta: 'Clear, action-oriented CTA with urgency',
    },
  },

  blog_pillar_post: {
    channel: 'blog_pillar_post',
    category: 'blog',
    specs: {
      optimalLength: 3000,
      maxLength: 4000,
      requiredElements: ['introduction', 'table_of_contents', 'main_sections', 'conclusion', 'cta'],
      optionalElements: ['key_takeaways', 'expert_quotes', 'case_studies', 'related_posts'],
    },
    brandVoiceGuidelines: {
      unite_group: 'Authoritative, comprehensive, educational',
      aussie_stainless: 'Expert craftsmanship, detailed technical knowledge',
      rp_tech: 'Technical depth, innovation-focused, data-driven',
    },
    seoRequirements: {
      titleLength: [50, 60],
      metaDescriptionLength: [150, 160],
      keywordDensity: [1, 2],
      headingStructure: ['H1', 'H2', 'H3', 'H4'],
    },
    contentStructure: {
      hook: 'Compelling introduction with clear value statement',
      body: [
        'Comprehensive coverage of topic',
        '10-15 internal links to cluster posts',
        'Data, statistics, expert insights',
        'Visual elements (images, infographics)',
      ],
      cta: 'Multiple CTAs throughout + strong conclusion CTA',
    },
  },

  facebook_post: {
    channel: 'facebook_post',
    category: 'social',
    specs: {
      optimalLength: 60,
      maxLength: 80,
      requiredElements: ['hook', 'value', 'cta'],
      optionalElements: ['emoji', 'hashtags', 'mention'],
    },
    brandVoiceGuidelines: {
      unite_group: 'Conversational yet professional, community-focused',
      aussie_stainless: 'Proud, craftsmanship-highlighting, visual',
      bne_glass_pool_fencing: 'Safety-focused, family-oriented, local',
    },
    contentStructure: {
      hook: 'Question or attention-grabbing statement (first 3 words critical)',
      body: ['Value or insight', 'Relatable context', 'Visual prompt'],
      cta: 'Engagement ask (comment, share, click)',
    },
  },

  instagram_post: {
    channel: 'instagram_post',
    category: 'social',
    specs: {
      optimalLength: 125,
      maxLength: 2200,
      requiredElements: ['caption', 'hashtags', 'cta'],
      optionalElements: ['emoji', 'line_breaks', 'mention'],
      formatting: { hashtags: [20, 30], first_line_hook: true },
    },
    brandVoiceGuidelines: {
      unite_group: 'Visual storytelling, aspirational, modern',
      aussie_stainless: 'Showcase craftsmanship, before/after, process',
      ultra_chrome: 'Sleek, premium, detail-focused',
    },
    contentStructure: {
      hook: 'First line must grab attention (appears before "... more")',
      body: ['Story or value', 'Relatability', 'Visual description'],
      cta: 'Engage (save, share, DM) or visit link in bio',
    },
  },

  linkedin_post: {
    channel: 'linkedin_post',
    category: 'social',
    specs: {
      optimalLength: 1300,
      maxLength: 3000,
      requiredElements: ['professional_hook', 'insight', 'cta'],
      optionalElements: ['data_point', 'personal_experience', 'industry_trend'],
      formatting: { paragraphs: 'short', hashtags: [3, 5] },
    },
    brandVoiceGuidelines: {
      unite_group: 'Thought leadership, industry insights, value-driven',
      rp_tech: 'Innovation showcase, technical expertise, problem-solving',
    },
    contentStructure: {
      hook: 'Professional insight or compelling question',
      body: ['Personal or industry perspective', 'Data or case study', 'Actionable takeaway'],
      cta: 'Professional engagement (thoughts, experiences, connect)',
    },
  },

  tiktok_video: {
    channel: 'tiktok_video',
    category: 'video',
    specs: {
      optimalLength: 27,
      maxLength: 60,
      requiredElements: ['hook_1-3s', 'value_delivery', 'cta'],
      optionalElements: ['trending_audio', 'text_overlay', 'transition'],
      formatting: { aspect_ratio: '9:16', caption_length: 150, hashtags: [3, 5] },
    },
    brandVoiceGuidelines: {
      unite_group: 'Educational, behind-the-scenes, process showcase',
      aussie_stainless: 'Craftsmanship in action, satisfying visuals',
      bne_glass_pool_fencing: 'Safety tips, transformation reveals, local focus',
    },
    contentStructure: {
      hook: 'First 1-3 seconds must stop scroll (visual or text)',
      body: ['Quick value delivery', 'Engaging visuals', 'Relatable moment'],
      cta: 'Follow for more, stitch this, or visit link',
    },
  },

  youtube_short: {
    channel: 'youtube_short',
    category: 'video',
    specs: {
      optimalLength: 45,
      maxLength: 60,
      requiredElements: ['hook', 'value', 'subscribe_cta'],
      optionalElements: ['end_screen', 'chapter_markers'],
      formatting: { aspect_ratio: '9:16', title_length: 100 },
    },
    brandVoiceGuidelines: {
      unite_group: 'Educational, authoritative, valuable',
      rp_tech: 'Tech explainers, how-tos, innovation showcase',
    },
    contentStructure: {
      hook: 'First 3 seconds: "In this short, you\'ll learn..."',
      body: ['Quick tutorial or insight', 'Visual demonstration', 'Key takeaway'],
      cta: 'Subscribe + watch full video link in description',
    },
  },

  email_newsletter: {
    channel: 'email_newsletter',
    category: 'email',
    specs: {
      optimalLength: 400,
      maxLength: 500,
      requiredElements: ['subject_line', 'preview_text', 'body', 'cta', 'unsubscribe'],
      optionalElements: ['personalization', 'image', 'ps'],
      formatting: { subject_length: 50, preview_length: 90 },
    },
    brandVoiceGuidelines: {
      unite_group: 'Valuable insights, industry updates, exclusive offers',
      aussie_stainless: 'Project showcases, craftsmanship tips, customer stories',
    },
    contentStructure: {
      hook: 'Subject line: curiosity + value (avoid spam triggers)',
      body: ['Personal greeting', 'Value-first content', 'Clear benefit', 'Single focused CTA'],
      cta: 'One primary CTA, mobile-optimized button',
    },
  },

  email_nurture_sequence: {
    channel: 'email_nurture_sequence',
    category: 'email',
    specs: {
      optimalLength: 300,
      maxLength: 400,
      requiredElements: ['sequence_goal', 'personalization', 'progressive_value', 'cta'],
      optionalElements: ['social_proof', 'urgency', 'faq_anticipation'],
      formatting: { emails_in_sequence: [5, 7], interval_days: [3, 5] },
    },
    brandVoiceGuidelines: {
      unite_group: 'Build trust, demonstrate expertise, guide decision-making',
      rp_tech: 'Educational, technical depth increasing, solution-focused',
    },
    contentStructure: {
      hook: 'Each email builds on previous, addresses specific objections',
      body: [
        'Email 1: Welcome + expectation setting',
        'Email 2-4: Progressive education + value',
        'Email 5-7: Social proof + conversion focus',
      ],
      cta: 'Low commitment → High commitment progression',
    },
  },
};

export function getChannelPlaybook(channel: string): ChannelPlaybook | undefined {
  return channelPlaybooks[channel];
}

export function getBrandChannels(brandSlug: string): string[] {
  const brandChannelMap: Record<string, string[]> = {
    unite_group: [
      'website_landing_page',
      'blog_pillar_post',
      'facebook_post',
      'instagram_post',
      'linkedin_post',
      'tiktok_video',
      'youtube_short',
      'email_newsletter',
    ],
    aussie_stainless: [
      'website_landing_page',
      'blog_pillar_post',
      'facebook_post',
      'instagram_post',
      'tiktok_video',
      'youtube_short',
      'email_newsletter',
    ],
    rp_tech: [
      'website_landing_page',
      'blog_pillar_post',
      'linkedin_post',
      'youtube_short',
      'email_newsletter',
      'email_nurture_sequence',
    ],
    bne_glass_pool_fencing: [
      'website_landing_page',
      'facebook_post',
      'instagram_post',
      'tiktok_video',
      'email_newsletter',
    ],
    ultra_chrome: [
      'website_landing_page',
      'instagram_post',
      'tiktok_video',
      'email_newsletter',
    ],
  };

  return brandChannelMap[brandSlug] || [];
}
