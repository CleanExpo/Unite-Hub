// Unite Group + CARSI A/B Testing Framework

import { createClient } from '@/lib/supabase/server';
import { UnifiedCustomer } from '@/lib/types/crm-integration';
import { cookies } from 'next/headers';

// Experiment Types
export type ExperimentType = 
  | 'pricing'
  | 'messaging'
  | 'ui-layout'
  | 'cta-button'
  | 'bundle-offer'
  | 'email-subject'
  | 'conversion-flow';

export type VariantType = 'control' | 'variant-a' | 'variant-b' | 'variant-c';

// Experiment Configuration
export interface Experiment {
  id: string;
  name: string;
  type: ExperimentType;
  description: string;
  hypothesis: string;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  targeting?: TargetingRule[];
  trafficAllocation: TrafficAllocation;
}

export interface ExperimentVariant {
  id: VariantType;
  name: string;
  description: string;
  config: Record<string, any>;
  isControl: boolean;
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'revenue' | 'engagement' | 'retention';
  goalValue?: number;
  isPrimary: boolean;
}

export interface TargetingRule {
  type: 'new-visitor' | 'returning-visitor' | 'customer-type' | 'location' | 'device';
  operator: 'equals' | 'contains' | 'greater-than' | 'less-than';
  value: string | number;
}

export interface TrafficAllocation {
  type: 'percentage' | 'manual';
  distribution: Record<VariantType, number>;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: VariantType;
  metrics: Record<VariantType, Record<string, MetricResult>>;
  statisticalSignificance: number;
  confidence: number;
  winner?: VariantType;
}

export interface MetricResult {
  value: number;
  improvement: number;
  sampleSize: number;
  conversions: number;
}

// Active Experiments
export const ACTIVE_EXPERIMENTS: Experiment[] = [
  {
    id: 'bundle-pricing-test',
    name: 'Bundle Pricing Optimization',
    type: 'pricing',
    description: 'Test different price points for Digital Transformation Bundle',
    hypothesis: 'Reducing bundle price by 10% will increase conversion rate by 25%',
    startDate: new Date(),
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'Original Price ($45,000)',
        description: 'Current pricing with $5,000 discount',
        config: {
          price: 45000,
          discount: 5000,
          displayPrice: '$45,000',
          savings: '$5,000',
        },
        isControl: true,
      },
      {
        id: 'variant-a',
        name: 'Reduced Price ($40,500)',
        description: '10% reduction with emphasized savings',
        config: {
          price: 40500,
          discount: 9500,
          displayPrice: '$40,500',
          savings: '$9,500',
          badge: 'Limited Time Offer',
        },
        isControl: false,
      },
      {
        id: 'variant-b',
        name: 'Tiered Pricing',
        description: 'Multiple pricing tiers based on features',
        config: {
          tiers: [
            { name: 'Essential', price: 35000, features: ['basic'] },
            { name: 'Professional', price: 45000, features: ['all'] },
            { name: 'Enterprise', price: 55000, features: ['all', 'priority'] },
          ],
        },
        isControl: false,
      },
    ],
    metrics: [
      {
        id: 'conversion-rate',
        name: 'Bundle Purchase Conversion Rate',
        type: 'conversion',
        goalValue: 0.15,
        isPrimary: true,
      },
      {
        id: 'revenue-per-visitor',
        name: 'Revenue Per Visitor',
        type: 'revenue',
        isPrimary: false,
      },
    ],
    trafficAllocation: {
      type: 'percentage',
      distribution: {
        'control': 34,
        'variant-a': 33,
        'variant-b': 33,
        'variant-c': 0,
      },
    },
  },
  {
    id: 'cross-sell-messaging',
    name: 'Cross-sell Message Optimization',
    type: 'messaging',
    description: 'Test different messaging for Unite → CARSI cross-sell',
    hypothesis: 'Emphasizing career growth will increase cross-sell rate by 20%',
    startDate: new Date(),
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'Feature-focused',
        description: 'Highlight course features and content',
        config: {
          headline: 'Enhance Your Skills with CARSI Training',
          subheadline: 'Industry-leading courses designed for professionals',
          cta: 'Explore Courses',
        },
        isControl: true,
      },
      {
        id: 'variant-a',
        name: 'Career-focused',
        description: 'Emphasize career advancement and growth',
        config: {
          headline: 'Accelerate Your Career Growth',
          subheadline: 'Join 10,000+ professionals who advanced their careers with CARSI',
          cta: 'Start Your Journey',
          testimonial: true,
        },
        isControl: false,
      },
      {
        id: 'variant-b',
        name: 'Urgency-focused',
        description: 'Create urgency with limited-time offers',
        config: {
          headline: 'Exclusive Offer for Unite Clients',
          subheadline: 'Save 20% on CARSI courses - Limited time only',
          cta: 'Claim Your Discount',
          countdown: true,
          discount: '20%',
        },
        isControl: false,
      },
    ],
    metrics: [
      {
        id: 'cross-sell-rate',
        name: 'Cross-sell Conversion Rate',
        type: 'conversion',
        goalValue: 0.30,
        isPrimary: true,
      },
      {
        id: 'click-through-rate',
        name: 'CTA Click-through Rate',
        type: 'engagement',
        isPrimary: false,
      },
    ],
    targeting: [
      {
        type: 'customer-type',
        operator: 'equals',
        value: 'unite-only',
      },
    ],
    trafficAllocation: {
      type: 'percentage',
      distribution: {
        'control': 34,
        'variant-a': 33,
        'variant-b': 33,
        'variant-c': 0,
      },
    },
  },
  {
    id: 'dashboard-layout-test',
    name: 'Unified Dashboard Layout Test',
    type: 'ui-layout',
    description: 'Test different layouts for the unified customer dashboard',
    hypothesis: 'A card-based layout will increase engagement by 15%',
    startDate: new Date(),
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'Tab-based Layout',
        description: 'Current tabbed interface',
        config: {
          layout: 'tabs',
          defaultTab: 'overview',
        },
        isControl: true,
      },
      {
        id: 'variant-a',
        name: 'Card-based Layout',
        description: 'Modern card-based interface with better visual hierarchy',
        config: {
          layout: 'cards',
          cardOrder: ['progress', 'recommendations', 'history'],
          animations: true,
        },
        isControl: false,
      },
    ],
    metrics: [
      {
        id: 'engagement-time',
        name: 'Dashboard Engagement Time',
        type: 'engagement',
        isPrimary: true,
      },
      {
        id: 'feature-adoption',
        name: 'Feature Adoption Rate',
        type: 'engagement',
        isPrimary: false,
      },
    ],
    trafficAllocation: {
      type: 'percentage',
      distribution: {
        'control': 50,
        'variant-a': 50,
        'variant-b': 0,
        'variant-c': 0,
      },
    },
  },
];

