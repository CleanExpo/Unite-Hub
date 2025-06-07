// Unite Group + CARSI Advanced AI Features

import { createClient } from '@/lib/supabase/server';
import { UnifiedCustomer, Project, CourseEnrollment } from '@/lib/types/crm-integration';

// AI Model Types
export type PredictionType = 
  | 'churn-risk'
  | 'course-timing'
  | 'bundle-recommendation'
  | 'ltv-forecast'
  | 'engagement-drop'
  | 'cross-sell-opportunity';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Prediction Interfaces
export interface ChurnPrediction {
  customerId: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  factors: ChurnFactor[];
  recommendedActions: RecommendedAction[];
  predictedChurnDate?: Date;
  confidence: number; // 0-1
}

export interface ChurnFactor {
  factor: string;
  impact: number; // -100 to 100 (negative reduces churn, positive increases)
  description: string;
}

export interface RecommendedAction {
  id: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  expectedImpact: number; // Expected reduction in churn risk
  automationAvailable: boolean;
}

export interface CourseTiming {
  customerId: string;
  courseId: string;
  optimalStartDate: Date;
  reasoning: string[];
  readinessScore: number; // 0-100
  completionProbability: number; // 0-1
}

export interface DynamicBundle {
  id: string;
  name: string;
  services: BundleService[];
  totalPrice: number;
  discount: number;
  estimatedValue: number;
  personalizationScore: number; // 0-100
  conversionProbability: number; // 0-1
}

export interface BundleService {
  serviceId: string;
  serviceName: string;
  provider: 'unite' | 'carsi';
  price: number;
  relevanceScore: number; // 0-100
}

/**
 * Predict customer churn risk using behavioral patterns
 */
export async function predictChurnRisk(customer: UnifiedCustomer): Promise<ChurnPrediction> {
  const factors: ChurnFactor[] = [];
  let baseRisk = 20; // Base churn risk

  // 1. Engagement Analysis
  const engagementScore = customer.engagementAnalytics.engagementScore;
  if (engagementScore < 30) {
    factors.push({
      factor: 'Low Engagement',
      impact: 40,
      description: 'Customer engagement is significantly below average',
    });
    baseRisk += 40;
  } else if (engagementScore > 70) {
    factors.push({
      factor: 'High Engagement',
      impact: -20,
      description: 'Customer is highly engaged with services',
    });
    baseRisk -= 20;
  }

  // 2. Activity Recency
  const lastActivity = customer.engagementAnalytics.lastInteraction;
  const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceActivity > 60) {
    factors.push({
      factor: 'Inactive Account',
      impact: 30,
      description: `No activity in ${daysSinceActivity} days`,
    });
    baseRisk += 30;
  } else if (daysSinceActivity < 7) {
    factors.push({
      factor: 'Recent Activity',
      impact: -15,
      description: 'Customer was active within the last week',
    });
    baseRisk -= 15;
  }

  // 3. Project/Course Completion
  const completedProjects = customer.uniteServices.activeProjects.filter(p => p.status === 'completed').length;
  const completedCourses = customer.carsiCourses.currentEnrollments.filter(c => c.progress === 100).length;
  
  if (completedProjects + completedCourses === 0) {
    factors.push({
      factor: 'No Completions',
      impact: 25,
      description: 'Customer has not completed any projects or courses',
    });
    baseRisk += 25;
  } else if (completedProjects + completedCourses > 3) {
    factors.push({
      factor: 'Multiple Completions',
      impact: -30,
      description: 'Customer has successfully completed multiple services',
    });
    baseRisk -= 30;
  }

  // 4. Support Ticket Analysis
  const recentTickets = customer.engagementAnalytics.supportTickets.filter(
    t => t.status === 'unresolved' || (t.satisfactionScore !== undefined && t.satisfactionScore < 3)
  );
  
  if (recentTickets.length > 2) {
    factors.push({
      factor: 'Unresolved Issues',
      impact: 35,
      description: 'Multiple unresolved or low-satisfaction support tickets',
    });
    baseRisk += 35;
  }

  // 5. Payment Behavior
  const overdueInvoices = customer.purchaseHistory.invoices.filter(i => i.status === 'overdue').length;
  
  if (overdueInvoices > 0) {
    factors.push({
      factor: 'Payment Issues',
      impact: 20,
      description: `${overdueInvoices} overdue invoice(s)`,
    });
    baseRisk += 20;
  }

  // Calculate final risk score
  const riskScore = Math.max(0, Math.min(100, baseRisk));
  const riskLevel: RiskLevel = 
    riskScore >= 70 ? 'critical' :
    riskScore >= 50 ? 'high' :
    riskScore >= 30 ? 'medium' : 'low';

  // Generate recommendations
  const recommendedActions: RecommendedAction[] = [];
  
  if (engagementScore < 30) {
    recommendedActions.push({
      id: 'engagement-campaign',
      action: 'Launch personalized re-engagement email campaign',
      priority: 'high',
      expectedImpact: 15,
      automationAvailable: true,
    });
  }

  if (daysSinceActivity > 30) {
    recommendedActions.push({
      id: 'personal-outreach',
      action: 'Schedule personal check-in call from account manager',
      priority: 'high',
      expectedImpact: 20,
      automationAvailable: false,
    });
  }

  if (recentTickets.length > 0) {
    recommendedActions.push({
      id: 'escalate-support',
      action: 'Escalate unresolved tickets to senior support',
      priority: 'high',
      expectedImpact: 25,
      automationAvailable: true,
    });
  }

  // Predict churn date if high risk
  let predictedChurnDate: Date | undefined;
  if (riskScore > 50) {
    const daysUntilChurn = Math.floor((100 - riskScore) * 3.6); // Rough estimate
    predictedChurnDate = new Date(Date.now() + daysUntilChurn * 24 * 60 * 60 * 1000);
  }

  return {
    customerId: customer.customerId,
    riskScore,
    riskLevel,
    factors,
    recommendedActions,
    predictedChurnDate,
    confidence: 0.75 + (factors.length * 0.05), // More factors = higher confidence
  };
}

