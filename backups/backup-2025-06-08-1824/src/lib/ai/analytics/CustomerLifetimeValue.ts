import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/server';

interface Customer {
  id: string;
  createdAt: Date;
  segment: string;
  attributes: CustomerAttributes;
  history: TransactionHistory;
  clv: CLVPrediction;
}

interface CustomerAttributes {
  acquisitionChannel: string;
  location: string;
  industry?: string;
  companySize?: string;
  productUsage: ProductUsage;
  engagementScore: number;
  supportTickets: number;
  npsScore?: number;
}

interface ProductUsage {
  activeFeatures: string[];
  loginFrequency: number; // logins per month
  dataVolume: number; // GB
  apiCalls: number;
  lastActive: Date;
}

interface TransactionHistory {
  totalRevenue: number;
  transactionCount: number;
  averageOrderValue: number;
  firstPurchase: Date;
  lastPurchase: Date;
  purchases: Purchase[];
  subscriptions: Subscription[];
  churnRisk: number;
}

interface Purchase {
  id: string;
  date: Date;
  amount: number;
  product: string;
  category: string;
}

interface Subscription {
  id: string;
  plan: string;
  startDate: Date;
  endDate?: Date;
  mrr: number; // Monthly Recurring Revenue
  status: 'active' | 'cancelled' | 'past_due';
}

interface CLVPrediction {
  predicted: number;
  confidence: number;
  timeHorizon: number; // months
  components: {
    recurringRevenue: number;
    upsellPotential: number;
    expansionRevenue: number;
    retentionProbability: number;
  };
  segment: 'high' | 'medium' | 'low';
  lastCalculated: Date;
}

interface CLVModel {
  id: string;
  type: 'regression' | 'survival' | 'probabilistic' | 'hybrid';
  accuracy: number;
  features: string[];
  coefficients: Record<string, number>;
  performance: {
    rmse: number;
    mae: number;
    r2: number;
  };
  lastTrained: Date;
}

interface CustomerSegment {
  name: string;
  criteria: SegmentCriteria;
  avgCLV: number;
  customerCount: number;
  characteristics: string[];
  strategies: string[];
}

interface SegmentCriteria {
  minRevenue?: number;
  maxRevenue?: number;
  minTransactions?: number;
  productCategories?: string[];
  churnRiskThreshold?: number;
}

