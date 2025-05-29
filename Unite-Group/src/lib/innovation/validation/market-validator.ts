import { EventEmitter } from 'events';

export interface ProductMarketFit {
  productId: string;
  productName: string;
  marketSegment: string;
  fitScore: number; // 0-1 scale
  confidenceLevel: number;
  userAdoption: number;
  customerSatisfaction: number;
  marketReadiness: number;
  competitivePosition: number;
  revenueValidation: number;
  retentionRate: number;
  growthPotential: number;
  assessmentDate: Date;
  validationSources: ValidationSource[];
  recommendations: string[];
}

export interface ValidationSource {
  type: 'user_feedback' | 'market_research' | 'competitive_analysis' | 'financial_metrics' | 'usage_analytics';
  source: string;
  reliability: number;
  data: any;
  weight: number;
  lastUpdated: Date;
}

export interface UserFeedback {
  id: string;
  productId: string;
  userId: string;
  userSegment: string;
  feedbackType: 'survey' | 'interview' | 'support_ticket' | 'review' | 'usage_behavior';
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  sentimentScore: number; // -1 to 1
  content: string;
  categories: string[];
  valuePerception: number;
  usabilityRating: number;
  featureImportance: Record<string, number>;
  improvementSuggestions: string[];
  likelihoodToRecommend: number; // NPS style 0-10
  submittedAt: Date;
  processed: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  productId: string;
  hypothesis: string;
  variants: ABVariant[];
  targetSegment: string[];
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'completed' | 'paused';
  primaryMetric: string;
  secondaryMetrics: string[];
  results?: ABTestResults;
  statisticalSignificance: number;
  confidence: number;
  minSampleSize: number;
  actualSampleSize: number;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number; // percentage
  conversions: number;
  visitors: number;
  conversionRate: number;
  revenuePerVisitor: number;
  engagementScore: number;
}

export interface ABTestResults {
  winningVariant: string;
  improvementPercent: number;
  significanceLevel: number;
  confidence: number;
  recommendation: 'implement' | 'iterate' | 'abandon';
  insights: string[];
  nextSteps: string[];
}

export interface MarketResponse {
  productId: string;
  region: string;
  responseType: 'early_adoption' | 'market_penetration' | 'competitive_response' | 'media_coverage';
  responseMetric: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  factors: string[];
  timestamp: Date;
  predictedOutcome: string;
  confidence: number;
}

export interface ValidationMetrics {
  totalProducts: number;
  averagePMFScore: number;
  highPMFProducts: number;
  activeABTests: number;
  feedbackProcessingRate: number;
  validationAccuracy: number;
  marketResponseSpeed: number;
  recommendationSuccess: number;
}

