/**
 * BillingEngine
 * Phase 12 Week 5-6: Enterprise billing, plan management, and subscription lifecycle
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused' | 'expired';
export type BillingCycle = 'monthly' | 'yearly';

export interface BillingPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  tier: PlanTier;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_workspaces: number;
  max_users_per_workspace: number;
  max_contacts: number;
  max_emails_per_month: number;
  max_ai_requests_per_month: number;
  max_storage_gb: number;
  max_campaigns: number;
  max_reports_per_month: number;
  features: string[];
}

export interface Subscription {
  id: string;
  org_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  canceled_at?: string;
  cancel_at_period_end: boolean;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: BillingPlan;
}

export interface PlanChangeResult {
  success: boolean;
  subscription?: Subscription;
  prorated_amount?: number;
  effective_date: string;
  message: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  invoice_number: string;
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'void' | 'refunded';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  invoice_date: string;
  due_date?: string;
  paid_at?: string;
  line_items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export class BillingEngine {
  /**
   * Get all available billing plans
   */
  async getPlans(): Promise<BillingPlan[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching plans:', error);
      throw new Error('Failed to fetch billing plans');
    }

    return data || [];
  }

  /**
   * Get a specific plan by ID or name
   */
  async getPlan(identifier: string): Promise<BillingPlan | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .or(`id.eq.${identifier},name.eq.${identifier}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
return null;
}
      console.error('Error fetching plan:', error);
      throw new Error('Failed to fetch plan');
    }

    return data;
  }

  /**
   * Get organization's current subscription
   */
  async getSubscription(orgId: string): Promise<SubscriptionWithPlan | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:billing_plans(*)
      `)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
