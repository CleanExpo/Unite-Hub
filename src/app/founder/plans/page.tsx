'use client';

/**
 * Plans & Pricing Console
 * Phase: D65 - Plans, Pricing & Quota Enforcement
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Users, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface Plan {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  billing_interval: string;
  currency: string;
  base_price: number;
  is_active: boolean;
}

interface PlanFeature {
  id: string;
  feature_key: string;
  name: string;
  limit_value?: number;
  limit_unit?: string;
  soft_limit: boolean;
}

interface QuotaSnapshot {
  id: string;
  feature_key: string;
  used_value: number;
  limit_value?: number;
  limit_unit?: string;
  status: string;
  period_start: string;
}

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'quotas'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [quotas, setQuotas] = useState<QuotaSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    } else {
      fetchQuotas();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedPlan) {
      fetchFeatures(selectedPlan);
    }
  }, [selectedPlan]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/plans?limit=50');
      const data = await response.json();
      if (response.ok) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async (planId: string) => {
    try {
      const response = await fetch(`/api/unite/plans?action=list_features&plan_id=${planId}`);
      const data = await response.json();
      if (response.ok) {
        setFeatures(data.features || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuotas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/quota/check?action=list&limit=30');
      const data = await response.json();
      if (response.ok) {
        setQuotas(data.snapshots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ok: 'bg-green-500',
      warning: 'bg-yellow-500',
      exceeded: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Package className="w-10 h-10 text-accent-500" />
            Plans & Pricing
          </h1>
          <p className="text-text-secondary">Manage pricing tiers and quota enforcement</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'plans', label: 'Plans', icon: Package },
            { key: 'quotas', label: 'Quota Usage', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === key
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Package className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No plans configured</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plans Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-6 bg-bg-card rounded-lg border ${
                        selectedPlan === plan.id ? 'border-accent-500' : 'border-border-primary'
                      } hover:border-accent-500 transition-all cursor-pointer`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                          <p className="text-sm text-text-tertiary mt-1">{plan.category}</p>
                        </div>
                        {plan.is_active ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-500" />
                        )}
                      </div>

                      {plan.description && (
                        <p className="text-sm text-text-secondary mb-4">{plan.description}</p>
                      )}

                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-accent-500">
                          ${plan.base_price.toFixed(2)}
                        </span>
                        <span className="text-sm text-text-tertiary">
                          {plan.currency}/{plan.billing_interval}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Features Panel */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Plan Features</h3>
                  {!selectedPlan ? (
                    <p className="text-sm text-text-tertiary">Select a plan to view features</p>
                  ) : features.length === 0 ? (
                    <p className="text-sm text-text-tertiary">No features configured</p>
                  ) : (
                    <div className="space-y-3">
                      {features.map((feature) => (
                        <div key={feature.id} className="p-3 bg-bg-tertiary rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-text-primary">
                              {feature.name}
                            </span>
                            {feature.soft_limit && (
                              <span className="text-xs text-blue-400">soft</span>
                            )}
                          </div>
                          {feature.limit_value !== null && feature.limit_value !== undefined && (
                            <div className="text-xs text-text-secondary">
                              Limit: {feature.limit_value} {feature.limit_unit}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quotas Tab */}
        {activeTab === 'quotas' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading quota usage...</div>
            ) : quotas.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Users className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No quota snapshots available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quotas.map((quota) => {
                  const usagePercent = quota.limit_value
                    ? (quota.used_value / quota.limit_value) * 100
                    : 0;

                  return (
                    <div
                      key={quota.id}
                      className="p-5 bg-bg-card rounded-lg border border-border-primary"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {quota.feature_key}
                          </h3>
                          <p className="text-xs text-text-tertiary mt-1">
                            Period: {quota.period_start}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(quota.status)}`} />
                          <span className="text-sm text-text-secondary">{quota.status}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Usage:</span>
                          <span className="text-text-primary font-medium">
                            {quota.used_value.toFixed(0)} / {quota.limit_value || '∞'}{' '}
                            {quota.limit_unit}
                          </span>
                        </div>

                        {quota.limit_value && (
                          <div>
                            <div className="flex items-center justify-between text-xs text-text-tertiary mb-1">
                              <span>{usagePercent.toFixed(1)}% used</span>
                            </div>
                            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  quota.status === 'exceeded'
                                    ? 'bg-red-500'
                                    : quota.status === 'warning'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, usagePercent)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {quota.status === 'exceeded' && (
                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                          <span className="text-xs text-red-400">Quota exceeded</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
