'use client';

import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Target, BarChart3, CheckCircle, ArrowRight, PieChart } from 'lucide-react';
import { useState } from 'react';

const roiMetrics = [
  {
    title: 'Return on Ad Spend (ROAS)',
    description: 'Revenue generated for every dollar spent on advertising',
    formula: 'Revenue ÷ Ad Spend',
    goodBenchmark: '4:1 or higher',
    icon: TrendingUp
  },
  {
    title: 'Cost Per Acquisition (CPA)',
    description: 'Total cost to acquire one customer',
    formula: 'Total Ad Spend ÷ Number of Customers',
    goodBenchmark: '< 30% of LTV',
    icon: DollarSign
  },
  {
    title: 'Customer Lifetime Value (LTV)',
    description: 'Total value a customer brings over their lifetime',
    formula: 'Average Order Value × Purchase Frequency × Customer Lifespan',
    goodBenchmark: '3x CPA or higher',
    icon: BarChart3
  },
  {
    title: 'Click-Through Rate (CTR)',
    description: 'Percentage of people who click your ads',
    formula: 'Clicks ÷ Impressions × 100',
    goodBenchmark: '1% or higher',
    icon: Target
  }
];

const industryBenchmarks = [
  { industry: 'E-commerce', averageROAS: '4.2x', averageCPA: '$45', averageCTR: '1.8%' },
  { industry: 'B2B Services', averageROAS: '3.8x', averageCPA: '$85', averageCTR: '1.2%' },
  { industry: 'Healthcare', averageROAS: '3.5x', averageCPA: '$120', averageCTR: '1.4%' },
  { industry: 'Real Estate', averageROAS: '5.1x', averageCPA: '$95', averageCTR: '2.1%' },
  { industry: 'Technology', averageROAS: '4.6x', averageCPA: '$75', averageCTR: '1.6%' },
  { industry: 'Financial Services', averageROAS: '3.9x', averageCPA: '$110', averageCTR: '1.3%' }
];

const optimizationStrategies = [
  {
    metric: 'Low ROAS (< 2:1)',
    causes: [
      'Poor audience targeting',
      'Weak ad creative',
      'Low-converting landing pages',
      'High competition keywords'
    ],
    solutions: [
      'Refine audience segments',
      'A/B test new creative formats',
      'Optimize landing page conversion',
      'Target long-tail keywords'
    ]
  },
  {
    metric: 'High CPA',
    causes: [
      'Broad targeting',
      'Low-quality traffic',
      'Poor funnel optimization',
      'Weak call-to-actions'
    ],
    solutions: [
      'Use lookalike audiences',
      'Implement negative keywords',
      'Optimize conversion funnel',
      'Test stronger CTAs'
    ]
  },
  {
    metric: 'Low CTR (< 1%)',
    causes: [
      'Irrelevant ad copy',
      'Poor visual design',
      'Wrong audience targeting',
      'Ad fatigue'
    ],
    solutions: [
      'Write compelling headlines',
      'Use high-quality visuals',
      'Narrow audience targeting',
      'Refresh creative regularly'
    ]
  }
];

