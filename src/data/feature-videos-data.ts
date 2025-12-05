/**
 * Feature Videos Data
 * Contains video content for the FeatureVideoCarousel component
 */

export interface FeatureVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  category: 'automation' | 'analytics' | 'content' | 'ai' | 'integration';
  views?: number;
  likes?: number;
}

export const featureVideos: FeatureVideo[] = [
  {
    id: 'video-1',
    title: 'AI-Powered Content Generation in 60 Seconds',
    description: 'See how Synthex generates high-quality content using advanced AI. Perfect for agencies and creators.',
    thumbnail: '/images/generated/ai-content-generation.png',
    videoUrl: 'https://example.com/videos/content-generation',
    duration: '2:15',
    category: 'ai',
    views: 12450,
    likes: 892,
  },
  {
    id: 'video-2',
    title: 'Workflow Automation: Set It and Forget It',
    description: 'Automate your entire content distribution pipeline. Save 10+ hours per week on repetitive tasks.',
    thumbnail: '/images/generated/feature-workflow-automation.png',
    videoUrl: 'https://example.com/videos/automation-workflow',
    duration: '3:42',
    category: 'automation',
    views: 9320,
    likes: 654,
  },
  {
    id: 'video-3',
    title: 'Multi-Platform Analytics Dashboard',
    description: 'Track performance across all channels in one unified dashboard. Real-time insights for better decisions.',
    thumbnail: '/images/generated/feature-analytics-dashboard.png',
    videoUrl: 'https://example.com/videos/analytics-dashboard',
    duration: '2:58',
    category: 'analytics',
    views: 8765,
    likes: 723,
  },
  {
    id: 'video-4',
    title: 'Smart Lead Scoring & Routing',
    description: 'Automatically prioritize leads and route them to the right team members. Increase conversion rates by 40%.',
    thumbnail: '/images/generated/feature-lead-scoring.png',
    videoUrl: 'https://example.com/videos/lead-scoring',
    duration: '3:15',
    category: 'ai',
    views: 7540,
    likes: 612,
  },
  {
    id: 'video-5',
    title: 'Content Personalization at Scale',
    description: 'Create personalized content for each segment automatically. Increase engagement and conversions.',
    thumbnail: '/images/generated/ai-content-personalization.jpg',
    videoUrl: 'https://example.com/videos/personalization',
    duration: '2:47',
    category: 'content',
    views: 6890,
    likes: 521,
  },
  {
    id: 'video-6',
    title: 'Integrations That Actually Work',
    description: 'Connect with 50+ tools seamlessly. No more manual data entry or broken workflows.',
    thumbnail: '/images/generated/feature-integrations-hub.png',
    videoUrl: 'https://example.com/videos/integrations',
    duration: '2:22',
    category: 'integration',
    views: 5432,
    likes: 445,
  },
];

export const videoCategories = [
  { id: 'all', label: 'All Videos' },
  { id: 'ai', label: 'AI & Automation' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'content', label: 'Content' },
  { id: 'integration', label: 'Integrations' },
  { id: 'automation', label: 'Workflows' },
];
