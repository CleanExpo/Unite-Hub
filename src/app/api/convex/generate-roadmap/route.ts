import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';

/**
 * POST /api/convex/generate-roadmap
 *
 * Generate execution roadmap with milestones, tasks, and success checkpoints
 *
 * Request body:
 * {
 *   templateId: string
 *   templateName: string
 *   templateType: 'landing_page' | 'seo_plan' | 'paid_ads' | 'offer_architecture'
 *   estimatedDuration: number (hours)
 *   variables: Record<string, string>
 * }
 *
 * Response:
 * {
 *   templateId: string
 *   templateName: string
 *   startDate: string (ISO date)
 *   totalDuration: number (weeks)
 *   milestones: ExecutionMilestone[]
 *   overallProgress: number (0-100)
 *   riskFactors: string[]
 *   supportResources: string[]
 * }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, templateName, templateType, estimatedDuration, variables } = body;

    if (!templateId || !templateName || !templateType) {
      logger.warn('[CONVEX-ROADMAP] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logger.info(`[CONVEX-ROADMAP] Generating roadmap for ${templateName}`);

    // Calculate total duration in weeks
    const totalDuration = Math.ceil(estimatedDuration / 40); // Assuming 40 hours per week

    // Generate milestones based on template type
    let milestones = [];

    switch (templateType) {
      case 'landing_page': {
        milestones = [
          {
            week: 1,
            title: 'Strategy & Design',
            objectives: ['Define conversion goal', 'Map customer journey', 'Design layout'],
            tasks: [
              {
                id: 'task-1',
                title: 'Define conversion funnel stages',
                description: 'Map awareness → consideration → decision journey for landing page',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 4,
                successCriteria: [
                  'Funnel stages documented',
                  'Target audience personas defined',
                  'Conversion goal quantified',
                ],
              },
              {
                id: 'task-2',
                title: 'Design page layout wireframe',
                description: 'Create wireframe showing hero, value prop, proof, CTA sections',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 3,
                successCriteria: [
                  'Wireframe created with sections',
                  'User flow validated',
                  'Mobile version included',
                ],
              },
            ],
            successMetrics: [
              'Conversion goal defined and measurable',
              'Page layout optimized for mobile',
            ],
            completionPercentage: 0,
          },
          {
            week: 2,
            title: 'Content Development',
            objectives: ['Write copy', 'Create testimonials', 'Source images'],
            tasks: [
              {
                id: 'task-3',
                title: 'Write compelling headline',
                description: 'Create attention-grabbing headline using CONVEX compression rules',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 2,
                successCriteria: [
                  'Headline is clear and benefit-focused',
                  '3+ variations tested',
                  'Includes primary keyword naturally',
                ],
              },
              {
                id: 'task-4',
                title: 'Gather social proof and testimonials',
                description: 'Collect 3-5 customer testimonials with metrics',
                dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'medium' as const,
                estimatedHours: 3,
                successCriteria: [
                  '3+ testimonials collected',
                  'Each includes metric or outcome',
                  'Include customer name and title',
                ],
              },
            ],
            successMetrics: [
              'Copy written and reviewed',
              'Social proof gathered (5+ pieces)',
              'Images/video selected',
            ],
            completionPercentage: 0,
          },
          {
            week: 3,
            title: 'Development & Launch',
            objectives: ['Build page', 'Set up analytics', 'Launch'],
            tasks: [
              {
                id: 'task-5',
                title: 'Build landing page in design tool',
                description: 'Develop page in Figma or WordPress',
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 6,
                successCriteria: [
                  'Mobile responsive',
                  'All copy in place',
                  'CTAs functional',
                  'Performance optimized',
                ],
              },
              {
                id: 'task-6',
                title: 'Set up conversion tracking',
                description: 'Configure Google Analytics 4, conversion pixels, and CRM integration',
                dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 2,
                successCriteria: [
                  'GA4 properly configured',
                  'Conversion event tracked',
                  'CRM integration verified',
                ],
              },
            ],
            successMetrics: [
              'Page live and accessible',
              'Analytics tracking confirmed',
              'First conversions recorded',
            ],
            completionPercentage: 0,
          },
        ];
        break;
      }

      case 'seo_plan': {
        milestones = [
          {
            week: 1,
            title: 'Research & Planning',
            objectives: ['Keyword research', 'Competitor analysis', 'Content roadmap'],
            tasks: [
              {
                id: 'task-1',
                title: 'Conduct keyword research',
                description: 'Find 50+ related keywords with search volume and intent',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 6,
                successCriteria: [
                  '50+ keywords identified',
                  'Search volume data included',
                  'Intent categorized (awareness/consideration/decision)',
                ],
              },
              {
                id: 'task-2',
                title: 'Analyze top 10 competitors',
                description: 'Review competitor content, backlinks, and positioning',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 4,
                successCriteria: [
                  'Competitor content gaps identified',
                  'Backlink opportunities found',
                  'Unique positioning angle defined',
                ],
              },
            ],
            successMetrics: [
              'Keyword clusters identified',
              'Content gaps mapped',
              'Competitive advantage clear',
            ],
            completionPercentage: 0,
          },
          {
            week: 2,
            title: 'Pillar Content Creation',
            objectives: ['Write pillar article', 'Optimize technical SEO', 'Build initial backlinks'],
            tasks: [
              {
                id: 'task-3',
                title: 'Create 5,000+ word pillar article',
                description: 'Comprehensive guide covering primary keyword thoroughly',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 8,
                successCriteria: [
                  '5,000+ words minimum',
                  'Covers 10+ related topics',
                  'Internal linking planned',
                  'Schema markup added',
                ],
              },
              {
                id: 'task-4',
                title: 'Optimize technical SEO',
                description: 'Core Web Vitals, mobile optimization, site speed',
                dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'medium' as const,
                estimatedHours: 4,
                successCriteria: [
                  'Core Web Vitals optimized',
                  'Mobile score 90+',
                  'Page speed <3 seconds',
                ],
              },
            ],
            successMetrics: [
              'Pillar content published',
              'Technical SEO score 80+',
              '10+ initial backlinks acquired',
            ],
            completionPercentage: 0,
          },
          {
            week: 3,
            title: 'Cluster Content & Link Building',
            objectives: ['Create 10 cluster articles', 'Build backlinks', 'Internal linking'],
            tasks: [
              {
                id: 'task-5',
                title: 'Create 10 cluster articles (1,500-2,500 words each)',
                description: 'Target semantic variations and long-tail keywords',
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 12,
                successCriteria: [
                  '10 articles published',
                  'Each targets unique keyword',
                  'Linked to pillar content',
                  'Optimized for search intent',
                ],
              },
              {
                id: 'task-6',
                title: 'Build high-quality backlinks',
                description: 'Tier 1 (DA50+), Tier 2 (DA30+), Tier 3 (DA10+) strategy',
                dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 8,
                successCriteria: [
                  '30+ backlinks acquired',
                  'Average referring domain DA 40+',
                  'Natural link anchor text distribution',
                  'No PBN links',
                ],
              },
            ],
            successMetrics: [
              'Cluster content published',
              'Referring domains: 30+',
              'Primary keyword ranking: Top 30',
            ],
            completionPercentage: 0,
          },
          {
            week: 4,
            title: 'Monitoring & Optimization',
            objectives: ['Track rankings', 'Optimize underperforming content', 'Plan next phase'],
            tasks: [
              {
                id: 'task-7',
                title: 'Set up ranking tracking',
                description: 'Monitor 20+ target keywords weekly',
                dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'medium' as const,
                estimatedHours: 2,
                successCriteria: [
                  'Ranking tracker configured',
                  'Weekly reports automated',
                  'Goal thresholds set',
                ],
              },
            ],
            successMetrics: [
              'Rankings tracked and reported',
              'Traffic increased 20%',
              'Content gaps identified for next phase',
            ],
            completionPercentage: 0,
          },
        ];
        break;
      }

      case 'paid_ads': {
        milestones = [
          {
            week: 1,
            title: 'Strategy & Account Setup',
            objectives: ['Define audience', 'Create ad copy', 'Set up accounts'],
            tasks: [
              {
                id: 'task-1',
                title: 'Define target audience personas',
                description: 'Create 3+ detailed audience segments with demographics, interests, pain points',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 3,
                successCriteria: [
                  '3+ personas created',
                  'Psychographic data included',
                  'Budget allocation per persona',
                ],
              },
              {
                id: 'task-2',
                title: 'Create 6+ ad copy variations',
                description: 'Benefit-focused, problem-focused, exclusivity-focused variants',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 4,
                successCriteria: [
                  '6+ variations written',
                  'Different angles tested',
                  'Headline + description pairs created',
                ],
              },
            ],
            successMetrics: [
              'Audience definition complete',
              'Ad copy drafted and reviewed',
            ],
            completionPercentage: 0,
          },
          {
            week: 2,
            title: 'Campaign Launch',
            objectives: ['Set up ads', 'Launch campaigns', 'Monitor performance'],
            tasks: [
              {
                id: 'task-3',
                title: 'Set up Google Ads campaigns',
                description: 'Search campaigns for high-intent keywords',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 3,
                successCriteria: [
                  'Campaigns live and serving impressions',
                  'Budget allocated per campaign',
                  'Conversion tracking implemented',
                ],
              },
              {
                id: 'task-4',
                title: 'Launch Facebook/Instagram campaigns',
                description: 'Interest and lookalike audience targeting',
                dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 3,
                successCriteria: [
                  'Campaigns live',
                  'Audience targeting configured',
                  'Dynamic creative optimization enabled',
                ],
              },
            ],
            successMetrics: [
              'Campaigns live',
              'Getting impressions and clicks',
              'Initial ROAS data incoming',
            ],
            completionPercentage: 0,
          },
          {
            week: 3,
            title: 'Optimization & Scaling',
            objectives: ['Analyze performance', 'Optimize underperformers', 'Scale winners'],
            tasks: [
              {
                id: 'task-5',
                title: 'Analyze week 1 performance data',
                description: 'Review CTR, CPC, conversion rate by campaign and ad variant',
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 2,
                successCriteria: [
                  'Performance data analyzed',
                  'Top/bottom performers identified',
                  'Optimization recommendations documented',
                ],
              },
              {
                id: 'task-6',
                title: 'Pause underperforming variants, scale winners',
                description: 'Adjust budgets based on ROAS and CPA',
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 1,
                successCriteria: [
                  'Budget reallocated to winners',
                  'Underperformers paused',
                  'New audiences tested',
                ],
              },
            ],
            successMetrics: [
              'ROAS 1.5x+ achieved',
              'CPA reduced 20%',
              'Winners identified and scaling',
            ],
            completionPercentage: 0,
          },
        ];
        break;
      }

      case 'offer_architecture': {
        milestones = [
          {
            week: 1,
            title: 'Offer Design',
            objectives: ['Assess offer strength', 'Design risk reversal', 'Create sales page'],
            tasks: [
              {
                id: 'task-1',
                title: 'Complete 10-point offer strength assessment',
                description: 'Evaluate all components: specificity, value, credibility, exclusivity, etc.',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 3,
                successCriteria: [
                  'All 10 points scored',
                  'Gaps identified',
                  'Improvement plan documented',
                ],
              },
              {
                id: 'task-2',
                title: 'Design risk reversal guarantee',
                description: 'Money-back, performance, or relationship guarantee',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 2,
                successCriteria: [
                  'Guarantee type selected',
                  'Terms clearly defined',
                  'Customer objection addressed',
                ],
              },
            ],
            successMetrics: [
              'Offer strength score 7+/10',
              'Risk reversal designed',
            ],
            completionPercentage: 0,
          },
          {
            week: 2,
            title: 'Implementation',
            objectives: ['Create sales page', 'Set up checkout', 'Launch offer'],
            tasks: [
              {
                id: 'task-3',
                title: 'Create compelling sales page',
                description: 'Headline, subheadline, problem-agitate-solve, proof, guarantee, CTA',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 6,
                successCriteria: [
                  'All sections included',
                  'Social proof visible',
                  'Guarantee prominent',
                  'Mobile optimized',
                ],
              },
              {
                id: 'task-4',
                title: 'Set up payment processing',
                description: 'Stripe/PayPal integration, email confirmations, CRM sync',
                dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending' as const,
                priority: 'high' as const,
                estimatedHours: 2,
                successCriteria: [
                  'Payment processor integrated',
                  'Test transaction successful',
                  'CRM and email automation connected',
                ],
              },
            ],
            successMetrics: [
              'Sales page live and converting',
              '2-5% conversion rate achieved',
            ],
            completionPercentage: 0,
          },
        ];
        break;
      }

      default: {
        return NextResponse.json(
          { error: 'Unknown template type' },
          { status: 400 }
        );
      }
    }

    const riskFactors = [
      'Insufficient team capacity may delay tasks by 20-30%',
      'Scope creep if requirements change mid-project',
      'External dependencies (approvals, third-party integrations) may cause delays',
      'Learning curve for new tools or platforms',
    ];

    const supportResources = [
      'CONVEX Framework Library - reference for messaging and positioning',
      'Template examples - real-world implementations to guide execution',
      'Weekly progress check-ins - ensure alignment and address blockers',
      'Expert review sessions - validate quality before launch',
      'Post-launch optimization guide - maximize performance after go-live',
    ];

    logger.info(`[CONVEX-ROADMAP] Roadmap generated with ${milestones.length} milestones`);

    return NextResponse.json({
      templateId,
      templateName,
      startDate: new Date().toISOString().split('T')[0],
      totalDuration,
      milestones,
      overallProgress: 0,
      riskFactors,
      supportResources,
    });
  } catch (error) {
    logger.error('[CONVEX-ROADMAP] Roadmap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap' },
      { status: 500 }
    );
  }
}
