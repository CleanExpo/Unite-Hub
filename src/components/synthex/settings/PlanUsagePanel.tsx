'use client';

/**
 * Synthex Plan & Usage Panel
 * Displays current subscription plan, features, and usage metrics
 * Phase B22: Synthex Billing Foundation
 */

import React, { useState, useEffect } from 'react';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Mail,
  Users,
  Zap,
  Target,
  Workflow,
  UserPlus,
  CreditCard,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface SynthexPlan {
  id: string;
  code: 'FREE' | 'PRO' | 'AGENCY';
  name: string;
  description: string | null;
  monthly_price_cents: number;
  yearly_price_cents: number;
  features: string[];
  limits: {
    max_contacts: number;
    max_sends_per_month: number;
    max_ai_calls: number;
    max_campaigns: number;
    max_automations: number;
    max_team_members: number;
  };
}

interface SynthexSubscription {
  id: string;
  tenant_id: string;
  plan_id: string | null;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'paused';
  billing_period: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  plan?: SynthexPlan;
}

interface UsageSummary {
  metric: string;
  current: number;
  limit: number;
  percentage: number;
  unlimited: boolean;
}

const metricIcons: Record<string, React.ReactNode> = {
  emails_sent: <Mail className="w-4 h-4" />,
  contacts: <Users className="w-4 h-4" />,
  ai_calls: <Zap className="w-4 h-4" />,
  campaigns: <Target className="w-4 h-4" />,
  automations: <Workflow className="w-4 h-4" />,
  team_members: <UserPlus className="w-4 h-4" />,
};

const metricNames: Record<string, string> = {
  emails_sent: 'Emails Sent',
  contacts: 'Contacts',
  ai_calls: 'AI Calls',
  campaigns: 'Campaigns',
  automations: 'Automations',
  team_members: 'Team Members',
};

export default function PlanUsagePanel() {
  const { currentTenant } = useSynthexTenant();
  const [subscription, setSubscription] = useState<SynthexSubscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SynthexPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentTenant?.id) {
      loadData();
    }
  }, [currentTenant]);

  const loadData = async () => {
    if (!currentTenant?.id) {
return;
}

    try {
      setLoading(true);
      setError(null);

      // Load subscription
      const subRes = await fetch(`/api/synthex/subscription?tenantId=${currentTenant.id}`);
      const subData = await subRes.json();
      if (subData.success) {
        setSubscription(subData.subscription);
      }

      // Load usage
      const usageRes = await fetch(`/api/synthex/usage/summary?tenantId=${currentTenant.id}`);
      const usageData = await usageRes.json();
      if (usageData.success) {
        setUsage(usageData.usage);
      }

      // Load available plans
      const plansRes = await fetch('/api/synthex/plans');
      const plansData = await plansRes.json();
      if (plansData.success) {
        setAvailablePlans(plansData.plans);
      }
    } catch (err) {
      console.error('Error loading plan data:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      trial: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      past_due: 'bg-red-500/20 text-red-300 border-red-500/30',
      canceled: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      paused: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          statusColors[status] || statusColors.active
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) {
return 'bg-red-500';
}
    if (percentage >= 75) {
return 'bg-yellow-500';
}
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-300">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!subscription?.plan) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400">No subscription found</p>
      </div>
    );
  }

  const currentPlan = subscription.plan;

  return (
    <div className="space-y-6">
      {/* Current Plan Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{currentPlan.name}</h2>
              <p className="text-gray-400">{currentPlan.description}</p>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Billing</span>
              </div>
              <p className="text-xl font-bold text-white">
                {currentPlan.code === 'FREE'
                  ? 'Free Forever'
                  : `${formatPrice(
                      subscription.billing_period === 'monthly'
                        ? currentPlan.monthly_price_cents
                        : currentPlan.yearly_price_cents
                    )}/${subscription.billing_period === 'monthly' ? 'mo' : 'yr'}`}
              </p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Current Period</span>
              </div>
              <p className="text-sm font-medium text-white">
                {formatDate(subscription.current_period_start)}
              </p>
              <p className="text-xs text-gray-400">
                Renews {formatDate(subscription.current_period_end)}
              </p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Plan Type</span>
              </div>
              <p className="text-xl font-bold text-white">{currentPlan.code}</p>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              Plan Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Usage This Month</h3>
        <div className="space-y-4">
          {usage.map((item) => (
            <div key={item.metric} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-gray-400">{metricIcons[item.metric]}</div>
                  <span className="text-sm font-medium text-white">
                    {metricNames[item.metric]}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {item.unlimited ? (
                    <>
                      {item.current.toLocaleString()} <span className="text-gray-500">/ Unlimited</span>
                    </>
                  ) : (
                    <>
                      {item.current.toLocaleString()} / {item.limit.toLocaleString()}
                    </>
                  )}
                </span>
              </div>
              {!item.unlimited && (
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getUsageColor(
                      item.percentage
                    )}`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA (if on FREE plan) */}
      {currentPlan.code === 'FREE' && (
        <div className="bg-gradient-to-r from-accent-500/20 to-accent-600/20 border border-accent-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Ready to grow?
          </h3>
          <p className="text-gray-300 mb-4">
            Upgrade to Pro or Agency plan for unlimited contacts, more emails, and advanced features.
          </p>
          <button className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            View Plans
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Plan Comparison (Show other plans) */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 ${
                plan.code === currentPlan.code
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-gray-700 bg-gray-950'
              }`}
            >
              <div className="mb-3">
                <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                <p className="text-2xl font-bold text-accent-500 mt-2">
                  {plan.code === 'FREE'
                    ? 'Free'
                    : formatPrice(plan.monthly_price_cents)}
                  {plan.code !== 'FREE' && (
                    <span className="text-sm text-gray-400">/month</span>
                  )}
                </p>
              </div>
              <ul className="space-y-2 mb-4">
                {plan.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.code !== currentPlan.code && (
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {plan.code === 'FREE' ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
              {plan.code === currentPlan.code && (
                <div className="w-full text-center py-2 text-sm font-medium text-accent-500">
                  Current Plan
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