return null;
}
      console.error('Error fetching subscription:', error);
      throw new Error('Failed to fetch subscription');
    }

    return data;
  }

  /**
   * Create a new subscription for an organization
   */
  async createSubscription(
    orgId: string,
    planId: string,
    billingCycle: BillingCycle = 'monthly',
    trialDays: number = 0
  ): Promise<Subscription> {
    const supabase = await getSupabaseServer();

    const now = new Date();
    const periodEnd = new Date(now);

    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscriptionData: any = {
      org_id: orgId,
      plan_id: planId,
      status: trialDays > 0 ? 'trialing' : 'active',
      billing_cycle: billingCycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    };

    if (trialDays > 0) {
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + trialDays);
      subscriptionData.trial_start = now.toISOString();
      subscriptionData.trial_end = trialEnd.toISOString();
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }

    return data;
  }

  /**
   * Change subscription plan (upgrade or downgrade)
   */
  async changePlan(
    orgId: string,
    newPlanId: string,
    immediate: boolean = true
  ): Promise<PlanChangeResult> {
    const supabase = await getSupabaseServer();

    // Get current subscription
    const currentSub = await this.getSubscription(orgId);
    if (!currentSub) {
      return {
        success: false,
        effective_date: new Date().toISOString(),
        message: 'No active subscription found',
      };
    }

    // Get new plan
    const newPlan = await this.getPlan(newPlanId);
    if (!newPlan) {
      return {
        success: false,
        effective_date: new Date().toISOString(),
        message: 'Invalid plan selected',
      };
    }

    // Calculate proration if immediate
    let proratedAmount = 0;
    const now = new Date();
    const effectiveDate = immediate ? now : new Date(currentSub.current_period_end);

    if (immediate && currentSub.plan) {
      proratedAmount = this.calculateProration(
        currentSub.plan,
        newPlan,
        currentSub.billing_cycle,
        new Date(currentSub.current_period_start),
        new Date(currentSub.current_period_end),
        now
      );
    }

    // Update subscription
    const updateData: any = {
      plan_id: newPlanId,
      updated_at: now.toISOString(),
    };

    if (immediate) {
      // Reset period for upgrades
      const periodEnd = new Date(now);
      if (currentSub.billing_cycle === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }
      updateData.current_period_start = now.toISOString();
      updateData.current_period_end = periodEnd.toISOString();
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', currentSub.id)
      .select()
      .single();

    if (error) {
      console.error('Error changing plan:', error);
      return {
        success: false,
        effective_date: effectiveDate.toISOString(),
        message: 'Failed to change plan',
      };
    }

    return {
      success: true,
      subscription: data,
      prorated_amount: proratedAmount,
      effective_date: effectiveDate.toISOString(),
      message: `Successfully ${this.isUpgrade(currentSub.plan, newPlan) ? 'upgraded' : 'downgraded'} to ${newPlan.display_name}`,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    orgId: string,
    immediate: boolean = false
  ): Promise<{ success: boolean; effective_date: string; message: string }> {
    const supabase = await getSupabaseServer();

    const currentSub = await this.getSubscription(orgId);
    if (!currentSub) {
      return {
        success: false,
        effective_date: new Date().toISOString(),
        message: 'No active subscription found',
      };
    }

    const now = new Date();
    const effectiveDate = immediate ? now : new Date(currentSub.current_period_end);

    const updateData: any = {
      canceled_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (immediate) {
      updateData.status = 'canceled';
    } else {
      updateData.cancel_at_period_end = true;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', currentSub.id);

    if (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        effective_date: effectiveDate.toISOString(),
        message: 'Failed to cancel subscription',
      };
    }

    return {
      success: true,
      effective_date: effectiveDate.toISOString(),
      message: immediate
        ? 'Subscription canceled immediately'
        : `Subscription will be canceled on ${effectiveDate.toLocaleDateString()}`,
    };
  }

  /**
   * Renew subscription for next period
   */
  async renewSubscription(orgId: string): Promise<Subscription> {
    const supabase = await getSupabaseServer();

    const currentSub = await this.getSubscription(orgId);
    if (!currentSub) {
      throw new Error('No subscription found');
    }

    const now = new Date(currentSub.current_period_end);
    const periodEnd = new Date(now);

    if (currentSub.billing_cycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSub.id)
      .select()
      .single();

    if (error) {
      console.error('Error renewing subscription:', error);
      throw new Error('Failed to renew subscription');
    }

    return data;
  }

  /**
   * Get organization's invoices
   */
  async getInvoices(orgId: string, limit: number = 10): Promise<Invoice[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('invoice_history')
      .select('*')
      .eq('org_id', orgId)
      .order('invoice_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices');
    }

    return data || [];
  }

  /**
   * Create an invoice
   */
  async createInvoice(
    orgId: string,
    lineItems: InvoiceLineItem[],
    tax: number = 0,
    discount: number = 0
  ): Promise<Invoice> {
    const supabase = await getSupabaseServer();

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal + tax - discount;

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');

    const { data, error } = await supabase
      .from('invoice_history')
      .insert({
        org_id: orgId,
        invoice_number: invoiceNumber,
        status: 'pending',
        subtotal,
        tax,
        discount,
        total,
        line_items: lineItems,
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }

    return data;
  }

  /**
   * Check if organization has feature access
   */
  async hasFeature(orgId: string, feature: string): Promise<boolean> {
    const subscription = await this.getSubscription(orgId);
    if (!subscription || !subscription.plan) {
return false;
}

    return subscription.plan.features.includes(feature);
  }

  /**
   * Get plan limits for organization
   */
  async getPlanLimits(orgId: string): Promise<{
    workspaces: number;
    users: number;
    contacts: number;
    emails: number;
    ai_requests: number;
    storage_gb: number;
    campaigns: number;
    reports: number;
  } | null> {
    const subscription = await this.getSubscription(orgId);
    if (!subscription || !subscription.plan) {
return null;
}

    const plan = subscription.plan;
    return {
      workspaces: plan.max_workspaces,
      users: plan.max_users_per_workspace,
      contacts: plan.max_contacts,
      emails: plan.max_emails_per_month,
      ai_requests: plan.max_ai_requests_per_month,
      storage_gb: plan.max_storage_gb,
      campaigns: plan.max_campaigns,
      reports: plan.max_reports_per_month,
    };
  }

  // Private helper methods

  private calculateProration(
    oldPlan: BillingPlan,
    newPlan: BillingPlan,
    cycle: BillingCycle,
    periodStart: Date,
    periodEnd: Date,
    changeDate: Date
  ): number {
    const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = (periodEnd.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24);
    const usedDays = totalDays - remainingDays;

    const oldPrice = cycle === 'monthly' ? oldPlan.price_monthly : oldPlan.price_yearly / 12;
    const newPrice = cycle === 'monthly' ? newPlan.price_monthly : newPlan.price_yearly / 12;

    // Credit for unused time on old plan
    const credit = (oldPrice / totalDays) * remainingDays;

    // Charge for new plan remaining time
    const charge = (newPrice / totalDays) * remainingDays;

    return Math.round((charge - credit) * 100) / 100;
  }

  private isUpgrade(oldPlan: BillingPlan, newPlan: BillingPlan): boolean {
    const tierOrder: PlanTier[] = ['free', 'starter', 'professional', 'enterprise', 'custom'];
    return tierOrder.indexOf(newPlan.tier) > tierOrder.indexOf(oldPlan.tier);
  }
}

// Export singleton instance
export const billingEngine = new BillingEngine();