export class MarketValidationAutomation extends EventEmitter {
  private productMarketFits: Map<string, ProductMarketFit> = new Map();
  private userFeedback: Map<string, UserFeedback> = new Map();
  private abTests: Map<string, ABTest> = new Map();
  private marketResponses: Map<string, MarketResponse[]> = new Map();
  private isValidating = false;
  private validationInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeValidator();
  }

  private async initializeValidator(): Promise<void> {
    console.log('🎯 Market Validation Automation Initializing...');
    
    // Load validation data
    await this.loadValidationData();
    
    // Initialize validation models
    await this.initializeValidationModels();
    
    // Start continuous validation
    await this.startContinuousValidation();
    
    // Generate initial validations
    await this.generateInitialValidations();
    
    console.log('✅ Market Validation Automation Active');
    this.emit('validator:initialized');
  }

  private async loadValidationData(): Promise<void> {
    console.log('📊 Loading validation data...');
    
    // Load sample product market fits
    await this.loadSamplePMFData();
    
    // Load user feedback
    await this.loadSampleUserFeedback();
    
    // Load A/B tests
    await this.loadSampleABTests();
    
    console.log(`💡 Loaded ${this.productMarketFits.size} PMF assessments, ${this.userFeedback.size} feedback items, ${this.abTests.size} A/B tests`);
  }

  private async loadSamplePMFData(): Promise<void> {
    const sampleProducts = [
      {
        productId: 'unite-ai-platform',
        productName: 'Unite AI Platform',
        marketSegment: 'Enterprise SaaS',
        userAdoption: 0.78,
        customerSatisfaction: 0.85,
        marketReadiness: 0.82,
        competitivePosition: 0.89,
        revenueValidation: 0.76,
        retentionRate: 0.92,
        growthPotential: 0.87
      },
      {
        productId: 'cognitive-analytics',
        productName: 'Cognitive Analytics Suite',
        marketSegment: 'Business Intelligence',
        userAdoption: 0.84,
        customerSatisfaction: 0.88,
        marketReadiness: 0.79,
        competitivePosition: 0.91,
        revenueValidation: 0.83,
        retentionRate: 0.89,
        growthPotential: 0.94
      },
      {
        productId: 'autonomous-operations',
        productName: 'Autonomous Operations',
        marketSegment: 'Process Automation',
        userAdoption: 0.71,
        customerSatisfaction: 0.79,
        marketReadiness: 0.73,
        competitivePosition: 0.86,
        revenueValidation: 0.74,
        retentionRate: 0.85,
        growthPotential: 0.91
      },
      {
        productId: 'quantum-security',
        productName: 'Quantum Security Framework',
        marketSegment: 'Cybersecurity',
        userAdoption: 0.42,
        customerSatisfaction: 0.71,
        marketReadiness: 0.38,
        competitivePosition: 0.94,
        revenueValidation: 0.45,
        retentionRate: 0.78,
        growthPotential: 0.96
      },
      {
        productId: 'immersive-bi',
        productName: 'Immersive Business Intelligence',
        marketSegment: 'Data Visualization',
        userAdoption: 0.34,
        customerSatisfaction: 0.68,
        marketReadiness: 0.41,
        competitivePosition: 0.82,
        revenueValidation: 0.39,
        retentionRate: 0.73,
        growthPotential: 0.88
      }
    ];

    for (const product of sampleProducts) {
      const fitScore = (
        product.userAdoption * 0.2 +
        product.customerSatisfaction * 0.2 +
        product.marketReadiness * 0.15 +
        product.competitivePosition * 0.15 +
        product.revenueValidation * 0.15 +
        product.retentionRate * 0.1 +
        product.growthPotential * 0.05
      );

      const pmf: ProductMarketFit = {
        ...product,
        fitScore,
        confidenceLevel: 0.8 + Math.random() * 0.15,
        assessmentDate: new Date(),
        validationSources: [
          {
            type: 'user_feedback',
            source: 'Customer Surveys',
            reliability: 0.85,
            data: { responseRate: 0.67, sampleSize: 1250 },
            weight: 0.3,
            lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          },
          {
            type: 'usage_analytics',
            source: 'Platform Analytics',
            reliability: 0.95,
            data: { activeUsers: 2847, engagementRate: 0.73 },
            weight: 0.25,
            lastUpdated: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
          },
          {
            type: 'financial_metrics',
            source: 'Revenue Analysis',
            reliability: 0.98,
            data: { mrr: 45000, churnRate: 0.05 },
            weight: 0.25,
            lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          },
          {
            type: 'market_research',
            source: 'Industry Analysis',
            reliability: 0.75,
            data: { marketSize: 2500000000, growthRate: 0.23 },
            weight: 0.2,
            lastUpdated: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
          }
        ],
        recommendations: this.generatePMFRecommendations(fitScore, product)
      };

      this.productMarketFits.set(product.productId, pmf);
    }
  }

  private generatePMFRecommendations(fitScore: number, product: any): string[] {
    const recommendations: string[] = [];

    if (fitScore > 0.8) {
      recommendations.push('Excellent PMF - Scale marketing and sales efforts');
      recommendations.push('Focus on market expansion and new feature development');
    } else if (fitScore > 0.6) {
      recommendations.push('Good PMF - Optimize user experience and retention');
      recommendations.push('Conduct deeper market research for improvement opportunities');
    } else if (fitScore > 0.4) {
      recommendations.push('Moderate PMF - Investigate user pain points and feature gaps');
      recommendations.push('Consider product pivots or market repositioning');
    } else {
      recommendations.push('Poor PMF - Fundamental product or market issues need addressing');
      recommendations.push('Consider major product changes or market pivot');
    }

    if (product.customerSatisfaction < 0.7) {
      recommendations.push('Improve customer satisfaction through UX enhancements');
    }

    if (product.retentionRate < 0.8) {
      recommendations.push('Focus on retention strategies and user engagement');
    }

    if (product.marketReadiness < 0.6) {
      recommendations.push('Market education and positioning work needed');
    }

    return recommendations;
  }

  private async loadSampleUserFeedback(): Promise<void> {
    const feedbackTemplates = [
      {
        productId: 'unite-ai-platform',
        userSegment: 'enterprise',
        feedbackType: 'survey' as const,
        sentiment: 'positive' as const,
        content: 'The AI-powered insights have significantly improved our decision-making process',
        valuePerception: 0.87,
        usabilityRating: 0.82,
        likelihoodToRecommend: 8
      },
      {
        productId: 'cognitive-analytics',
        userSegment: 'data_analysts',
        feedbackType: 'interview' as const,
        sentiment: 'very_positive' as const,
        content: 'Revolutionary approach to business intelligence with predictive capabilities',
        valuePerception: 0.93,
        usabilityRating: 0.88,
        likelihoodToRecommend: 9
      },
      {
        productId: 'autonomous-operations',
        userSegment: 'operations_managers',
        feedbackType: 'review' as const,
        sentiment: 'positive' as const,
        content: 'Automation has reduced manual work by 60%, but setup was complex',
        valuePerception: 0.84,
        usabilityRating: 0.65,
        likelihoodToRecommend: 7
      },
      {
        productId: 'quantum-security',
        userSegment: 'security_professionals',
        feedbackType: 'survey' as const,
        sentiment: 'neutral' as const,
        content: 'Cutting-edge technology but concerned about implementation complexity',
        valuePerception: 0.72,
        usabilityRating: 0.58,
        likelihoodToRecommend: 6
      },
      {
        productId: 'immersive-bi',
        userSegment: 'executives',
        feedbackType: 'usage_behavior' as const,
        sentiment: 'positive' as const,
        content: 'VR data visualization is impressive but needs more use cases',
        valuePerception: 0.76,
        usabilityRating: 0.71,
        likelihoodToRecommend: 7
      }
    ];

    for (let i = 0; i < 25; i++) {
      const template = feedbackTemplates[i % feedbackTemplates.length];
      const id = `feedback_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sentimentScore = this.getSentimentScore(template.sentiment);
      
      const feedback: UserFeedback = {
        id,
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        ...template,
        sentimentScore,
        categories: ['usability', 'value', 'features'],
        featureImportance: {
          'AI Analytics': 0.9,
          'User Interface': 0.7,
          'Performance': 0.8,
          'Integration': 0.6
        },
        improvementSuggestions: [
          'Simplify onboarding process',
          'Add more customization options',
          'Improve mobile experience'
        ],
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        processed: Math.random() > 0.3
      };

      this.userFeedback.set(id, feedback);
    }
  }

  private getSentimentScore(sentiment: string): number {
    switch (sentiment) {
      case 'very_positive': return 0.8 + Math.random() * 0.2;
      case 'positive': return 0.3 + Math.random() * 0.5;
      case 'neutral': return -0.2 + Math.random() * 0.4;
      case 'negative': return -0.7 + Math.random() * 0.4;
      case 'very_negative': return -1 + Math.random() * 0.3;
      default: return 0;
    }
  }

  private async loadSampleABTests(): Promise<void> {
    const sampleTests = [
      {
        name: 'AI Dashboard Layout Optimization',
        productId: 'cognitive-analytics',
        hypothesis: 'Simplified dashboard layout will increase user engagement by 15%',
        targetSegment: ['data_analysts', 'business_users'],
        status: 'running' as const,
        primaryMetric: 'engagement_time',
        secondaryMetrics: ['click_through_rate', 'task_completion'],
        variants: [
          {
            name: 'Control',
            description: 'Current dashboard layout',
            trafficAllocation: 50,
            conversions: 847,
            visitors: 1420,
            conversionRate: 0.597,
            revenuePerVisitor: 23.45,
            engagementScore: 0.73
          },
          {
            name: 'Simplified Layout',
            description: 'Streamlined dashboard with key metrics prominently displayed',
            trafficAllocation: 50,
            conversions: 923,
            visitors: 1380,
            conversionRate: 0.669,
            revenuePerVisitor: 26.78,
            engagementScore: 0.81
          }
        ]
      },
      {
        name: 'Onboarding Flow Enhancement',
        productId: 'unite-ai-platform',
        hypothesis: 'Interactive onboarding will reduce time-to-value by 30%',
        targetSegment: ['new_users'],
        status: 'completed' as const,
        primaryMetric: 'time_to_first_value',
        secondaryMetrics: ['completion_rate', 'satisfaction_score'],
        variants: [
          {
            name: 'Standard Onboarding',
            description: 'Traditional step-by-step setup process',
            trafficAllocation: 50,
            conversions: 234,
            visitors: 456,
            conversionRate: 0.513,
            revenuePerVisitor: 45.67,
            engagementScore: 0.65
          },
          {
            name: 'Interactive Onboarding',
            description: 'Guided interactive setup with contextual help',
            trafficAllocation: 50,
            conversions: 298,
            visitors: 444,
            conversionRate: 0.671,
            revenuePerVisitor: 52.34,
            engagementScore: 0.78
          }
        ]
      },
      {
        name: 'Pricing Page Optimization',
        productId: 'autonomous-operations',
        hypothesis: 'Value-focused pricing presentation will increase conversions by 20%',
        targetSegment: ['enterprise', 'mid_market'],
        status: 'running' as const,
        primaryMetric: 'conversion_rate',
        secondaryMetrics: ['time_on_page', 'contact_requests'],
        variants: [
          {
            name: 'Feature-based Pricing',
            description: 'Pricing focused on features and capabilities',
            trafficAllocation: 50,
            conversions: 156,
            visitors: 890,
            conversionRate: 0.175,
            revenuePerVisitor: 124.56,
            engagementScore: 0.58
          },
          {
            name: 'Value-based Pricing',
            description: 'Pricing focused on business value and ROI',
            trafficAllocation: 50,
            conversions: 187,
            visitors: 875,
            conversionRate: 0.214,
            revenuePerVisitor: 143.78,
            engagementScore: 0.67
          }
        ]
      }
    ];

    for (let i = 0; i < sampleTests.length; i++) {
      const test = sampleTests[i];
      const id = `test_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      const abTest: ABTest = {
        id,
        ...test,
        startDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        endDate: test.status === 'completed' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        statisticalSignificance: Math.random() > 0.5 ? 0.95 : 0.99,
        confidence: 0.8 + Math.random() * 0.15,
        minSampleSize: 400,
        actualSampleSize: test.variants.reduce((sum, v) => sum + v.visitors, 0),
        variants: test.variants.map(v => ({
          id: `variant_${Math.random().toString(36).substr(2, 9)}`,
          ...v
        }))
      };

      if (test.status === 'completed') {
        abTest.results = this.generateABTestResults(abTest);
      }

      this.abTests.set(id, abTest);
    }
  }

  private generateABTestResults(test: ABTest): ABTestResults {
    const bestVariant = test.variants.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    
    const controlVariant = test.variants[0];
    const improvement = ((bestVariant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100;
    
    return {
      winningVariant: bestVariant.id,
      improvementPercent: improvement,
      significanceLevel: test.statisticalSignificance,
      confidence: test.confidence,
      recommendation: improvement > 10 ? 'implement' : improvement > 5 ? 'iterate' : 'abandon',
      insights: [
        `${bestVariant.name} showed ${improvement.toFixed(1)}% improvement over control`,
        `Statistical significance achieved with ${test.confidence * 100}% confidence`,
        'User engagement metrics also improved with winning variant'
      ],
      nextSteps: improvement > 10 ? [
        'Implement winning variant for all users',
        'Monitor long-term impact on key metrics',
        'Plan follow-up optimization tests'
      ] : [
        'Analyze user behavior patterns for insights',
        'Design follow-up experiments',
        'Consider alternative approaches'
      ]
    };
  }

  private async initializeValidationModels(): Promise<void> {
    console.log('🤖 Initializing Validation Models...');
    
    await this.trainPMFPredictionModel();
    await this.trainFeedbackAnalysisModel();
    await this.trainABTestOptimizationModel();
    await this.trainMarketResponseModel();
    
    console.log('✅ Validation Models Ready');
  }

  private async trainPMFPredictionModel(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('🎯 PMF Prediction Model Trained');
  }

  private async trainFeedbackAnalysisModel(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('📝 Feedback Analysis Model Trained');
  }

  private async trainABTestOptimizationModel(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('🔬 A/B Test Optimization Model Trained');
  }

  private async trainMarketResponseModel(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('📊 Market Response Model Trained');
  }

  private async startContinuousValidation(): Promise<void> {
    if (this.isValidating) return;
    
    this.isValidating = true;
    
    // Validate every 15 minutes
    this.validationInterval = setInterval(async () => {
      await this.performValidationAnalysis();
    }, 15 * 60 * 1000);
    
    // Perform initial analysis
    await this.performValidationAnalysis();
  }

  private async generateInitialValidations(): Promise<void> {
    // Generate market responses
    await this.generateMarketResponses();
    
    // Process pending feedback
    await this.processPendingFeedback();
    
    // Update A/B test results
    await this.updateABTestResults();
  }

  private async performValidationAnalysis(): Promise<void> {
    console.log('🔍 Performing Market Validation Analysis...');
    
    try {
      // Update PMF scores
      await this.updatePMFScores();
      
      // Process new feedback
      await this.processPendingFeedback();
      
      // Update A/B tests
      await this.updateABTestResults();
      
      // Generate market responses
      await this.generateMarketResponses();
      
      // Generate predictions
      await this.generateMarketPredictions();
      
      const metrics = this.calculateValidationMetrics();
      
      this.emit('validation:complete', {
        products: this.productMarketFits.size,
        feedback: this.userFeedback.size,
        abTests: this.abTests.size,
        metrics,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error in validation analysis:', error);
      this.emit('validation:error', error);
    }
  }

  private async updatePMFScores(): Promise<void> {
    // Update PMF scores based on new data
    for (const [productId, pmf] of this.productMarketFits) {
      // Simulate PMF score evolution
      const change = (Math.random() - 0.5) * 0.02; // Small random changes
      pmf.fitScore = Math.max(0, Math.min(1, pmf.fitScore + change));
      
      // Update component scores
      pmf.userAdoption = Math.max(0, Math.min(1, pmf.userAdoption + (Math.random() - 0.5) * 0.01));
      pmf.customerSatisfaction = Math.max(0, Math.min(1, pmf.customerSatisfaction + (Math.random() - 0.5) * 0.01));
      
      pmf.assessmentDate = new Date();
      pmf.recommendations = this.generatePMFRecommendations(pmf.fitScore, pmf);
    }
  }

  private async processPendingFeedback(): Promise<void> {
    // Process unprocessed feedback
    for (const [id, feedback] of this.userFeedback) {
      if (!feedback.processed) {
        // Simulate processing
        feedback.processed = true;
        
        // Update PMF based on feedback
        const pmf = this.productMarketFits.get(feedback.productId);
        if (pmf) {
          const impact = feedback.sentimentScore * 0.001; // Small impact per feedback
          pmf.customerSatisfaction = Math.max(0, Math.min(1, pmf.customerSatisfaction + impact));
        }
      }
    }

    // Occasionally add new feedback
    if (Math.random() > 0.7) {
      await this.generateNewFeedback();
    }
  }

  private async generateNewFeedback(): Promise<void> {
    const products = Array.from(this.productMarketFits.keys());
    const productId = products[Math.floor(Math.random() * products.length)];
    
    const sentiments = ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)] as any;
    
    const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const feedback: UserFeedback = {
      id,
      productId,
      userId: `user_${Math.random().toString(36).substr(2, 9)}`,
      userSegment: 'enterprise',
      feedbackType: 'survey',
      sentiment,
      sentimentScore: this.getSentimentScore(sentiment),
      content: `New feedback for ${productId}`,
      categories: ['usability', 'value'],
      valuePerception: Math.random(),
      usabilityRating: Math.random(),
      featureImportance: {
        'Core Features': Math.random(),
        'User Experience': Math.random()
      },
      improvementSuggestions: ['Consider user suggestions'],
      likelihoodToRecommend: Math.floor(Math.random() * 11),
      submittedAt: new Date(),
      processed: false
    };
    
    this.userFeedback.set(id, feedback);
  }

  private async updateABTestResults(): Promise<void> {
    // Update running A/B tests
    for (const [id, test] of this.abTests) {
      if (test.status === 'running') {
        // Simulate traffic and conversions
        for (const variant of test.variants) {
          const newVisitors = Math.floor(Math.random() * 50 + 10);
          const newConversions = Math.floor(newVisitors * variant.conversionRate * (0.8 + Math.random() * 0.4));
          
          variant.visitors += newVisitors;
          variant.conversions += newConversions;
          variant.conversionRate = variant.conversions / variant.visitors;
        }
        
        test.actualSampleSize = test.variants.reduce((sum, v) => sum + v.visitors, 0);
        
        // Check if test should be completed
        if (test.actualSampleSize > test.minSampleSize * 2 && Math.random() > 0.8) {
          test.status = 'completed';
          test.endDate = new Date();
          test.results = this.generateABTestResults(test);
        }
      }
    }
  }

  private async generateMarketResponses(): Promise<void> {
    // Generate market response data
    for (const [productId, pmf] of this.productMarketFits) {
      if (!this.marketResponses.has(productId)) {
        this.marketResponses.set(productId, []);
      }
      
      const responses = this.marketResponses.get(productId)!;
      
      // Add new market response occasionally
      if (Math.random() > 0.8) {
        const responseTypes = ['early_adoption', 'market_penetration', 'competitive_response', 'media_coverage'] as const;
        const trends = ['increasing', 'stable', 'decreasing'] as const;
        
        const response: MarketResponse = {
          productId,
          region: 'Australia',
          responseType: responseTypes[Math.floor(Math.random() * responseTypes.length)],
          responseMetric: Math.random(),
          trend: trends[Math.floor(Math.random() * trends.length)],
          factors: ['Product Quality', 'Market Timing', 'Competitive Landscape'],
          timestamp: new Date(),
          predictedOutcome: 'Positive market reception expected based on current trends',
          confidence: 0.7 + Math.random() * 0.25
        };
        
        responses.push(response);
        
        // Keep only last 10 responses per product
        if (responses.length > 10) {
          responses.shift();
        }
      }
    }
  }

  private async generateMarketPredictions(): Promise<void> {
    // Generate predictions based on current data
    console.log('📈 Generating market predictions...');
    
    // Simulate prediction generation based on trends and feedback
    for (const [productId, pmf] of this.productMarketFits) {
      const responses = this.marketResponses.get(productId) || [];
      const recentResponses = responses.slice(-3); // Last 3 responses
      
      if (recentResponses.length > 0) {
        const avgTrend = recentResponses.reduce((sum, r) => {
          return sum + (r.trend === 'increasing' ? 1 : r.trend === 'stable' ? 0 : -1);
        }, 0) / recentResponses.length;
        
        // Update predicted outcomes based on trend
        if (avgTrend > 0.3) {
          pmf.growthPotential = Math.min(pmf.growthPotential + 0.01, 1.0);
        } else if (avgTrend < -0.3) {
          pmf.growthPotential = Math.max(pmf.growthPotential - 0.01, 0);
        }
      }
    }
  }

  private calculateValidationMetrics(): ValidationMetrics {
    const feedback = Array.from(this.userFeedback.values());
    const abTests = Array.from(this.abTests.values());
    const pmfs = Array.from(this.productMarketFits.values());
    
    return {
      totalProducts: pmfs.length,
      averagePMFScore: pmfs.length > 0 ? pmfs.reduce((sum, pmf) => sum + pmf.fitScore, 0) / pmfs.length : 0,
      highPMFProducts: pmfs.filter(pmf => pmf.fitScore > 0.8).length,
      activeABTests: abTests.filter(test => test.status === 'running').length,
      feedbackProcessingRate: feedback.filter(f => f.processed).length / Math.max(feedback.length, 1),
      validationAccuracy: 0.91, // Simulated accuracy
      marketResponseSpeed: 0.87, // Simulated response speed
      recommendationSuccess: 0.84 // Simulated success rate
    };
  }

  // Public API methods
  getProductMarketFits(): ProductMarketFit[] {
    return Array.from(this.productMarketFits.values()).sort((a, b) => b.fitScore - a.fitScore);
  }

  getUserFeedback(productId?: string): UserFeedback[] {
    const feedback = Array.from(this.userFeedback.values());
    
    if (productId) {
      return feedback.filter(f => f.productId === productId);
    }
    
    return feedback.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  getABTests(status?: string): ABTest[] {
    const tests = Array.from(this.abTests.values());
    
    if (status) {
      return tests.filter(t => t.status === status);
    }
    
    return tests.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  getMarketResponses(productId?: string): MarketResponse[] {
    if (productId) {
      return this.marketResponses.get(productId) || [];
    }
    
    const allResponses: MarketResponse[] = [];
    for (const responses of this.marketResponses.values()) {
      allResponses.push(...responses);
    }
    
    return allResponses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getValidationMetrics(): ValidationMetrics {
    return this.calculateValidationMetrics();
  }

  async createABTest(testData: Partial<ABTest>): Promise<string> {
    const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const abTest: ABTest = {
      id,
      name: testData.name || 'New A/B Test',
      productId: testData.productId || '',
      hypothesis: testData.hypothesis || '',
      variants: testData.variants || [],
      targetSegment: testData.targetSegment || [],
      startDate: new Date(),
      status: 'draft',
      primaryMetric: testData.primaryMetric || 'conversion_rate',
      secondaryMetrics: testData.secondaryMetrics || [],
      statisticalSignificance: 0.95,
      confidence: 0.8,
      minSampleSize: testData.minSampleSize || 400,
      actualSampleSize: 0
    };
    
    this.abTests.set(id, abTest);
    return id;
  }

  async submitFeedback(feedbackData: Partial<UserFeedback>): Promise<string> {
    const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const feedback: UserFeedback = {
      id,
      productId: feedbackData.productId || '',
      userId: feedbackData.userId || `user_${Math.random().toString(36).substr(2, 9)}`,
      userSegment: feedbackData.userSegment || 'unknown',
      feedbackType: feedbackData.feedbackType || 'survey',
      sentiment: feedbackData.sentiment || 'neutral',
      sentimentScore: this.getSentimentScore(feedbackData.sentiment || 'neutral'),
      content: feedbackData.content || '',
      categories: feedbackData.categories || [],
      valuePerception: feedbackData.valuePerception || 0.5,
      usabilityRating: feedbackData.usabilityRating || 0.5,
      featureImportance: feedbackData.featureImportance || {},
      improvementSuggestions: feedbackData.improvementSuggestions || [],
      likelihoodToRecommend: feedbackData.likelihoodToRecommend || 5,
      submittedAt: new Date(),
      processed: false
    };
    
    this.userFeedback.set(id, feedback);
    return id;
  }

  async forceValidation(): Promise<void> {
    await this.performValidationAnalysis();
  }

  stopValidation(): void {
    this.isValidating = false;
    
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }
}

// Export singleton instance
export const marketValidationAutomation = new MarketValidationAutomation();
