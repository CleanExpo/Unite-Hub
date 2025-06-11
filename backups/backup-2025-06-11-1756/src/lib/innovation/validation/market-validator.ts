interface ProductMarketFit {
  id: string;
  product: string;
  market: string;
  fitScore: number;
  confidence: number;
  trends: string[];
  feedback: string[];
  createdAt: Date;
}

interface UserFeedback {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  createdAt: Date;
}

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  variants: Array<{
    id: string;
    name: string;
    traffic: number;
    conversionRate: number;
  }>;
  startDate: Date;
  endDate?: Date;
  metrics: {
    impressions: number;
    conversions: number;
    significance: number;
  };
}

interface MarketResponse {
  id: string;
  source: string;
  message: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: number;
  reach: number;
  createdAt: Date;
}

interface ValidationMetrics {
  validationAccuracy: number;
  totalValidations: number;
  averageConfidence: number;
  successfulValidations: number;
}

class MarketValidationAutomation {
  getProductMarketFits(): ProductMarketFit[] {
    return [
      {
        id: 'pmf-1',
        product: 'CRM Dashboard',
        market: 'Small Business',
        fitScore: 85,
        confidence: 92,
        trends: ['Increasing demand for automation', 'Mobile-first approach'],
        feedback: ['Easy to use', 'Great value for money'],
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'pmf-2',
        product: 'AI Analytics',
        market: 'Enterprise',
        fitScore: 78,
        confidence: 88,
        trends: ['AI adoption growing', 'Data-driven decisions'],
        feedback: ['Powerful insights', 'Complex setup'],
        createdAt: new Date('2024-01-20')
      },
      {
        id: 'pmf-3',
        product: 'Workflow Automation',
        market: 'Mid-market',
        fitScore: 92,
        confidence: 95,
        trends: ['Process optimization', 'Remote work enablement'],
        feedback: ['Saves time', 'Intuitive interface'],
        createdAt: new Date('2024-01-25')
      }
    ];
  }

  getUserFeedback(): UserFeedback[] {
    return [
      {
        id: 'feedback-1',
        userId: 'user-123',
        productId: 'crm-dashboard',
        rating: 5,
        comment: 'Excellent product, very intuitive and powerful',
        sentiment: 'positive',
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'feedback-2',
        userId: 'user-456',
        productId: 'ai-analytics',
        rating: 4,
        comment: 'Good features but could be more user-friendly',
        sentiment: 'positive',
        createdAt: new Date('2024-01-16')
      },
      {
        id: 'feedback-3',
        userId: 'user-789',
        productId: 'workflow-automation',
        rating: 2,
        comment: 'Too complex for our needs',
        sentiment: 'negative',
        createdAt: new Date('2024-01-17')
      }
    ];
  }

  getABTests(status?: string): ABTest[] {
    const tests = [
      {
        id: 'test-1',
        name: 'Dashboard Layout A/B',
        status: 'running' as const,
        variants: [
          { id: 'a', name: 'Variant A', traffic: 50, conversionRate: 12.5 },
          { id: 'b', name: 'Variant B', traffic: 50, conversionRate: 14.2 }
        ],
        startDate: new Date('2024-01-10'),
        metrics: {
          impressions: 10000,
          conversions: 1335,
          significance: 0.85
        }
      },
      {
        id: 'test-2',
        name: 'Pricing Page Test',
        status: 'completed' as const,
        variants: [
          { id: 'a', name: 'Current', traffic: 50, conversionRate: 8.3 },
          { id: 'b', name: 'New Design', traffic: 50, conversionRate: 11.7 }
        ],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
        metrics: {
          impressions: 15000,
          conversions: 1500,
          significance: 0.95
        }
      }
    ];

    return status ? tests.filter(test => test.status === status) : tests;
  }

  getMarketResponses(): MarketResponse[] {
    return [
      {
        id: 'response-1',
        source: 'Twitter',
        message: 'Great new CRM features!',
        sentiment: 'positive',
        engagement: 45,
        reach: 1200,
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'response-2',
        source: 'LinkedIn',
        message: 'Impressive AI capabilities',
        sentiment: 'positive',
        engagement: 78,
        reach: 890,
        createdAt: new Date('2024-01-16')
      },
      {
        id: 'response-3',
        source: 'Reddit',
        message: 'Interface could be better',
        sentiment: 'negative',
        engagement: 23,
        reach: 345,
        createdAt: new Date('2024-01-17')
      }
    ];
  }

  getValidationMetrics(): ValidationMetrics {
    return {
      validationAccuracy: 87.5,
      totalValidations: 150,
      averageConfidence: 89.2,
      successfulValidations: 131
    };
  }

  async createABTest(testData: any): Promise<string> {
    // Simulate creating an A/B test
    const testId = `test-${Date.now()}`;
    console.log('Creating A/B test:', testId, testData);
    return testId;
  }

  async submitFeedback(feedbackData: any): Promise<string> {
    // Simulate submitting feedback
    const feedbackId = `feedback-${Date.now()}`;
    console.log('Submitting feedback:', feedbackId, feedbackData);
    return feedbackId;
  }

  async forceValidation(): Promise<void> {
    // Simulate forcing validation
    console.log('Forcing market validation...');
    return Promise.resolve();
  }
}

export const marketValidationAutomation = new MarketValidationAutomation();