/**
 * Recommend optimal course timing based on project progress and learning patterns
 */
export async function recommendCourseTiming(
  customer: UnifiedCustomer,
  courseId: string
): Promise<CourseTiming> {
  const reasoning: string[] = [];
  let readinessScore = 50; // Base readiness

  // 1. Check current project load
  const activeProjects = customer.uniteServices.activeProjects.filter(
    p => p.status === 'in-progress'
  );
  
  if (activeProjects.length > 2) {
    reasoning.push('Customer has multiple active projects - course should be delayed');
    readinessScore -= 30;
  } else if (activeProjects.length === 0) {
    reasoning.push('No active projects - ideal time for course enrollment');
    readinessScore += 20;
  }

  // 2. Analyze course completion patterns
  const completedCourses = customer.carsiCourses.currentEnrollments.filter(
    c => c.progress === 100
  );
  
  if (completedCourses.length > 0) {
    const avgCompletionTime = completedCourses.reduce((sum, c) => {
      const duration = c.completedAt 
        ? c.completedAt.getTime() - c.enrolledAt.getTime()
        : 0;
      return sum + duration;
    }, 0) / completedCourses.length;

    const avgDays = avgCompletionTime / (1000 * 60 * 60 * 24);
    reasoning.push(`Average course completion time: ${Math.round(avgDays)} days`);
    readinessScore += 15;
  }

  // 3. Check for related project completions
  const relatedProjects = activeProjects.filter(p => {
    // Logic to determine if project is related to course
    return p.type === 'software' && courseId.includes('development');
  });

  if (relatedProjects.length > 0) {
    const nearestCompletion = relatedProjects
      .map(p => p.estimatedCompletion)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    reasoning.push('Course timing aligned with related project completion');
    readinessScore += 25;
    
    // Set optimal start date after project completion
    const optimalStartDate = new Date(nearestCompletion.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return {
      customerId: customer.customerId,
      courseId,
      optimalStartDate,
      reasoning,
      readinessScore: Math.min(100, readinessScore),
      completionProbability: calculateCompletionProbability(customer, readinessScore),
    };
  }

  // 4. Default timing based on current load
  const weeksDelay = activeProjects.length * 2;
  const optimalStartDate = new Date(Date.now() + weeksDelay * 7 * 24 * 60 * 60 * 1000);

  return {
    customerId: customer.customerId,
    courseId,
    optimalStartDate,
    reasoning,
    readinessScore: Math.max(0, Math.min(100, readinessScore)),
    completionProbability: calculateCompletionProbability(customer, readinessScore),
  };
}

/**
 * Generate dynamic bundle recommendations based on customer profile
 */
export async function generateDynamicBundle(customer: UnifiedCustomer): Promise<DynamicBundle> {
  const services: BundleService[] = [];
  let totalPrice = 0;

  // 1. Analyze customer needs based on current projects
  const projectTypes = new Set(customer.uniteServices.activeProjects.map(p => p.type));
  
  // Add Unite services based on gaps
  if (!projectTypes.has('seo')) {
    services.push({
      serviceId: 'unite-seo-audit',
      serviceName: 'Strategic SEO Audit & Implementation',
      provider: 'unite',
      price: 15000,
      relevanceScore: calculateServiceRelevance(customer, 'seo'),
    });
    totalPrice += 15000;
  }

  if (!projectTypes.has('strategy')) {
    services.push({
      serviceId: 'unite-business-strategy',
      serviceName: 'Business Strategy Consultation',
      provider: 'unite',
      price: 25000,
      relevanceScore: calculateServiceRelevance(customer, 'strategy'),
    });
    totalPrice += 25000;
  }

  // 2. Add complementary CARSI courses
  const enrolledCourseTypes = new Set(
    customer.carsiCourses.currentEnrollments.map(c => c.courseType)
  );

  if (!enrolledCourseTypes.has('leadership')) {
    services.push({
      serviceId: 'carsi-leadership',
      serviceName: 'Leadership Excellence Program',
      provider: 'carsi',
      price: 5000,
      relevanceScore: 85,
    });
    totalPrice += 5000;
  }

  if (projectTypes.has('software') && !enrolledCourseTypes.has('development')) {
    services.push({
      serviceId: 'carsi-advanced-dev',
      serviceName: 'Advanced Development Masterclass',
      provider: 'carsi',
      price: 3000,
      relevanceScore: 92,
    });
    totalPrice += 3000;
  }

  // 3. Calculate dynamic discount based on bundle size and customer value
  const bundleSize = services.length;
  const customerLTV = customer.financialSummary.lifetimeValue;
  
  let discountPercentage = 10; // Base discount
  if (bundleSize >= 4) discountPercentage += 5;
  if (customerLTV > 50000) discountPercentage += 5;
  if (customer.metadata.bundlePurchases > 0) discountPercentage += 3; // Loyalty bonus

  const discount = Math.round(totalPrice * (discountPercentage / 100));
  const finalPrice = totalPrice - discount;

  // 4. Calculate personalization score
  const avgRelevance = services.reduce((sum, s) => sum + s.relevanceScore, 0) / services.length;
  const personalizationScore = Math.round(avgRelevance);

  // 5. Estimate conversion probability
  const conversionProbability = calculateBundleConversionProbability(
    customer,
    services,
    discountPercentage
  );

  return {
    id: `dynamic-bundle-${customer.customerId}-${Date.now()}`,
    name: generateBundleName(services),
    services,
    totalPrice: finalPrice,
    discount,
    estimatedValue: totalPrice,
    personalizationScore,
    conversionProbability,
  };
}

/**
 * Calculate service relevance score for customer
 */
function calculateServiceRelevance(customer: UnifiedCustomer, serviceType: string): number {
  let relevance = 50; // Base relevance

  // Industry match
  if (customer.basicInfo.company?.industry) {
    // In production, would have industry-service mapping
    relevance += 20;
  }

  // Company size match
  if (customer.basicInfo.company?.size === 'enterprise' && serviceType === 'strategy') {
    relevance += 15;
  }

  // Past success with similar services
  const similarProjects = customer.uniteServices.projectHistory.filter(
    p => p.type === serviceType && p.satisfactionScore !== undefined && p.satisfactionScore >= 4
  );
  
  if (similarProjects.length > 0) {
    relevance += 10;
  }

  // Identified needs from support tickets
  const relatedTickets = customer.engagementAnalytics.supportTickets.filter(
    t => t.category === serviceType
  );
  
  if (relatedTickets.length > 0) {
    relevance += 15;
  }

  return Math.min(100, relevance);
}

/**
 * Calculate course completion probability
 */
function calculateCompletionProbability(customer: UnifiedCustomer, readinessScore: number): number {
  const baseProb = 0.5;
  
  // Historical completion rate
  const enrollments = customer.carsiCourses.currentEnrollments;
  const completed = enrollments.filter(c => c.progress === 100).length;
  const completionRate = enrollments.length > 0 ? completed / enrollments.length : 0.5;
  
  // Adjust based on readiness and history
  const probability = baseProb + (readinessScore / 200) + (completionRate * 0.3);
  
  return Math.min(0.95, Math.max(0.1, probability));
}

/**
 * Calculate bundle conversion probability
 */
function calculateBundleConversionProbability(
  customer: UnifiedCustomer,
  services: BundleService[],
  discountPercentage: number
): number {
  let probability = 0.3; // Base probability

  // Previous bundle purchases
  if (customer.metadata.bundlePurchases > 0) {
    probability += 0.2;
  }

  // High relevance score
  const avgRelevance = services.reduce((sum, s) => sum + s.relevanceScore, 0) / services.length;
  if (avgRelevance > 80) {
    probability += 0.15;
  }

  // Good discount
  if (discountPercentage >= 20) {
    probability += 0.1;
  }

  // Customer engagement
  if (customer.engagementAnalytics.engagementScore > 70) {
    probability += 0.15;
  }

  // Budget availability (based on company size)
  if (customer.basicInfo.company?.size === 'enterprise') {
    probability += 0.1;
  }

  return Math.min(0.85, probability);
}

/**
 * Generate bundle name based on services
 */
function generateBundleName(services: BundleService[]): string {
  const hasUnite = services.some(s => s.provider === 'unite');
  const hasCarsi = services.some(s => s.provider === 'carsi');
  
  if (hasUnite && hasCarsi) {
    if (services.some(s => s.serviceName.includes('Strategy'))) {
      return 'Executive Transformation Bundle';
    }
    if (services.some(s => s.serviceName.includes('Development'))) {
      return 'Technical Excellence Bundle';
    }
    return 'Complete Business Growth Bundle';
  }
  
  if (hasUnite) {
    return 'Unite Professional Services Bundle';
  }
  
  return 'CARSI Education Bundle';
}

/**
 * Analyze customer lifetime value trends
 */
export async function analyzeLTVTrends(customerId: string): Promise<{
  currentLTV: number;
  predictedLTV: number;
  growthRate: number;
  confidence: number;
}> {
  try {
    const supabase = await createClient();
    
    // Get historical purchase data
    const { data: purchases } = await supabase
      .from('purchases')
      .select('amount, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (!purchases || purchases.length === 0) {
      return {
        currentLTV: 0,
        predictedLTV: 0,
        growthRate: 0,
        confidence: 0,
      };
    }

    // Calculate current LTV
    const currentLTV = purchases.reduce((sum, p) => sum + p.amount, 0);

    // Calculate growth trend
    const monthlySpend = purchases.reduce((acc, p) => {
      const month = new Date(p.created_at).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    const months = Object.keys(monthlySpend).sort();
    const recentMonths = months.slice(-6);
    
    if (recentMonths.length < 2) {
      return {
        currentLTV,
        predictedLTV: currentLTV * 1.1,
        growthRate: 10,
        confidence: 0.3,
      };
    }

    // Calculate growth rate
    const firstMonth = monthlySpend[recentMonths[0]];
    const lastMonth = monthlySpend[recentMonths[recentMonths.length - 1]];
    const monthlyGrowthRate = firstMonth > 0 
      ? ((lastMonth - firstMonth) / firstMonth) / recentMonths.length 
      : 0;

    // Project future LTV (next 12 months)
    const avgMonthlySpend = recentMonths.reduce((sum, m) => sum + monthlySpend[m], 0) / recentMonths.length;
    const projectedAnnualSpend = avgMonthlySpend * 12 * (1 + monthlyGrowthRate * 12);
    const predictedLTV = currentLTV + projectedAnnualSpend;

    return {
      currentLTV,
      predictedLTV: Math.round(predictedLTV),
      growthRate: Math.round(monthlyGrowthRate * 100),
      confidence: Math.min(0.9, 0.5 + (purchases.length * 0.02)),
    };
  } catch (error) {
    console.error('LTV analysis error:', error);
    return {
      currentLTV: 0,
      predictedLTV: 0,
      growthRate: 0,
      confidence: 0,
    };
  }
}

/**
 * Detect engagement drop patterns
 */
export async function detectEngagementDrop(customer: UnifiedCustomer): Promise<{
  hasDropped: boolean;
  dropPercentage: number;
  peakEngagement: number;
  currentEngagement: number;
  recommendation: string;
}> {
  // Get engagement history (in production, would query from database)
  const currentEngagement = customer.engagementAnalytics.engagementScore;
  
  // Simulate historical data
  const peakEngagement = Math.max(currentEngagement * 1.5, 85);
  const dropPercentage = peakEngagement > 0 
    ? ((peakEngagement - currentEngagement) / peakEngagement) * 100 
    : 0;

  const hasDropped = dropPercentage > 30;

  let recommendation = 'Maintain current engagement strategies';
  
  if (dropPercentage > 50) {
    recommendation = 'Urgent: Launch immediate re-engagement campaign with personalized outreach';
  } else if (dropPercentage > 30) {
    recommendation = 'Schedule check-in call and offer exclusive benefits to re-engage';
  } else if (dropPercentage > 15) {
    recommendation = 'Send personalized content and course recommendations';
  }

  return {
    hasDropped,
    dropPercentage: Math.round(dropPercentage),
    peakEngagement,
    currentEngagement,
    recommendation,
  };
}

/**
 * Identify cross-sell opportunities with AI scoring
 */
export async function identifyCrossSellOpportunities(customer: UnifiedCustomer): Promise<{
  opportunities: Array<{
    serviceId: string;
    serviceName: string;
    provider: 'unite' | 'carsi';
    score: number;
    reasoning: string[];
    estimatedRevenue: number;
  }>;
  totalPotentialRevenue: number;
}> {
  const opportunities: Array<{
    serviceId: string;
    serviceName: string;
    provider: 'unite' | 'carsi';
    score: number;
    reasoning: string[];
    estimatedRevenue: number;
  }> = [];
  
  // Analyze gaps in customer's service portfolio
  const hasUniteSEO = customer.uniteServices.activeProjects.some(p => p.type === 'seo');
  const hasCARSIMarketing = customer.carsiCourses.currentEnrollments.some(
    c => c.courseName.toLowerCase().includes('marketing')
  );

  if (hasUniteSEO && !hasCARSIMarketing) {
    opportunities.push({
      serviceId: 'carsi-digital-marketing',
      serviceName: 'Digital Marketing Certification',
      provider: 'carsi' as const,
      score: 85,
      reasoning: [
        'Customer has SEO project with Unite',
        'No marketing education from CARSI',
        'Natural progression from SEO to broader marketing',
      ],
      estimatedRevenue: 5000,
    });
  }

  // Check for business strategy opportunities
  const hasStrategy = customer.uniteServices.activeProjects.some(p => p.type === 'strategy');
  const hasLeadership = customer.carsiCourses.currentEnrollments.some(
    c => c.courseName.toLowerCase().includes('leadership')
  );

  if (!hasStrategy && hasLeadership) {
    opportunities.push({
      serviceId: 'unite-strategic-planning',
      serviceName: 'Strategic Business Planning',
      provider: 'unite' as const,
      score: 78,
      reasoning: [
        'Customer enrolled in leadership training',
        'No strategic planning services from Unite',
        'Leadership training indicates executive-level interest',
      ],
      estimatedRevenue: 35000,
    });
  }

  // Software development opportunities
  const hasSoftwareProject = customer.uniteServices.activeProjects.some(p => p.type === 'software');
  const hasDevTraining = customer.carsiCourses.currentEnrollments.some(
    c => c.courseType === 'development'
  );

  if (hasSoftwareProject && !hasDevTraining) {
    opportunities.push({
      serviceId: 'carsi-dev-masterclass',
      serviceName: 'Advanced Development Masterclass',
      provider: 'carsi' as const,
      score: 92,
      reasoning: [
        'Active software project with Unite',
        'No development training from CARSI',
        'Team upskilling would improve project outcomes',
        'High correlation between project type and training need',
      ],
      estimatedRevenue: 8000,
    });
  }

  const totalPotentialRevenue = opportunities.reduce((sum, opp) => sum + opp.estimatedRevenue, 0);

  return {
    opportunities: opportunities.sort((a, b) => b.score - a.score),
    totalPotentialRevenue,
  };
}