/**
 * Get experiment variant for user
 */
export async function getExperimentVariant(
  experimentId: string,
  userId?: string
): Promise<VariantAssignment | null> {
  try {
    const experiment = ACTIVE_EXPERIMENTS.find(e => e.id === experimentId && e.status === 'active');
    
    if (!experiment) {
      return null;
    }

    // Check if user meets targeting criteria
    if (experiment.targeting && userId) {
      const meetsTargeting = await checkTargeting(experiment.targeting, userId);
      if (!meetsTargeting) {
        return null;
      }
    }

    // Get or assign variant
    const cookieStore = await cookies();
    const assignmentCookie = cookieStore.get(`exp_${experimentId}`);
    
    if (assignmentCookie) {
      // Return existing assignment
      const assignment = JSON.parse(assignmentCookie.value) as VariantAssignment;
      return assignment;
    }

    // Assign new variant
    const variant = assignVariant(experiment);
    const assignment: VariantAssignment = {
      experimentId,
      variantId: variant.id,
      assignedAt: new Date(),
      userId,
    };

    // Store assignment in cookie
    cookieStore.set(
      `exp_${experimentId}`,
      JSON.stringify(assignment),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      }
    );

    // Record assignment in database
    if (userId) {
      await recordAssignment(assignment);
    }

    return assignment;
  } catch (error) {
    console.error('Error getting experiment variant:', error);
    return null;
  }
}

/**
 * Assign variant based on traffic allocation
 */
function assignVariant(experiment: Experiment): ExperimentVariant {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const [variantId, percentage] of Object.entries(experiment.trafficAllocation.distribution)) {
    cumulative += percentage;
    if (random <= cumulative) {
      const variant = experiment.variants.find(v => v.id === variantId);
      if (variant) {
        return variant;
      }
    }
  }

  // Fallback to control
  return experiment.variants.find(v => v.isControl)!;
}

/**
 * Check if user meets targeting criteria
 */
async function checkTargeting(rules: TargetingRule[], userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!customer) {
      return false;
    }

    // Check each rule
    for (const rule of rules) {
      let meets = false;
      
      switch (rule.type) {
        case 'customer-type':
          if (rule.value === 'unite-only') {
            meets = !customer.has_carsi_account;
          } else if (rule.value === 'carsi-only') {
            meets = !customer.has_unite_services;
          } else if (rule.value === 'both') {
            meets = customer.has_carsi_account && customer.has_unite_services;
          }
          break;
          
        case 'new-visitor':
          meets = customer.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
          
        case 'returning-visitor':
          meets = customer.created_at <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
      }

      if (!meets) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking targeting:', error);
    return false;
  }
}

/**
 * Record experiment assignment
 */