export default function ROICalculatorContent() {
  const [calculatorInputs, setCalculatorInputs] = useState({
    adSpend: '',
    revenue: '',
    conversions: '',
    avgOrderValue: '',
    clicks: '',
    impressions: ''
  });

  const [results, setResults] = useState({
    roas: 0,
    cpa: 0,
    ctr: 0,
    roi: 0
  });

  const calculateROI = () => {
    const adSpend = parseFloat(calculatorInputs.adSpend) || 0;
    const revenue = parseFloat(calculatorInputs.revenue) || 0;
    const conversions = parseFloat(calculatorInputs.conversions) || 0;
    const clicks = parseFloat(calculatorInputs.clicks) || 0;
    const impressions = parseFloat(calculatorInputs.impressions) || 0;

    const roas = adSpend > 0 ? revenue / adSpend : 0;
    const cpa = conversions > 0 ? adSpend / conversions : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const roi = adSpend > 0 ? ((revenue - adSpend) / adSpend) * 100 : 0;

    setResults({ roas, cpa, ctr, roi });
  };

  const handleInputChange = (field: string, value: string) => {
    setCalculatorInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-16">
      {/* Overview */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            Social Advertising ROI Calculator
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Measure and optimize your social advertising performance with our comprehensive ROI calculator. 
            Track key metrics, compare against industry benchmarks, and identify opportunities for improvement 
            to maximize your advertising investment.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Calculator, label: 'ROI Calculation', value: 'Real-time' },
            { icon: BarChart3, label: 'Industry Benchmarks', value: '15+ sectors' },
            { icon: Target, label: 'Optimization Tips', value: 'Actionable insights' },
            { icon: PieChart, label: 'Performance Tracking', value: 'Multi-platform' }
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-6 text-center"
            >
              <benefit.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-1">{benefit.label}</p>
              <p className="text-xl font-bold text-white">{benefit.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ROI Calculator Tool */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Interactive ROI Calculator</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6">Enter Your Campaign Data</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Ad Spend ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 5000"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  value={calculatorInputs.adSpend}
                  onChange={(e) => handleInputChange('adSpend', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Revenue Generated ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 20000"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  value={calculatorInputs.revenue}
                  onChange={(e) => handleInputChange('revenue', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Conversions
                </label>
                <input
                  type="number"
                  placeholder="e.g., 150"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  value={calculatorInputs.conversions}
                  onChange={(e) => handleInputChange('conversions', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Clicks
                </label>
                <input
                  type="number"
                  placeholder="e.g., 2500"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  value={calculatorInputs.clicks}
                  onChange={(e) => handleInputChange('clicks', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Impressions
                </label>
                <input
                  type="number"
                  placeholder="e.g., 100000"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  value={calculatorInputs.impressions}
                  onChange={(e) => handleInputChange('impressions', e.target.value)}
                />
              </div>
              <button
                onClick={calculateROI}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
              >
                Calculate ROI
              </button>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6">Your Campaign Results</h3>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Return on Ad Spend (ROAS)</span>
                  <span className="text-2xl font-bold text-white">
                    {results.roas > 0 ? `${results.roas.toFixed(2)}:1` : '--'}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Benchmark: 4:1 or higher
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Cost Per Acquisition (CPA)</span>
                  <span className="text-2xl font-bold text-white">
                    {results.cpa > 0 ? `$${results.cpa.toFixed(2)}` : '--'}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Lower is better
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Click-Through Rate (CTR)</span>
                  <span className="text-2xl font-bold text-white">
                    {results.ctr > 0 ? `${results.ctr.toFixed(2)}%` : '--'}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Benchmark: 1% or higher
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">ROI Percentage</span>
                  <span className="text-2xl font-bold text-white">
                    {results.roi !== 0 ? `${results.roi.toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Positive is profitable
                </div>
              </div>
            </div>

            {results.roas > 0 && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300 font-semibold mb-2">Performance Assessment:</p>
                <p className="text-xs text-gray-300">
                  {results.roas >= 4 
                    ? "Excellent performance! Your campaigns are highly profitable."
                    : results.roas >= 2
                    ? "Good performance with room for optimization."
                    : "Performance needs improvement. Consider optimizing targeting and creative."}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Key ROI Metrics */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Understanding ROI Metrics</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {roiMetrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <div className="flex items-start gap-4">
                <metric.icon className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{metric.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{metric.description}</p>
                  <div className="bg-slate-800 rounded p-3 mb-3">
                    <p className="text-xs text-gray-400 mb-1">Formula:</p>
                    <p className="text-blue-300 font-mono text-sm">{metric.formula}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Good Benchmark: </span>
                    <span className="text-green-400 font-semibold">{metric.goodBenchmark}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Industry Benchmarks */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Industry Benchmarks</h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Industry</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Avg. ROAS</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Avg. CPA</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Avg. CTR</th>
                </tr>
              </thead>
              <tbody>
                {industryBenchmarks.map((industry, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border-t border-slate-700"
                  >
                    <td className="px-6 py-4 text-white font-medium">{industry.industry}</td>
                    <td className="px-6 py-4 text-center text-green-400 font-semibold">{industry.averageROAS}</td>
                    <td className="px-6 py-4 text-center text-blue-400 font-semibold">{industry.averageCPA}</td>
                    <td className="px-6 py-4 text-center text-purple-400 font-semibold">{industry.averageCTR}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Optimization Strategies */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">ROI Optimization Strategies</h2>
        <div className="space-y-8">
          {optimizationStrategies.map((strategy, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">{strategy.metric}</h3>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-red-400 mb-4">Common Causes</h4>
                  <ul className="space-y-2">
                    {strategy.causes.map((cause, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2" />
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-400 mb-4">Optimization Solutions</h4>
                  <ul className="space-y-2">
                    {strategy.solutions.map((solution, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Advanced Analytics */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Advanced ROI Analytics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Attribution Modeling',
              description: 'Track the complete customer journey across touchpoints',
              features: ['First-click attribution', 'Last-click attribution', 'Multi-touch attribution', 'Time-decay models']
            },
            {
              title: 'Cohort Analysis',
              description: 'Analyze customer behavior and retention over time',
              features: ['Monthly cohorts', 'LTV analysis', 'Retention rates', 'Revenue trends']
            },
            {
              title: 'Predictive Modeling',
              description: 'Forecast future performance and optimize budgets',
              features: ['Revenue forecasting', 'Budget optimization', 'Seasonal adjustments', 'Growth projections']
            }
          ].map((analytics, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-bold text-white mb-3">{analytics.title}</h3>
              <p className="text-gray-300 mb-4">{analytics.description}</p>
              <ul className="space-y-2">
                {analytics.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}