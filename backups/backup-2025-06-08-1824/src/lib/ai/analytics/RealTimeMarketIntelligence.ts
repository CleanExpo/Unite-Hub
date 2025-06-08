/**
 * RealTimeMarketIntelligence - Advanced market analysis and competitive intelligence
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 * Phase 2 Parallel: Real-Time Market Intelligence Engine
 */

import { RuntimeService } from '../../services/base/RuntimeService';
import { getAdvancedAnalyticsEngine } from './AdvancedAnalyticsEngine';
import { getCustomerJourneyAnalyzer } from './CustomerJourneyAnalyzer';

export interface MarketTrend {
  id: string;
  category: 'technology' | 'industry' | 'consumer' | 'competitive' | 'economic' | 'regulatory';
  title: string;
  description: string;
  magnitude: number; // 0-100 impact score
  confidence: number; // 0-1 prediction confidence
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  sources: string[];
  keywords: string[];
  sentiment: number; // -1 to 1
  momentum: 'increasing' | 'stable' | 'decreasing';
  implications: string[];
  recommendations: string[];
  detected: Date;
  lastUpdated: Date;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  domain: string;
  category: 'direct' | 'indirect' | 'emerging' | 'substitute';
  marketShare: number;
  funding: {
    total: number;
    lastRound: {
      amount: number;
      type: string;
      date: Date;
    };
    investors: string[];
  };
  metrics: {
    users: number;
    revenue: number;
    growth: number;
    satisfaction: number;
  };
  features: {
    name: string;
    description: string;
    differentiator: boolean;
    adoptionRate: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recentNews: NewsItem[];
  lastAnalyzed: Date;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: number;
  relevance: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  entities: string[];
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description: string;
  category: 'product' | 'market' | 'technology' | 'partnership' | 'acquisition';
  potential: {
    revenue: number;
    users: number;
    marketSize: number;
  };
  requirements: {
    resources: string[];
    timeline: number; // months
    investment: number;
    risks: string[];
  };
  competitiveAdvantage: string[];
  barriers: string[];
  timeToMarket: number; // months
  roi: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  identified: Date;
}

export interface MarketAnalysis {
  timestamp: Date;
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  overview: {
    totalMarketSize: number;
    growthRate: number;
    competitorCount: number;
    trendCount: number;
    opportunityCount: number;
  };
  segmentation: {
    segment: string;
    size: number;
    growth: number;
    competitiveness: number;
    ourPosition: number;
  }[];
  competitiveLandscape: {
    leaders: CompetitorProfile[];
    challengers: CompetitorProfile[];
    niche: CompetitorProfile[];
    emerging: CompetitorProfile[];
  };
  insights: {
    type: 'trend' | 'opportunity' | 'threat' | 'strength' | 'weakness';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
    recommendations: string[];
  }[];
  predictions: {
    marketGrowth: number;
    competitorActions: string[];
    emergingThreats: string[];
    newOpportunities: string[];
    timeHorizon: number; // months
  };
}

export interface TrendPrediction {
  id: string;
  trendId: string;
  prediction: {
    direction: 'up' | 'down' | 'stable' | 'volatile';
    magnitude: number;
    timeframe: number; // days
    confidence: number;
    factors: string[];
  };
  impact: {
    onRevenue: number;
    onMarketShare: number;
    onCustomers: number;
    onCompetition: number;
  };
  scenarios: {
    best: { description: string; probability: number; outcome: string };
    likely: { description: string; probability: number; outcome: string };
    worst: { description: string; probability: number; outcome: string };
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  created: Date;
}

export class RealTimeMarketIntelligence extends RuntimeService {
  private static instance: RealTimeMarketIntelligence | null = null;
  private analyticsEngine: Awaited<ReturnType<typeof getAdvancedAnalyticsEngine>> | null = null;
  private journeyAnalyzer: Awaited<ReturnType<typeof getCustomerJourneyAnalyzer>> | null = null;
  
  private marketTrends: Map<string, MarketTrend> = new Map();
  private competitors: Map<string, CompetitorProfile> = new Map();
  private opportunities: Map<string, MarketOpportunity> = new Map();
  private analyses: MarketAnalysis[] = [];
  private predictions: Map<string, TrendPrediction> = new Map();
  private newsItems: NewsItem[] = [];
  
