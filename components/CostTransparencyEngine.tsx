'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Check, X, DollarSign, Zap, Package, PlusCircle, MinusCircle } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  setupTime: string;
  category: 'essential' | 'growth' | 'enterprise';
  included: string[];
  savings?: number;
}

const features: Feature[] = [
  {
    id: 'website-builder',
    name: 'Website Builder',
    description: 'Drag-and-drop website creation with 100+ templates',
    basePrice: 29,
    setupTime: '10 minutes',
    category: 'essential',
    included: ['Custom domain', 'SSL certificate', 'Mobile responsive', '5GB storage'],
    savings: 500
  },
  {
    id: 'seo-automation',
    name: 'SEO Automation',
    description: 'AI-powered SEO optimization and content suggestions',
    basePrice: 49,
    setupTime: '15 minutes',
    category: 'growth',
    included: ['Keyword research', 'Meta optimization', 'Site audits', 'Competitor analysis'],
    savings: 800
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing Suite',
    description: 'Complete email automation and campaign management',
    basePrice: 39,
    setupTime: '5 minutes',
    category: 'growth',
    included: ['10,000 emails/month', 'Automation workflows', 'A/B testing', 'Analytics'],
    savings: 600
  },
  {
    id: 'crm-system',
    name: 'CRM System',
    description: 'Customer relationship management with pipeline tracking',
    basePrice: 59,
    setupTime: '20 minutes',
    category: 'enterprise',
    included: ['Unlimited contacts', 'Deal tracking', 'Task automation', 'Team collaboration'],
    savings: 1200
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Real-time business intelligence and reporting',
    basePrice: 35,
    setupTime: '5 minutes',
    category: 'essential',
    included: ['Custom dashboards', 'Goal tracking', 'Conversion funnels', 'Export reports'],
    savings: 400
  },
  {
    id: 'social-media',
    name: 'Social Media Manager',
    description: 'Schedule and manage all social channels from one place',
    basePrice: 45,
    setupTime: '10 minutes',
    category: 'growth',
    included: ['5 social accounts', 'Content calendar', 'Auto-posting', 'Engagement tracking'],
    savings: 700
  }
];

export default function CostTransparencyEngine() {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const calculateTotal = () => {
    const monthlyTotal = selectedFeatures.reduce((total, id) => {
      const feature = features.find(f => f.id === id);
      return total + (feature?.basePrice || 0);
    }, 0);

    const yearlyTotal = monthlyTotal * 12 * 0.8; // 20% yearly discount
    return billingCycle === 'monthly' ? monthlyTotal : yearlyTotal / 12;
  };

  const calculateSavings = () => {
    return selectedFeatures.reduce((total, id) => {
      const feature = features.find(f => f.id === id);
      return total + (feature?.savings || 0);
    }, 0);
  };

  const calculateSetupTime = () => {
    const minutes = selectedFeatures.reduce((total, id) => {
      const feature = features.find(f => f.id === id);
      const time = feature?.setupTime.match(/\\d+/)?.[0] || '0';
      return total + parseInt(time);
    }, 0);

    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const total = calculateTotal();
  const savings = calculateSavings();
  const setupTime = calculateSetupTime();

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Build Your Perfect Package
          </h2>
          <p className="text-lg text-gray-600">
            Select only what you need. See the price instantly. No surprises.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Features Selection */}
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature) => (
                <motion.div
                  key={feature.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white rounded-xl p-4 cursor-pointer transition-all border-2 ${
                    selectedFeatures.includes(feature.id)
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleFeature(feature.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                        feature.category === 'essential' ? 'bg-green-100 text-green-700' :
                        feature.category === 'growth' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {feature.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-gray-900">
                        ${feature.basePrice}
                        <span className="text-sm font-normal text-gray-500">/mo</span>
                      </div>
                      <div className="text-xs text-green-600">
                        Setup: {feature.setupTime}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>

                  <div className="space-y-1">
                    {feature.included.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center text-xs text-gray-500">
                        <Check className="w-3 h-3 mr-1 text-green-500" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Save ${feature.savings}/mo vs agencies
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedFeatures.includes(feature.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedFeatures.includes(feature.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg sticky top-4">
              <h3 className="font-bold text-xl mb-4 text-gray-900">Your Investment</h3>

              {/* Selected Features List */}
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {selectedFeatures.length === 0 ? (
                  <p className="text-gray-500 text-sm">Select features to see pricing</p>
                ) : (
                  selectedFeatures.map(id => {
                    const feature = features.find(f => f.id === id);
                    return feature ? (
                      <div key={id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{feature.name}</span>
                        <span className="font-medium">
                          ${billingCycle === 'monthly' ? feature.basePrice : Math.round(feature.basePrice * 0.8)}
                        </span>
                      </div>
                    ) : null;
                  })
                )}
              </div>

              <div className="border-t pt-4">
                {/* Total Price */}
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Total per month</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${Math.round(total)}
                    </p>
                    {billingCycle === 'yearly' && (
                      <p className="text-xs text-green-600">
                        Billed ${Math.round(total * 12)} yearly
                      </p>
                    )}
                  </div>
                  {selectedFeatures.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Setup time</p>
                      <p className="text-sm font-semibold text-green-600">
                        <Zap className="w-4 h-4 inline mr-1" />
                        {setupTime}
                      </p>
                    </div>
                  )}
                </div>

                {/* Savings */}
                {savings > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800">
                      You save <span className="font-bold">${savings}/month</span> compared to traditional agencies
                    </p>
                  </div>
                )}

                {/* CTA Buttons */}
                <button 
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-2"
                  disabled={selectedFeatures.length === 0}
                >
                  Start Building Now
                </button>

                <button 
                  onClick={() => setShowComparison(!showComparison)}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  {showComparison ? 'Hide' : 'Show'} Agency Comparison
                </button>
              </div>

              {/* Comparison */}
              <AnimatePresence>
                {showComparison && selectedFeatures.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t"
                  >
                    <h4 className="font-semibold text-sm mb-2">Traditional Agency Cost</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Monthly retainer</span>
                        <span className="line-through">${total + savings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Setup time</span>
                        <span className="line-through">2-4 weeks</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contract lock-in</span>
                        <span className="line-through">12 months</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-1" />
            No setup fees
          </div>
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-1" />
            Cancel anytime
          </div>
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-1" />
            14-day money back
          </div>
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-1" />
            24/7 support included
          </div>
        </div>
      </div>
    </div>
  );
}