async function recordAssignment(assignment: VariantAssignment): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase.from('experiment_assignments').insert({
      experiment_id: assignment.experimentId,
      variant_id: assignment.variantId,
      user_id: assignment.userId,
      assigned_at: assignment.assignedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error recording assignment:', error);
  }
}

/**
 * Track experiment conversion
 */
export async function trackConversion(
  experimentId: string,
  metricId: string,
  value: number = 1,
  userId?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get user's variant assignment
    const cookieStore = await cookies();
    const assignmentCookie = cookieStore.get(`exp_${experimentId}`);
    
    if (!assignmentCookie) {
      return;
    }

    const assignment = JSON.parse(assignmentCookie.value) as VariantAssignment;
    
    // Record conversion
    await supabase.from('experiment_conversions').insert({
      experiment_id: experimentId,
      variant_id: assignment.variantId,
      metric_id: metricId,
      user_id: userId || assignment.userId,
      value,
      converted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}

/**
 * Get experiment results
 */
export async function getExperimentResults(experimentId: string): Promise<ExperimentResult | null> {
  try {
    const supabase = await createClient();
    const experiment = ACTIVE_EXPERIMENTS.find(e => e.id === experimentId);
    
    if (!experiment) {
      return null;
    }

    const results: Record<VariantType, Record<string, MetricResult>> = {
      'control': {},
      'variant-a': {},
      'variant-b': {},
      'variant-c': {},
    };

    // Get assignments and conversions for each variant
    for (const variant of experiment.variants) {
      // Get assignment count
      const { count: assignmentCount } = await supabase
        .from('experiment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('experiment_id', experimentId)
        .eq('variant_id', variant.id);

      // Get conversions for each metric
      for (const metric of experiment.metrics) {
        const { data: conversions } = await supabase
          .from('experiment_conversions')
          .select('value')
          .eq('experiment_id', experimentId)
          .eq('variant_id', variant.id)
          .eq('metric_id', metric.id);

        const conversionCount = conversions?.length || 0;
        const totalValue = conversions?.reduce((sum, c) => sum + c.value, 0) || 0;
        const conversionRate = assignmentCount ? conversionCount / assignmentCount : 0;

        // Calculate improvement over control
        let improvement = 0;
        if (variant.isControl) {
          improvement = 0;
        } else if (results['control'][metric.id]) {
          const controlRate = results['control'][metric.id].value;
          improvement = controlRate > 0 ? ((conversionRate - controlRate) / controlRate) * 100 : 0;
        }

        results[variant.id][metric.id] = {
          value: metric.type === 'revenue' ? totalValue / (assignmentCount || 1) : conversionRate,
          improvement,
          sampleSize: assignmentCount || 0,
          conversions: conversionCount,
        };
      }
    }

    // Calculate statistical significance
    const primaryMetric = experiment.metrics.find(m => m.isPrimary);
    let winner: VariantType | undefined;
    let highestSignificance = 0;

    if (primaryMetric) {
      // Compare each variant against control
      for (const variant of experiment.variants.filter(v => !v.isControl)) {
        const significance = calculateSignificance(
          results['control'][primaryMetric.id],
          results[variant.id][primaryMetric.id]
        );

        if (significance > highestSignificance && significance >= 0.95) {
          highestSignificance = significance;
          winner = variant.id;
        }
      }
    }

    return {
      experimentId,
      variantId: 'control', // Default view
      metrics: results,
      statisticalSignificance: highestSignificance,
      confidence: highestSignificance,
      winner,
    };
  } catch (error) {
    console.error('Error getting experiment results:', error);
    return null;
  }
}

/**
 * Calculate statistical significance using z-test
 */
function calculateSignificance(control: MetricResult, variant: MetricResult): number {
  if (!control.sampleSize || !variant.sampleSize) {
    return 0;
  }

  const p1 = control.value;
  const p2 = variant.value;
  const n1 = control.sampleSize;
  const n2 = variant.sampleSize;

  const pooledP = (control.conversions + variant.conversions) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
  
  if (se === 0) return 0;
  
  const z = Math.abs((p2 - p1) / se);
  
  // Convert z-score to confidence level
  // Approximate confidence levels
  if (z >= 2.58) return 0.99; // 99% confidence
  if (z >= 1.96) return 0.95; // 95% confidence
  if (z >= 1.64) return 0.90; // 90% confidence
  
  return z / 2.58; // Return as percentage of 99% confidence
}

// Type definitions
export interface VariantAssignment {
  experimentId: string;
  variantId: VariantType;
  assignedAt: Date;
  userId?: string;
}

/**
 * React hook for using experiments
 */
export function useExperiment(experimentId: string): {
  variant: VariantType | null;
  config: Record<string, any> | null;
  trackConversion: (metricId: string, value?: number) => void;
} {
  // This would be implemented as a client-side hook
  // For now, return a placeholder
  return {
    variant: null,
    config: null,
    trackConversion: () => {},
  };
}