  private readonly TREND_ANALYSIS_INTERVAL = 300000; // 5 minutes
  private readonly COMPETITOR_ANALYSIS_INTERVAL = 900000; // 15 minutes
  private readonly MARKET_ANALYSIS_INTERVAL = 1800000; // 30 minutes
  private readonly NEWS_MONITORING_INTERVAL = 180000; // 3 minutes
  
  private trendInterval: NodeJS.Timeout | null = null;
  private competitorInterval: NodeJS.Timeout | null = null;
  private marketInterval: NodeJS.Timeout | null = null;
  private newsInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeMarketData();
  }

  static async getInstance(): Promise<RealTimeMarketIntelligence> {
    if (!this.instance) {
      this.instance = new RealTimeMarketIntelligence();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🌍 Real-Time Market Intelligence initializing...');
    this.analyticsEngine = await getAdvancedAnalyticsEngine();
    this.journeyAnalyzer = await getCustomerJourneyAnalyzer();
    
    this.startTrendAnalysis();
    this.startCompetitorMonitoring();
    this.startMarketAnalysis();
    this.startNewsMonitoring();
  }

  private initializeMarketData(): void {
    // Initialize market trends
    const trends: MarketTrend[] = [
      {
        id: 'ai-automation-surge',
        category: 'technology',
        title: 'AI Automation in Business Software',
        description: 'Rapid adoption of AI-powered automation tools across enterprise software',
        magnitude: 95,
        confidence: 0.92,
        timeframe: 'short-term',
        sources: ['TechCrunch', 'McKinsey', 'Gartner'],
        keywords: ['AI', 'automation', 'enterprise', 'software'],
        sentiment: 0.8,
        momentum: 'increasing',
        implications: [
          'Increased demand for AI-powered features',
          'Higher customer expectations for automation',
          'Competitive pressure to integrate AI'
        ],
        recommendations: [
          'Accelerate AI feature development',
          'Highlight AI capabilities in marketing',
          'Invest in machine learning infrastructure'
        ],
        detected: new Date(Date.now() - 86400000),
        lastUpdated: new Date()
      },
      {
        id: 'low-code-platforms',
        category: 'technology',
        title: 'Low-Code/No-Code Platform Growth',
        description: 'Explosive growth in low-code development platforms enabling citizen developers',
        magnitude: 88,
        confidence: 0.89,
        timeframe: 'medium-term',
        sources: ['Forrester', 'IDC', 'TechTarget'],
        keywords: ['low-code', 'no-code', 'citizen-developer', 'rapid-development'],
        sentiment: 0.7,
        momentum: 'increasing',
        implications: [
          'Democratization of software development',
          'Faster time-to-market for solutions',
          'Potential threat to traditional development'
        ],
        recommendations: [
          'Consider low-code integrations',
          'Develop visual development tools',
          'Target non-technical users'
        ],
        detected: new Date(Date.now() - 172800000),
        lastUpdated: new Date()
      },
      {
        id: 'remote-work-permanent',
        category: 'industry',
        title: 'Permanent Remote Work Adoption',
        description: 'Organizations making remote work permanent, driving demand for collaboration tools',
        magnitude: 82,
        confidence: 0.95,
        timeframe: 'long-term',
        sources: ['Harvard Business Review', 'Remote.co', 'Buffer'],
        keywords: ['remote-work', 'collaboration', 'digital-transformation'],
        sentiment: 0.6,
        momentum: 'stable',
        implications: [
          'Sustained demand for remote collaboration tools',
          'Need for better digital workflows',
          'Security and compliance requirements'
        ],
        recommendations: [
          'Enhance collaboration features',
          'Improve mobile experience',
          'Focus on security and compliance'
        ],
        detected: new Date(Date.now() - 259200000),
        lastUpdated: new Date()
      }
    ];

    trends.forEach(trend => this.marketTrends.set(trend.id, trend));

    // Initialize competitor profiles
    const competitors: CompetitorProfile[] = [
      {
        id: 'competitor-a',
        name: 'InnovationSoft',
        domain: 'innovationsoft.com',
        category: 'direct',
        marketShare: 15.2,
        funding: {
          total: 125000000,
          lastRound: {
            amount: 45000000,
            type: 'Series C',
            date: new Date('2024-09-15')
          },
          investors: ['Accel Partners', 'Index Ventures', 'Sequoia Capital']
        },
        metrics: {
          users: 250000,
          revenue: 85000000,
          growth: 65,
          satisfaction: 4.2
        },
        features: [
          {
            name: 'AI-Powered Analytics',
            description: 'Advanced analytics with machine learning',
            differentiator: true,
            adoptionRate: 78
          },
          {
            name: 'Workflow Automation',
            description: 'Automated business process management',
            differentiator: false,
            adoptionRate: 85
          }
        ],
        strengths: [
          'Strong AI capabilities',
          'Excellent user experience',
          'Rapid feature development'
        ],
        weaknesses: [
          'Limited enterprise features',
          'Higher pricing than competitors',
          'Customer support issues'
        ],
        opportunities: [
          'International expansion',
          'Enterprise market penetration',
          'API ecosystem development'
        ],
        threats: [
          'New AI-native competitors',
          'Economic downturn impact',
          'Data privacy regulations'
        ],
        recentNews: [
          {
            id: 'news-1',
            title: 'InnovationSoft Raises $45M Series C',
            content: 'Company plans to expand AI capabilities and international presence',
            source: 'TechCrunch',
            url: 'https://techcrunch.com/example',
            publishedAt: new Date('2024-09-16'),
            sentiment: 0.8,
            relevance: 0.9,
            impact: 'high',
            keywords: ['funding', 'series-c', 'expansion'],
            entities: ['InnovationSoft', 'Accel Partners']
          }
        ],
        lastAnalyzed: new Date()
      },
      {
        id: 'competitor-b',
        name: 'TechFlow Systems',
        domain: 'techflow.io',
        category: 'indirect',
        marketShare: 8.7,
        funding: {
          total: 78000000,
          lastRound: {
            amount: 25000000,
            type: 'Series B',
            date: new Date('2024-06-20')
          },
          investors: ['Bessemer Venture Partners', 'First Round Capital']
        },
        metrics: {
          users: 150000,
          revenue: 42000000,
          growth: 45,
          satisfaction: 4.0
        },
        features: [
          {
            name: 'Integration Platform',
            description: 'Seamless third-party integrations',
            differentiator: true,
            adoptionRate: 92
          },
          {
            name: 'Custom Dashboards',
            description: 'Personalized data visualization',
            differentiator: false,
            adoptionRate: 71
          }
        ],
        strengths: [
          'Excellent integrations',
          'Strong developer community',
          'Competitive pricing'
        ],
        weaknesses: [
          'Limited AI features',
          'Complex setup process',
          'Outdated user interface'
        ],
        opportunities: [
          'AI feature development',
          'User experience improvements',
          'SMB market expansion'
        ],
        threats: [
          'Larger competitors with AI',
          'Technical debt accumulation',
          'Key talent retention'
        ],
        recentNews: [],
        lastAnalyzed: new Date()
      }
    ];

    competitors.forEach(competitor => this.competitors.set(competitor.id, competitor));

    // Initialize market opportunities
    const opportunities: MarketOpportunity[] = [
      {
        id: 'ai-copilot-feature',
        title: 'AI Copilot for Business Users',
        description: 'Intelligent assistant that helps users navigate and optimize their workflows',
        category: 'product',
        potential: {
          revenue: 25000000,
          users: 100000,
          marketSize: 500000000
        },
        requirements: {
          resources: ['AI/ML team', 'NLP specialists', 'UX designers'],
          timeline: 8,
          investment: 5000000,
          risks: ['Technical complexity', 'User adoption', 'Data privacy concerns']
        },
        competitiveAdvantage: [
          'First-mover advantage in our market',
          'Deep integration with existing platform',
          'User behavior data advantage'
        ],
        barriers: [
          'Technical implementation complexity',
          'Training data requirements',
          'Regulatory compliance'
        ],
        timeToMarket: 8,
        roi: 400,
        priority: 'high',
        confidence: 0.78,
        identified: new Date()
      },
      {
        id: 'vertical-expansion',
        title: 'Healthcare Vertical Expansion',
        description: 'Specialized solution for healthcare industry with compliance features',
        category: 'market',
        potential: {
          revenue: 35000000,
          users: 50000,
          marketSize: 800000000
        },
        requirements: {
          resources: ['Healthcare specialists', 'Compliance team', 'Security experts'],
          timeline: 12,
          investment: 8000000,
          risks: ['Regulatory compliance', 'Long sales cycles', 'High switching costs']
        },
        competitiveAdvantage: [
          'Proven platform scalability',
          'Strong security foundation',
          'Existing enterprise customers'
        ],
        barriers: [
          'HIPAA compliance requirements',
          'Established competitors',
          'Complex procurement processes'
        ],
        timeToMarket: 12,
        roi: 320,
        priority: 'medium',
        confidence: 0.65,
        identified: new Date()
      }
    ];

    opportunities.forEach(opportunity => this.opportunities.set(opportunity.id, opportunity));
  }

  private startTrendAnalysis(): void {
    if (this.trendInterval) return;
    this.trendInterval = setInterval(() => this.analyzeTrends(), this.TREND_ANALYSIS_INTERVAL);
  }

  private startCompetitorMonitoring(): void {
    if (this.competitorInterval) return;
    this.competitorInterval = setInterval(() => this.analyzeCompetitors(), this.COMPETITOR_ANALYSIS_INTERVAL);
  }

  private startMarketAnalysis(): void {
    if (this.marketInterval) return;
    this.marketInterval = setInterval(() => this.performMarketAnalysis(), this.MARKET_ANALYSIS_INTERVAL);
  }

  private startNewsMonitoring(): void {
    if (this.newsInterval) return;
    this.newsInterval = setInterval(() => this.monitorNews(), this.NEWS_MONITORING_INTERVAL);
  }

  private async analyzeTrends(): Promise<void> {
    for (const [trendId, trend] of this.marketTrends) {
      // Simulate trend analysis
      const volatility = (Math.random() - 0.5) * 0.1;
      trend.magnitude = Math.max(0, Math.min(100, trend.magnitude + volatility * 10));
      trend.confidence = Math.max(0.1, Math.min(1, trend.confidence + volatility * 0.1));
      trend.sentiment = Math.max(-1, Math.min(1, trend.sentiment + volatility * 0.2));
      
      // Update momentum based on magnitude changes
      if (volatility > 0.02) trend.momentum = 'increasing';
      else if (volatility < -0.02) trend.momentum = 'decreasing';
      else trend.momentum = 'stable';
      
      trend.lastUpdated = new Date();

      // Generate predictions
      await this.generateTrendPrediction(trend);
    }
    
    console.log('🌍 Market trend analysis completed');
  }

  private async generateTrendPrediction(trend: MarketTrend): Promise<void> {
    const prediction: TrendPrediction = {
      id: `pred_${trend.id}_${Date.now()}`,
      trendId: trend.id,
      prediction: {
        direction: trend.momentum === 'increasing' ? 'up' : trend.momentum === 'decreasing' ? 'down' : 'stable',
        magnitude: trend.magnitude * (0.8 + Math.random() * 0.4),
        timeframe: 30 + Math.random() * 60,
        confidence: trend.confidence * (0.9 + Math.random() * 0.2),
        factors: ['market conditions', 'competitive pressure', 'technology advancement']
      },
      impact: {
        onRevenue: (trend.magnitude / 100) * (Math.random() * 20 + 5),
        onMarketShare: (trend.magnitude / 100) * (Math.random() * 10 + 2),
        onCustomers: (trend.magnitude / 100) * (Math.random() * 15 + 3),
        onCompetition: (trend.magnitude / 100) * (Math.random() * 12 + 4)
      },
      scenarios: {
        best: {
          description: `${trend.title} accelerates significantly`,
          probability: 0.2,
          outcome: 'Major market opportunity'
        },
        likely: {
          description: `${trend.title} continues current trajectory`,
          probability: 0.6,
          outcome: 'Moderate growth opportunity'
        },
        worst: {
          description: `${trend.title} loses momentum`,
          probability: 0.2,
          outcome: 'Minimal impact on business'
        }
      },
      recommendations: {
        immediate: [`Monitor ${trend.title} developments closely`],
        shortTerm: [`Evaluate ${trend.title} integration opportunities`],
        longTerm: [`Develop strategic response to ${trend.title}`]
      },
      created: new Date()
    };

    this.predictions.set(prediction.id, prediction);
  }

  private async analyzeCompetitors(): Promise<void> {
    for (const [competitorId, competitor] of this.competitors) {
      // Simulate competitor analysis updates
      const growth = (Math.random() - 0.4) * 0.2; // Slight bias toward positive growth
      competitor.metrics.users = Math.max(0, competitor.metrics.users * (1 + growth));
      competitor.metrics.revenue = Math.max(0, competitor.metrics.revenue * (1 + growth * 0.8));
      competitor.metrics.growth = growth * 100;
      competitor.metrics.satisfaction = Math.max(1, Math.min(5, competitor.metrics.satisfaction + (Math.random() - 0.5) * 0.2));
      
      // Update market share based on growth
      const marketShareChange = growth * 0.1;
      competitor.marketShare = Math.max(0, competitor.marketShare + marketShareChange);
      
      competitor.lastAnalyzed = new Date();
    }
    
    console.log('🌍 Competitor analysis completed');
  }

  private async performMarketAnalysis(): Promise<void> {
    const competitors = Array.from(this.competitors.values());
    const trends = Array.from(this.marketTrends.values());
    const opportunities = Array.from(this.opportunities.values());

    const analysis: MarketAnalysis = {
      timestamp: new Date(),
      timeframe: 'hourly',
      overview: {
        totalMarketSize: 2500000000,
        growthRate: 25.5,
        competitorCount: competitors.length,
        trendCount: trends.length,
        opportunityCount: opportunities.length
      },
      segmentation: [
        {
          segment: 'Enterprise',
          size: 60,
          growth: 15,
          competitiveness: 85,
          ourPosition: 12
        },
        {
          segment: 'SMB',
          size: 30,
          growth: 35,
          competitiveness: 70,
          ourPosition: 25
        },
        {
          segment: 'Startup',
          size: 10,
          growth: 55,
          competitiveness: 60,
          ourPosition: 40
        }
      ],
      competitiveLandscape: {
        leaders: competitors.filter(c => c.marketShare > 10),
        challengers: competitors.filter(c => c.marketShare > 5 && c.marketShare <= 10),
        niche: competitors.filter(c => c.marketShare > 2 && c.marketShare <= 5),
        emerging: competitors.filter(c => c.marketShare <= 2)
      },
      insights: [
        {
          type: 'opportunity',
          title: 'AI Automation Demand Surge',
          description: 'Market showing 95% magnitude trend toward AI automation solutions',
          priority: 'critical',
          actionRequired: true,
          recommendations: [
            'Accelerate AI feature development',
            'Launch AI-focused marketing campaign',
            'Hire additional ML engineers'
          ]
        },
        {
          type: 'threat',
          title: 'Increased Competition in SMB Segment',
          description: 'New entrants targeting SMB market with competitive pricing',
          priority: 'high',
          actionRequired: true,
          recommendations: [
            'Develop SMB-specific pricing tiers',
            'Improve onboarding experience',
            'Create self-service options'
          ]
        }
      ],
      predictions: {
        marketGrowth: 28,
        competitorActions: [
          'AI feature launches from major competitors',
          'Pricing wars in SMB segment',
          'Consolidation through acquisitions'
        ],
        emergingThreats: [
          'AI-native startups',
          'Low-code platform integration',
          'Big Tech market entry'
        ],
        newOpportunities: [
          'Vertical market expansion',
          'International markets',
          'AI copilot features'
        ],
        timeHorizon: 6
      }
    };

    this.analyses.push(analysis);
    if (this.analyses.length > 100) {
      this.analyses = this.analyses.slice(-50);
    }

    console.log('🌍 Market analysis completed');
  }

  private async monitorNews(): Promise<void> {
    // Simulate news monitoring
    const sampleNews: NewsItem[] = [
      {
        id: `news_${Date.now()}_1`,
        title: 'AI Investment Reaches Record High in Q4',
        content: 'Venture capital funding for AI startups reached $15.2B in Q4, indicating strong market confidence',
        source: 'VentureBeat',
        url: 'https://venturebeat.com/example',
        publishedAt: new Date(),
        sentiment: 0.7,
        relevance: 0.85,
        impact: 'high',
        keywords: ['AI', 'funding', 'venture capital', 'startups'],
        entities: ['VentureBeat', 'Q4 2024']
      },
      {
        id: `news_${Date.now()}_2`,
        title: 'Remote Work Tools See Continued Growth',
        content: 'Collaboration software market expected to grow 23% year-over-year as remote work becomes permanent',
        source: 'Forbes',
        url: 'https://forbes.com/example',
        publishedAt: new Date(Date.now() - 3600000),
        sentiment: 0.6,
        relevance: 0.75,
        impact: 'medium',
        keywords: ['remote work', 'collaboration', 'growth', 'software'],
        entities: ['Forbes']
      }
    ];

    sampleNews.forEach(news => this.newsItems.push(news));
    
    // Keep only recent news (last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 3600000;
    this.newsItems = this.newsItems.filter(news => news.publishedAt.getTime() > weekAgo);
    
    console.log('🌍 News monitoring completed');
  }

  // Public API methods
  async getMarketTrends(): Promise<MarketTrend[]> {
    return Array.from(this.marketTrends.values())
      .sort((a, b) => b.magnitude - a.magnitude);
  }

  async getCompetitors(): Promise<CompetitorProfile[]> {
    return Array.from(this.competitors.values())
      .sort((a, b) => b.marketShare - a.marketShare);
  }

  async getMarketOpportunities(): Promise<MarketOpportunity[]> {
    return Array.from(this.opportunities.values())
      .sort((a, b) => b.roi - a.roi);
  }

  async getLatestAnalysis(): Promise<MarketAnalysis | null> {
    return this.analyses.length > 0 ? this.analyses[this.analyses.length - 1] : null;
  }

  async getTrendPredictions(limit: number = 10): Promise<TrendPrediction[]> {
    return Array.from(this.predictions.values())
      .sort((a, b) => b.created.getTime() - a.created.getTime())
      .slice(0, limit);
  }

  async getRecentNews(limit: number = 20): Promise<NewsItem[]> {
    return this.newsItems
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, limit);
  }

