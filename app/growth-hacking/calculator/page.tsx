'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, ArrowRight, TrendingUp, Users, DollarSign } from 'lucide-react';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export default function GrowthCalculatorPage() {
  const [inputs, setInputs] = useState({
    monthlyVisitors: 10000,
    conversionRate: 2.5,
    averageOrderValue: 50,
    customerLifetimeValue: 150,
    viralCoefficient: 0.5,
    retentionRate: 80,
    currentCac: 25
  });

  const [results, setResults] = useState({
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    viralGrowth: 0,
    ltv: 0,
    ltvCacRatio: 0,
    growthRate: 0,
    paybackPeriod: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, [inputs]);

  const calculateMetrics = () => {
    const monthlyCustomers = (inputs.monthlyVisitors * inputs.conversionRate) / 100;
    const monthlyRevenue = monthlyCustomers * inputs.averageOrderValue;
    const yearlyRevenue = monthlyRevenue * 12;
    
    // Viral growth calculation
    const viralCustomers = monthlyCustomers * inputs.viralCoefficient;
    const viralGrowth = (viralCustomers / monthlyCustomers) * 100;
    
    // LTV/CAC ratio
    const ltvCacRatio = inputs.customerLifetimeValue / inputs.currentCac;
    
    // Growth rate (simplified)
    const baseGrowthRate = (monthlyCustomers / inputs.monthlyVisitors) * 100;
    const viralMultiplier = 1 + (inputs.viralCoefficient * 0.5);
    const retentionMultiplier = inputs.retentionRate / 100;
    const growthRate = baseGrowthRate * viralMultiplier * retentionMultiplier;
    
    // Payback period in months
    const monthlyValue = inputs.averageOrderValue * (inputs.retentionRate / 100);
    const paybackPeriod = inputs.currentCac / monthlyValue;

    setResults({
      monthlyRevenue: Math.round(monthlyRevenue),
      yearlyRevenue: Math.round(yearlyRevenue),
      viralGrowth: Math.round(viralGrowth * 10) / 10,
      ltv: inputs.customerLifetimeValue,
      ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
      growthRate: Math.round(growthRate * 10) / 10,
      paybackPeriod: Math.round(paybackPeriod * 10) / 10
    });
  };

  const handleInputChange = (field: string, value: number) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getScoreColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) {return 'text-green-600';}
    if (value >= thresholds.warning) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Calculator className="w-16 h-16 text-purple-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Growth Hacking Calculator
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Calculate your growth potential and identify optimization opportunities 
            with our comprehensive growth metrics calculator.
          </p>
        </div>
      </section>

      {/* Author Info */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AuthorInfo 
            author={AUTHORS.emmRodriguez} 
            publishDate="January 15, 2025"
            readTime="4"
          />
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Input Your Metrics</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Website Visitors
                  </label>
                  <input
                    type="number"
                    value={inputs.monthlyVisitors}
                    onChange={(e) => handleInputChange('monthlyVisitors', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversion Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.conversionRate}
                    onChange={(e) => handleInputChange('conversionRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average Order Value ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.averageOrderValue}
                    onChange={(e) => handleInputChange('averageOrderValue', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Lifetime Value ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.customerLifetimeValue}
                    onChange={(e) => handleInputChange('customerLifetimeValue', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Viral Coefficient
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.viralCoefficient}
                    onChange={(e) => handleInputChange('viralCoefficient', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.5"
                  />
                  <p className="text-sm text-gray-500 mt-1">Average referrals per customer</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Retention Rate (%)
                  </label>
                  <input
                    type="number"
                    value={inputs.retentionRate}
                    onChange={(e) => handleInputChange('retentionRate', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="80"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Customer Acquisition Cost ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentCac}
                    onChange={(e) => handleInputChange('currentCac', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Growth Metrics</h2>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-semibold">Revenue Projections</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(results.monthlyRevenue)}</div>
                      <div className="text-green-100 text-sm">Monthly Revenue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(results.yearlyRevenue)}</div>
                      <div className="text-green-100 text-sm">Yearly Revenue</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
                  <div className="flex items-center mb-2">
                    <Users className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-semibold">Viral Growth</h3>
                  </div>
                  <div className="text-2xl font-bold">{results.viralGrowth}%</div>
                  <div className="text-purple-100 text-sm">Additional growth from referrals</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className={`text-xl font-bold ${getScoreColor(results.ltvCacRatio, { good: 3, warning: 2 })}`}>
                      {results.ltvCacRatio}:1
                    </div>
                    <div className="text-gray-600 text-sm">LTV:CAC Ratio</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className={`text-xl font-bold ${getScoreColor(results.paybackPeriod, { good: 0, warning: 6 })}`}>
                      {results.paybackPeriod}
                    </div>
                    <div className="text-gray-600 text-sm">Payback Period (months)</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-semibold">Overall Growth Score</h3>
                  </div>
                  <div className="text-3xl font-bold">{results.growthRate}%</div>
                  <div className="text-blue-100 text-sm">Composite growth potential</div>
                </div>

                {/* Recommendations */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Optimization Recommendations</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {results.ltvCacRatio < 3 && (
                      <li>• Focus on increasing LTV or reducing CAC for better unit economics</li>
                    )}
                    {inputs.viralCoefficient < 1 && (
                      <li>• Implement referral programs to improve viral growth</li>
                    )}
                    {inputs.conversionRate < 3 && (
                      <li>• Optimize conversion funnel to improve conversion rates</li>
                    )}
                    {inputs.retentionRate < 85 && (
                      <li>• Improve retention strategies to increase customer lifetime value</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmarks Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Industry Benchmarks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">E-commerce</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Conversion Rate: 2-3%</li>
                <li>LTV:CAC: 3:1</li>
                <li>Viral Coefficient: 0.5-1.5</li>
              </ul>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SaaS</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Conversion Rate: 1-3%</li>
                <li>LTV:CAC: 3-5:1</li>
                <li>Viral Coefficient: 0.2-0.8</li>
              </ul>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile Apps</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Conversion Rate: 0.5-2%</li>
                <li>LTV:CAC: 2-4:1</li>
                <li>Viral Coefficient: 0.8-2.0</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Want to Improve These Metrics?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Get expert help optimizing your growth funnel and implementing proven strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=growth-optimization"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              Get Growth Consultation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/growth-hacking"
              className="border border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              View Our Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}