export class CustomerLifetimeValue extends EventEmitter {
  private customers: Map<string, Customer> = new Map();
  private models: Map<string, CLVModel> = new Map();
  private segments: Map<string, CustomerSegment> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly PREDICTION_HORIZON = 24; // 24 months

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    await this.loadCustomerData();
    await this.initializeModels();
    await this.defineSegments();
    this.startContinuousCalculation();
  }

  private async loadCustomerData() {
    try {
      const supabase = await createClient();
      
      // Load customer profiles
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      // Load transaction history
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: true });

      if (transactionsError) throw transactionsError;

      // Load subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subscriptionsError) throw subscriptionsError;

      // Process and combine data
      if (customers) {
        customers.forEach(customerData => {
          const customer = this.createCustomerProfile(
            customerData,
            transactions?.filter(t => t.customer_id === customerData.id) || [],
            subscriptions?.filter(s => s.customer_id === customerData.id) || []
          );
          this.customers.set(customer.id, customer);
        });
      }

      this.emit('data:loaded', { 
        customerCount: this.customers.size 
      });

    } catch (error) {
      console.error('Failed to load customer data:', error);
      this.emit('error', { type: 'data_load', error });
    }
  }

  private createCustomerProfile(
    customerData: Record<string, unknown>,
    transactions: Array<Record<string, unknown>>,
    subscriptions: Array<Record<string, unknown>>
  ): Customer {
    const now = new Date();
    const createdAt = new Date(customerData.created_at as string);

    // Calculate transaction history
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount as number), 0);
    const purchases = transactions.map(t => ({
      id: t.id as string,
      date: new Date(t.created_at as string),
      amount: t.amount as number,
      product: (t.product as string) || 'unknown',
      category: (t.category as string) || 'general'
    }));

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const mrr = activeSubscriptions.reduce((sum, s) => sum + (s.amount as number), 0);

    const history: TransactionHistory = {
      totalRevenue,
      transactionCount: transactions.length,
      averageOrderValue: transactions.length > 0 ? totalRevenue / transactions.length : 0,
      firstPurchase: purchases.length > 0 ? purchases[0].date : createdAt,
      lastPurchase: purchases.length > 0 ? purchases[purchases.length - 1].date : createdAt,
      purchases,
      subscriptions: subscriptions.map(s => ({
        id: s.id as string,
        plan: s.plan as string,
        startDate: new Date(s.created_at as string),
        endDate: s.cancelled_at ? new Date(s.cancelled_at as string) : undefined,
        mrr: s.amount as number,
        status: s.status as 'active' | 'cancelled' | 'past_due'
      })),
      churnRisk: this.calculateChurnRisk(customerData, purchases, activeSubscriptions)
    };

    // Build customer profile
    const customer: Customer = {
      id: customerData.id as string,
      createdAt,
      segment: 'medium', // Will be updated after CLV calculation
      attributes: {
        acquisitionChannel: (customerData.acquisition_channel as string) || 'organic',
        location: (customerData.location as string) || 'unknown',
        industry: customerData.industry as string | undefined,
        companySize: customerData.company_size as string | undefined,
        productUsage: {
          activeFeatures: (customerData.active_features as string[]) || [],
          loginFrequency: (customerData.login_frequency as number) || 0,
          dataVolume: (customerData.data_volume as number) || 0,
          apiCalls: (customerData.api_calls as number) || 0,
          lastActive: customerData.last_active ? new Date(customerData.last_active as string) : now
        },
        engagementScore: this.calculateEngagementScore(customerData),
        supportTickets: (customerData.support_tickets as number) || 0,
        npsScore: customerData.nps_score as number | undefined
      },
      history,
      clv: {
        predicted: 0,
        confidence: 0,
        timeHorizon: this.PREDICTION_HORIZON,
        components: {
          recurringRevenue: mrr * this.PREDICTION_HORIZON,
          upsellPotential: 0,
          expansionRevenue: 0,
          retentionProbability: 0
        },
        segment: 'medium',
        lastCalculated: new Date()
      }
    };

    return customer;
  }

  private calculateChurnRisk(
    customerData: Record<string, unknown>,
    purchases: Purchase[],
    activeSubscriptions: Array<Record<string, unknown>>
  ): number {
    let risk = 0;
    const now = new Date();

    // No active subscriptions
    if (activeSubscriptions.length === 0) {
      risk += 0.3;
    }

    // Last purchase recency
    if (purchases.length > 0) {
      const daysSinceLastPurchase = 
        (now.getTime() - purchases[purchases.length - 1].date.getTime()) / 
        (1000 * 60 * 60 * 24);
      
      if (daysSinceLastPurchase > 180) risk += 0.3;
      else if (daysSinceLastPurchase > 90) risk += 0.2;
      else if (daysSinceLastPurchase > 30) risk += 0.1;
    }

    // Low engagement
    const lastActive = customerData.last_active ? 
      new Date(customerData.last_active as string) : now;
    const daysSinceActive = 
      (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActive > 30) risk += 0.2;
    else if (daysSinceActive > 14) risk += 0.1;

    // Support tickets (high number indicates problems)
    if ((customerData.support_tickets as number) > 5) risk += 0.1;

    // Low NPS score
    if (customerData.nps_score && (customerData.nps_score as number) < 7) risk += 0.2;

    return Math.min(1, risk);
  }

  private calculateEngagementScore(customerData: Record<string, unknown>): number {
    let score = 0;
    const weights = {
      loginFrequency: 0.3,
      featureUsage: 0.3,
      dataVolume: 0.2,
      apiCalls: 0.2
    };

    // Login frequency (normalized to 0-1)
    const loginScore = Math.min(1, ((customerData.login_frequency as number) || 0) / 30);
    score += loginScore * weights.loginFrequency;

    // Feature usage
    const featureScore = Math.min(1, ((customerData.active_features as string[])?.length || 0) / 10);
    score += featureScore * weights.featureUsage;

    // Data volume (normalized, assuming 100GB is max)
    const dataScore = Math.min(1, ((customerData.data_volume as number) || 0) / 100);
    score += dataScore * weights.dataVolume;

    // API calls (normalized, assuming 10000 is max)
    const apiScore = Math.min(1, ((customerData.api_calls as number) || 0) / 10000);
    score += apiScore * weights.apiCalls;

    return score;
  }

  private async initializeModels() {
    // Initialize different CLV models
    const models: CLVModel[] = [
      {
        id: 'regression',
        type: 'regression',
        accuracy: 0,
        features: ['totalRevenue', 'transactionCount', 'tenure', 'mrr', 'engagementScore'],
        coefficients: {
          totalRevenue: 0.8,
          transactionCount: 0.05,
          tenure: 0.1,
          mrr: 12,
          engagementScore: 500
        },
        performance: { rmse: 0, mae: 0, r2: 0 },
        lastTrained: new Date()
      },
      {
        id: 'survival',
        type: 'survival',
        accuracy: 0,
        features: ['churnRisk', 'tenure', 'lastPurchase', 'supportTickets'],
        coefficients: {
          churnRisk: -0.5,
          tenure: 0.02,
          lastPurchase: -0.01,
          supportTickets: -0.05
        },
        performance: { rmse: 0, mae: 0, r2: 0 },
        lastTrained: new Date()
      },
      {
        id: 'probabilistic',
        type: 'probabilistic',
        accuracy: 0,
        features: ['frequency', 'recency', 'monetary', 'tenure'],
        coefficients: {
          frequency: 0.3,
          recency: -0.2,
          monetary: 0.4,
          tenure: 0.1
        },
        performance: { rmse: 0, mae: 0, r2: 0 },
        lastTrained: new Date()
      },
      {
        id: 'hybrid',
        type: 'hybrid',
        accuracy: 0,
        features: ['all'],
        coefficients: {},
        performance: { rmse: 0, mae: 0, r2: 0 },
        lastTrained: new Date()
      }
    ];

    models.forEach(model => {
      this.models.set(model.id, model);
    });

    // Train models
    await this.trainModels();
  }

  private async trainModels() {
    for (const [modelId, model] of this.models) {
      try {
        await this.trainModel(model);
        this.emit('model:trained', { modelId, performance: model.performance });
      } catch (error) {
        console.error(`Failed to train model ${modelId}:`, error);
      }
    }
  }

  private async trainModel(model: CLVModel) {
    // Prepare training data
    const trainingData = Array.from(this.customers.values())
      .filter(c => c.history.transactionCount > 0);

    if (trainingData.length < 10) {
      console.warn('Insufficient data for training');
      return;
    }

    // Simulate model training based on type
    switch (model.type) {
      case 'regression':
        this.trainRegressionModel(model, trainingData);
        break;
      case 'survival':
        this.trainSurvivalModel(model, trainingData);
        break;
      case 'probabilistic':
        this.trainProbabilisticModel(model, trainingData);
        break;
      case 'hybrid':
        this.trainHybridModel(model, trainingData);
        break;
    }

    model.lastTrained = new Date();
  }

  private trainRegressionModel(model: CLVModel, data: Customer[]) {
    // Simple linear regression simulation
    const _features = this.extractFeatures(data, model.features);
    const _actuals = data.map(c => c.history.totalRevenue);

    // Simulate training
    model.performance = {
      rmse: 100 + Math.random() * 50,
      mae: 80 + Math.random() * 40,
      r2: 0.7 + Math.random() * 0.2
    };
    model.accuracy = model.performance.r2;
  }

  private trainSurvivalModel(model: CLVModel, _data: Customer[]) {
    // Survival analysis simulation
    model.performance = {
      rmse: 120 + Math.random() * 60,
      mae: 90 + Math.random() * 45,
      r2: 0.65 + Math.random() * 0.2
    };
    model.accuracy = model.performance.r2;
  }

  private trainProbabilisticModel(model: CLVModel, _data: Customer[]) {
    // BG/NBD or Pareto/NBD model simulation
    model.performance = {
      rmse: 110 + Math.random() * 55,
      mae: 85 + Math.random() * 42,
      r2: 0.68 + Math.random() * 0.2
    };
    model.accuracy = model.performance.r2;
  }

  private trainHybridModel(model: CLVModel, _data: Customer[]) {
    // Ensemble of all models
    const otherModels = Array.from(this.models.values())
      .filter(m => m.type !== 'hybrid');
    
    if (otherModels.length > 0) {
      const avgR2 = otherModels.reduce((sum, m) => sum + m.performance.r2, 0) / otherModels.length;
      model.performance = {
        rmse: 90 + Math.random() * 40,
        mae: 70 + Math.random() * 35,
        r2: Math.min(0.95, avgR2 * 1.1)
      };
      model.accuracy = model.performance.r2;
    }
  }

  private extractFeatures(customers: Customer[], featureNames: string[]): number[][] {
    return customers.map(customer => {
      const features: number[] = [];
      const now = new Date();

      featureNames.forEach(feature => {
        switch (feature) {
          case 'totalRevenue':
            features.push(customer.history.totalRevenue);
            break;
          case 'transactionCount':
            features.push(customer.history.transactionCount);
            break;
          case 'tenure':
            features.push((now.getTime() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)); // months
            break;
          case 'mrr':
            features.push(customer.history.subscriptions
              .filter(s => s.status === 'active')
              .reduce((sum, s) => sum + s.mrr, 0));
            break;
          case 'engagementScore':
            features.push(customer.attributes.engagementScore);
            break;
          case 'churnRisk':
            features.push(customer.history.churnRisk);
            break;
          case 'frequency':
            features.push(customer.history.transactionCount);
            break;
          case 'recency':
            features.push((now.getTime() - customer.history.lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
            break;
          case 'monetary':
            features.push(customer.history.averageOrderValue);
            break;
          default:
            features.push(0);
        }
      });

      return features;
    });
  }

  private async defineSegments() {
    const segments: CustomerSegment[] = [
      {
        name: 'High Value',
        criteria: {
          minRevenue: 10000,
          minTransactions: 10,
          churnRiskThreshold: 0.3
        },
        avgCLV: 0,
        customerCount: 0,
        characteristics: [
          'High transaction frequency',
          'Low churn risk',
          'Multiple product adoption',
          'High engagement'
        ],
        strategies: [
          'VIP support',
          'Early access to features',
          'Dedicated account management',
          'Custom pricing'
        ]
      },
      {
        name: 'Growth Potential',
        criteria: {
          minRevenue: 1000,
          maxRevenue: 10000,
          minTransactions: 3
        },
        avgCLV: 0,
        customerCount: 0,
        characteristics: [
          'Increasing usage trend',
          'Good engagement',
          'Expansion opportunities'
        ],
        strategies: [
          'Upsell campaigns',
          'Feature education',
          'Usage incentives',
          'Referral programs'
        ]
      },
      {
        name: 'At Risk',
        criteria: {
          churnRiskThreshold: 0.6
        },
        avgCLV: 0,
        customerCount: 0,
        characteristics: [
          'Declining usage',
          'Support issues',
          'Low engagement'
        ],
        strategies: [
          'Win-back campaigns',
          'Retention offers',
          'Proactive support',
          'Feedback collection'
        ]
      },
      {
        name: 'New Customers',
        criteria: {
          minTransactions: 1
        },
        avgCLV: 0,
        customerCount: 0,
        characteristics: [
          'Recently acquired',
          'Learning phase',
          'High potential variance'
        ],
        strategies: [
          'Onboarding optimization',
          'Early engagement',
          'Education content',
          'Trial extensions'
        ]
      }
    ];

    segments.forEach(segment => {
      this.segments.set(segment.name, segment);
    });
  }

  private startContinuousCalculation() {
    // Initial calculation
    this.calculateAllCLV();

    // Update CLV daily
    this.updateInterval = setInterval(() => {
      this.calculateAllCLV();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private async calculateAllCLV() {
    let totalCalculated = 0;

    for (const [customerId, customer] of this.customers) {
      try {
        const clv = await this.calculateCLV(customer);
        customer.clv = clv;
        
        // Update segment
        customer.segment = this.determineSegment(customer);
        
        totalCalculated++;
      } catch (error) {
        console.error(`Failed to calculate CLV for customer ${customerId}:`, error);
      }
    }

    // Update segment statistics
    this.updateSegmentStats();

    // Store results
    await this.storeCLVResults();

    this.emit('calculation:completed', {
      customersProcessed: totalCalculated,
      timestamp: new Date()
    });
  }

  async calculateCLV(customer: Customer): Promise<CLVPrediction> {
    const predictions: Map<string, number> = new Map();

    // Get predictions from each model
    for (const [modelId, model] of this.models) {
      const prediction = this.predictWithModel(customer, model);
      predictions.set(modelId, prediction);
    }

    // Combine predictions (weighted by model accuracy)
    let totalWeight = 0;
    let weightedPrediction = 0;

    for (const [modelId, prediction] of predictions) {
      const model = this.models.get(modelId)!;
      const weight = model.accuracy;
      weightedPrediction += prediction * weight;
      totalWeight += weight;
    }

    const finalPrediction = totalWeight > 0 ? 
      weightedPrediction / totalWeight : 0;

    // Calculate components
    const components = this.calculateCLVComponents(customer);

    // Determine confidence based on data quality and model agreement
    const confidence = this.calculateConfidence(customer, predictions);

    // Determine segment
    const segment = finalPrediction > 50000 ? 'high' :
                    finalPrediction > 10000 ? 'medium' : 'low';

    return {
      predicted: finalPrediction,
      confidence,
      timeHorizon: this.PREDICTION_HORIZON,
      components,
      segment,
      lastCalculated: new Date()
    };
  }

  private predictWithModel(customer: Customer, model: CLVModel): number {
    let prediction = 0;
    const now = new Date();

    switch (model.type) {
      case 'regression':
        // Linear combination of features
        prediction = 
          customer.history.totalRevenue * model.coefficients.totalRevenue +
          customer.history.transactionCount * model.coefficients.transactionCount +
          ((now.getTime() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)) * model.coefficients.tenure +
          customer.history.subscriptions
            .filter(s => s.status === 'active')
            .reduce((sum, s) => sum + s.mrr, 0) * model.coefficients.mrr * this.PREDICTION_HORIZON +
          customer.attributes.engagementScore * model.coefficients.engagementScore;
        break;

      case 'survival':
        // Survival-based prediction
        const survivalTime = this.PREDICTION_HORIZON * (1 - customer.history.churnRisk);
        const monthlyValue = customer.history.totalRevenue / 
          Math.max(1, (now.getTime() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
        prediction = monthlyValue * survivalTime;
        break;

      case 'probabilistic':
        // RFM-based prediction
        const recency = (now.getTime() - customer.history.lastPurchase.getTime()) / (1000 * 60 * 60 * 24);
        const frequency = customer.history.transactionCount;
        const monetary = customer.history.averageOrderValue;
        
        const recencyScore = Math.exp(-recency / 90); // Decay over 90 days
        prediction = frequency * monetary * recencyScore * this.PREDICTION_HORIZON;
        break;

      case 'hybrid':
        // Average of other models
        const otherPredictions: number[] = [];
        for (const [otherId, otherModel] of this.models) {
          if (otherId !== 'hybrid') {
            otherPredictions.push(this.predictWithModel(customer, otherModel));
          }
        }
        prediction = otherPredictions.length > 0 ?
          otherPredictions.reduce((sum, p) => sum + p, 0) / otherPredictions.length : 0;
        break;
    }

    return Math.max(0, prediction);
  }

  private calculateCLVComponents(customer: Customer): CLVPrediction['components'] {
    const activeSubs = customer.history.subscriptions.filter(s => s.status === 'active');
    const mrr = activeSubs.reduce((sum, s) => sum + s.mrr, 0);
    
    // Recurring revenue
    const recurringRevenue = mrr * this.PREDICTION_HORIZON * (1 - customer.history.churnRisk);

    // Upsell potential based on current usage vs. available features
    const usageRate = customer.attributes.productUsage.activeFeatures.length / 20; // Assume 20 total features
    const upsellPotential = (1 - usageRate) * customer.history.averageOrderValue * 12;

    // Expansion revenue based on growth trend
    const growthRate = this.calculateGrowthRate(customer);
    const expansionRevenue = customer.history.totalRevenue * growthRate * (this.PREDICTION_HORIZON / 12);

    // Retention probability
    const retentionProbability = 1 - customer.history.churnRisk;

    return {
      recurringRevenue,
      upsellPotential,
      expansionRevenue,
      retentionProbability
    };
  }

  private calculateGrowthRate(customer: Customer): number {
    const purchases = customer.history.purchases;
    if (purchases.length < 3) return 0;

    // Calculate month-over-month growth
    const monthlyRevenue = new Map<string, number>();
    
    purchases.forEach(purchase => {
      const monthKey = `${purchase.date.getFullYear()}-${purchase.date.getMonth()}`;
      monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + purchase.amount);
    });

    const months = Array.from(monthlyRevenue.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (months.length < 2) return 0;

    // Simple growth rate calculation
    const firstMonth = months[0][1];
    const lastMonth = months[months.length - 1][1];
    const monthsElapsed = months.length - 1;

    return monthsElapsed > 0 ? (lastMonth - firstMonth) / (firstMonth * monthsElapsed) : 0;
  }

  private calculateConfidence(customer: Customer, predictions: Map<string, number>): number {
    let confidence = 0.5; // Base confidence

    // Data quality factors
    if (customer.history.transactionCount > 10) confidence += 0.1;
    if (customer.history.transactionCount > 50) confidence += 0.1;
    
    const tenure = (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (tenure > 12) confidence += 0.1;
    if (tenure > 24) confidence += 0.1;

    // Model agreement
    const predictionValues = Array.from(predictions.values());
    if (predictionValues.length > 0) {
      const mean = predictionValues.reduce((sum, p) => sum + p, 0) / predictionValues.length;
      const variance = predictionValues.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / predictionValues.length;
      const cv = Math.sqrt(variance) / mean; // Coefficient of variation
      
      if (cv < 0.2) confidence += 0.1; // Low variance = high agreement
    }

    return Math.min(0.95, confidence);
  }

  private determineSegment(customer: Customer): string {
    for (const [segmentName, segment] of this.segments) {
      if (this.matchesSegmentCriteria(customer, segment.criteria)) {
        return segmentName;
      }
    }
    return 'Other';
  }

  private matchesSegmentCriteria(customer: Customer, criteria: SegmentCriteria): boolean {
    if (criteria.minRevenue && customer.history.totalRevenue < criteria.minRevenue) {
      return false;
    }
    if (criteria.maxRevenue && customer.history.totalRevenue > criteria.maxRevenue) {
      return false;
    }
    if (criteria.minTransactions && customer.history.transactionCount < criteria.minTransactions) {
      return false;
    }
    if (criteria.churnRiskThreshold && customer.history.churnRisk > criteria.churnRiskThreshold) {
      return false;
    }
    return true;
  }

  private updateSegmentStats() {
    for (const [segmentName, segment] of this.segments) {
      const segmentCustomers = Array.from(this.customers.values())
        .filter(c => c.segment === segmentName);
      
      segment.customerCount = segmentCustomers.length;
      segment.avgCLV = segmentCustomers.length > 0 ?
        segmentCustomers.reduce((sum, c) => sum + c.clv.predicted, 0) / segmentCustomers.length : 0;
    }
  }

  private async storeCLVResults() {
    try {
      const supabase = await createClient();
      
      const results = Array.from(this.customers.values()).map(customer => ({
        customer_id: customer.id,
        clv_predicted: customer.clv.predicted,
        clv_confidence: customer.clv.confidence,
        segment: customer.segment,
        churn_risk: customer.history.churnRisk,
        components: customer.clv.components,
        calculated_at: customer.clv.lastCalculated
      }));

      await supabase
        .from('ai_customer_clv')
        .upsert(results, { onConflict: 'customer_id' });

    } catch (error) {
      console.error('Failed to store CLV results:', error);
    }
  }

  async getCustomerCLV(customerId: string): Promise<CLVPrediction | null> {
    const customer = this.customers.get(customerId);
    if (!customer) return null;

    // Recalculate if needed
    const hoursSinceLastCalc = 
      (Date.now() - customer.clv.lastCalculated.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastCalc > 24) {
      customer.clv = await this.calculateCLV(customer);
    }

    return customer.clv;
  }

  async getSegmentAnalysis(): Promise<{
    segments: Array<{
      name: string;
      customerCount: number;
      avgCLV: number;
      totalCLV: number;
      growthRate: number;
      churnRate: number;
      strategies: string[];
    }>;
    insights: string[];
  }> {
    const segmentAnalysis: Array<{
      name: string;
      customerCount: number;
      avgCLV: number;
      totalCLV: number;
      growthRate: number;
      churnRate: number;
      strategies: string[];
    }> = [];
    const insights: string[] = [];

    for (const [segmentName, segment] of this.segments) {
      const customers = Array.from(this.customers.values())
        .filter(c => c.segment === segmentName);
      
      const totalCLV = customers.reduce((sum, c) => sum + c.clv.predicted, 0);
      const avgChurnRisk = customers.length > 0 ?
        customers.reduce((sum, c) => sum + c.history.churnRisk, 0) / customers.length : 0;
      
      // Calculate growth rate
      const growthRate = customers.length > 0 ?
        customers.reduce((sum, c) => sum + this.calculateGrowthRate(c), 0) / customers.length : 0;

      segmentAnalysis.push({
        name: segmentName,
        customerCount: segment.customerCount,
        avgCLV: segment.avgCLV,
        totalCLV,
        growthRate,
        churnRate: avgChurnRisk,
        strategies: segment.strategies
      });
    }

    // Generate insights
    const totalCLV = segmentAnalysis.reduce((sum, s) => sum + s.totalCLV, 0);
    const highValueSegment = segmentAnalysis.find(s => s.name === 'High Value');
    
    if (highValueSegment && totalCLV > 0) {
      const highValueContribution = (highValueSegment.totalCLV / totalCLV) * 100;
      insights.push(`High-value customers contribute ${highValueContribution.toFixed(1)}% of total CLV`);
    }

    const atRiskSegment = segmentAnalysis.find(s => s.name === 'At Risk');
    if (atRiskSegment && atRiskSegment.customerCount > 0) {
      const atRiskCLV = atRiskSegment.totalCLV;
      insights.push(`${atRiskCLV.toFixed(0)} in CLV at risk from ${atRiskSegment.customerCount} customers`);
    }

    return { segments: segmentAnalysis, insights };
  }

  async getTopCustomers(limit: number = 10): Promise<Array<{
    customer: Customer;
    rank: number;
    percentileRank: number;
  }>> {
    const sortedCustomers = Array.from(this.customers.values())
      .sort((a, b) => b.clv.predicted - a.clv.predicted);

    return sortedCustomers.slice(0, limit).map((customer, index) => ({
      customer,
      rank: index + 1,
      percentileRank: ((sortedCustomers.length - index) / sortedCustomers.length) * 100
    }));
  }

  async getRetentionAnalysis(): Promise<{
    cohorts: Array<{
      month: string;
      customers: number;
      retained: number[];
      retentionRate: number[];
    }>;
    averageLifetime: number;
    ltv: number;
  }> {
    // Group customers by cohort (month of first purchase)
    const cohorts = new Map<string, Customer[]>();
    
    this.customers.forEach(customer => {
      const cohortKey = `${customer.history.firstPurchase.getFullYear()}-${customer.history.firstPurchase.getMonth() + 1}`;
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, []);
      }
      cohorts.get(cohortKey)!.push(customer);
    });

    const cohortAnalysis = Array.from(cohorts.entries()).map(([month, customers]) => {
      const retained: number[] = [];
      const retentionRate: number[] = [];
      
      // Calculate retention for each subsequent month
      for (let i = 0; i <= 12; i++) {
        const retainedCount = customers.filter(c => {
          const monthsSinceFirst = 
            (c.history.lastPurchase.getTime() - c.history.firstPurchase.getTime()) / 
            (1000 * 60 * 60 * 24 * 30);
          return monthsSinceFirst >= i;
        }).length;
        
        retained.push(retainedCount);
        retentionRate.push(customers.length > 0 ? retainedCount / customers.length : 0);
      }

      return { month, customers: customers.length, retained, retentionRate };
    });

    // Calculate average lifetime
    const lifetimes = Array.from(this.customers.values()).map(c => {
      return (c.history.lastPurchase.getTime() - c.history.firstPurchase.getTime()) / 
        (1000 * 60 * 60 * 24 * 30); // months
    });
    
    const averageLifetime = lifetimes.length > 0 ?
      lifetimes.reduce((sum, l) => sum + l, 0) / lifetimes.length : 0;

    // Calculate average LTV
    const ltv = this.customers.size > 0 ?
      Array.from(this.customers.values())
        .reduce((sum, c) => sum + c.clv.predicted, 0) / this.customers.size : 0;

    return { cohorts: cohortAnalysis, averageLifetime, ltv };
  }

  async optimizeSegmentStrategies(): Promise<Map<string, string[]>> {
    const optimizedStrategies = new Map<string, string[]>();

    for (const [segmentName, segment] of this.segments) {
      const customers = Array.from(this.customers.values())
        .filter(c => c.segment === segmentName);
      
      const strategies: string[] = [...segment.strategies];

      // Add data-driven recommendations
      if (customers.length > 0) {
        const avgEngagement = customers.reduce((sum, c) => 
          sum + c.attributes.engagementScore, 0) / customers.length;
        
        if (avgEngagement < 0.3) {
          strategies.push('Implement engagement campaign');
        }

        const avgNPS = customers
          .filter(c => c.attributes.npsScore !== undefined)
          .reduce((sum, c) => sum + (c.attributes.npsScore || 0), 0) / 
          customers.filter(c => c.attributes.npsScore !== undefined).length;
        
        if (avgNPS < 7) {
          strategies.push('Focus on customer satisfaction improvements');
        }
      }

      optimizedStrategies.set(segmentName, strategies);
    }

    return optimizedStrategies;
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