  async getMarketIntelligenceStats(): Promise<{
    totalTrends: number;
    totalCompetitors: number;
    totalOpportunities: number;
    analyzesGenerated: number;
    predictionsGenerated: number;
    newsItemsMonitored: number;
    marketHealth: string;
  }> {
    const avgTrendMagnitude = Array.from(this.marketTrends.values())
      .reduce((sum, t) => sum + t.magnitude, 0) / this.marketTrends.size;

    return {
      totalTrends: this.marketTrends.size,
      totalCompetitors: this.competitors.size,
      totalOpportunities: this.opportunities.size,
      analyzesGenerated: this.analyses.length,
      predictionsGenerated: this.predictions.size,
      newsItemsMonitored: this.newsItems.length,
      marketHealth: avgTrendMagnitude > 80 ? 'excellent' : avgTrendMagnitude > 60 ? 'good' : 'challenging'
    };
  }

  async shutdown(): Promise<void> {
    if (this.trendInterval) {
      clearInterval(this.trendInterval);
      this.trendInterval = null;
    }
    if (this.competitorInterval) {
      clearInterval(this.competitorInterval);
      this.competitorInterval = null;
    }
    if (this.marketInterval) {
      clearInterval(this.marketInterval);
      this.marketInterval = null;
    }
    if (this.newsInterval) {
      clearInterval(this.newsInterval);
      this.newsInterval = null;
    }
    
    this.marketTrends.clear();
    this.competitors.clear();
    this.opportunities.clear();
    this.analyses = [];
    this.predictions.clear();
    this.newsItems = [];
    RealTimeMarketIntelligence.instance = null;
  }
}

export const getRealTimeMarketIntelligence = () => RealTimeMarketIntelligence.getInstance();
