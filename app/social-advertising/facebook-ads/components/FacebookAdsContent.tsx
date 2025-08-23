'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, Users, Zap, CheckCircle, ArrowRight, BarChart3, Eye, Clock } from 'lucide-react';

const facebookAdsStrategies = [
  {
    title: 'Audience Targeting & Segmentation',
    description: 'Advanced targeting techniques to reach your ideal customers',
    strategies: [
      'Custom audience creation from customer data',
      'Lookalike audience development',
      'Interest-based targeting optimization',
      'Behavioral targeting strategies',
      'Demographic and geographic segmentation',
      'Retargeting campaign setup'
    ],
    results: [
      'Reduce cost per acquisition by 40%',
      'Increase audience engagement rates',
      'Improve conversion quality',
      'Maximize ROI on ad spend'
    ]
  },
  {
    title: 'Creative Development & Testing',
    description: 'High-converting ad creatives that capture attention',
    strategies: [
      'Video ad creation and optimization',
      'Carousel ad design best practices',
      'Image optimization for news feed',
      'Copywriting for different funnel stages',
      'A/B testing frameworks',
      'Dynamic creative optimization'
    ],
    results: [
      'Increase click-through rates by 60%',
      'Boost engagement with video content',
      'Improve brand recall and recognition',
      'Drive higher conversion rates'
    ]
  },
  {
    title: 'Campaign Optimization & Scaling',
    description: 'Data-driven optimization for maximum performance',
    strategies: [
      'Budget allocation optimization',
      'Bid strategy implementation',
      'Campaign structure best practices',
      'Performance monitoring and analysis',
      'Scaling successful campaigns',
      'Attribution modeling setup'
    ],
    results: [
      'Scale successful campaigns by 300%',
      'Improve cost efficiency',
      'Increase overall ROAS',
      'Optimize for business objectives'
    ]
  }
];

const adFormats = [
  {
    format: 'Video Ads',
    description: 'Engaging video content that captures attention in the news feed',
    bestFor: ['Brand awareness', 'Product demonstrations', 'Storytelling'],
    metrics: { engagement: '+85%', recall: '+70%', ctr: '+45%' }
  },
  {
    format: 'Carousel Ads',
    description: 'Multiple images or videos in a single ad for product showcases',
    bestFor: ['E-commerce', 'Multiple products', 'Feature highlights'],
    metrics: { engagement: '+72%', ctr: '+30%', conversions: '+25%' }
  },
  {
    format: 'Collection Ads',
    description: 'Immersive shopping experience directly within Facebook',
    bestFor: ['E-commerce', 'Catalog showcases', 'Mobile shopping'],
    metrics: { engagement: '+65%', ctr: '+40%', sales: '+35%' }
  },
  {
    format: 'Lead Generation Ads',
    description: 'Capture leads without users leaving Facebook platform',
    bestFor: ['B2B leads', 'Newsletter signups', 'Event registrations'],
    metrics: { leads: '+80%', cost: '-45%', quality: '+60%' }
  }
];

const australianMarketInsights = [
  {
    insight: 'Peak Engagement Times',
    data: 'Australians are most active on Facebook between 7-9 PM AEST',
    actionable: 'Schedule ads during peak hours for maximum visibility'
  },
  {
    insight: 'Mobile Usage Dominance',
    data: '89% of Australian Facebook users access via mobile devices',
    actionable: 'Prioritize mobile-optimized creative and landing pages'
  },
  {
    insight: 'Video Content Preference',
    data: 'Video posts receive 3x more engagement than image posts',
    actionable: 'Invest in quality video content for better performance'
  },
  {
    insight: 'Local Relevance',
    data: 'Ads with local Brisbane references see 25% higher engagement',
    actionable: 'Include local landmarks, events, or cultural references'
  }
];

export default function FacebookAdsContent() {
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
            Facebook Advertising Excellence
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Maximize your Facebook advertising ROI with our comprehensive strategies. From precision 
            targeting to creative optimization, we help Brisbane businesses achieve exceptional results 
            on the world's largest social media platform.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Target, label: 'Precise Targeting', value: '2.8B+ users' },
            { icon: TrendingUp, label: 'Average ROI', value: '400%' },
            { icon: Users, label: 'Reach Potential', value: '15M+ Australians' },
            { icon: Zap, label: 'Campaign Setup', value: '24-48 hours' }
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

      {/* Facebook Ads Strategies */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Facebook Advertising Strategies</h2>
        <div className="space-y-8">
          {facebookAdsStrategies.map((strategy, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{strategy.title}</h3>
              <p className="text-gray-300 mb-6">{strategy.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Strategies</h4>
                  <ul className="space-y-2">
                    {strategy.strategies.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Expected Results</h4>
                  <ul className="space-y-2">
                    {strategy.results.map((result, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ad Formats */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">High-Performing Ad Formats</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {adFormats.map((format, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-bold text-white mb-3">{format.format}</h3>
              <p className="text-gray-300 mb-4">{format.description}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Best For:</h4>
                <div className="flex flex-wrap gap-2">
                  {format.bestFor.map((use, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                      {use}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-sm text-gray-400">Engagement</p>
                  <p className="text-lg font-bold text-green-400">{format.metrics.engagement}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">CTR</p>
                  <p className="text-lg font-bold text-blue-400">{format.metrics.ctr}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{Object.keys(format.metrics)[2]}</p>
                  <p className="text-lg font-bold text-purple-400">{Object.values(format.metrics)[2]}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian Market Insights */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Market Insights</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {australianMarketInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6"
            >
              <h3 className="text-lg font-bold text-white mb-3">{insight.insight}</h3>
              <p className="text-blue-300 mb-3 font-semibold">{insight.data}</p>
              <p className="text-gray-300 text-sm">{insight.actionable}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Campaign Process */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Campaign Development Process</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {[
              {
                step: 'Discovery & Strategy',
                description: 'Business objectives analysis and audience research',
                duration: '1-2 days',
                deliverables: ['Audience personas', 'Campaign strategy', 'Budget allocation']
              },
              {
                step: 'Creative Development',
                description: 'Design compelling ad creatives and copy',
                duration: '3-5 days',
                deliverables: ['Ad creatives', 'Copy variations', 'Landing pages']
              },
              {
                step: 'Campaign Setup',
                description: 'Configure campaigns, audiences, and tracking',
                duration: '1-2 days',
                deliverables: ['Campaign structure', 'Pixel setup', 'Conversion tracking']
              },
              {
                step: 'Launch & Optimization',
                description: 'Monitor performance and optimize for results',
                duration: 'Ongoing',
                deliverables: ['Performance reports', 'Optimization recommendations', 'Scale strategies']
              }
            ].map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative flex gap-6 items-start"
              >
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white">{phase.step}</h3>
                    <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">{phase.description}</p>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Deliverables:</h4>
                    <ul className="flex flex-wrap gap-2">
                      {phase.deliverables.map((deliverable, i) => (
                        <li key={i} className="text-xs px-2 py-1 bg-slate-800 text-gray-300 rounded">
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Key Performance Metrics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              metric: 'Cost Per Click (CPC)',
              description: 'Average cost for each click on your ads',
              target: '$0.50 - $2.00',
              icon: BarChart3
            },
            {
              metric: 'Click-Through Rate (CTR)',
              description: 'Percentage of people who click after seeing your ad',
              target: '1.5% - 3.0%',
              icon: Eye
            },
            {
              metric: 'Cost Per Acquisition (CPA)',
              description: 'Cost to acquire one customer or conversion',
              target: 'Varies by industry',
              icon: Target
            },
            {
              metric: 'Return on Ad Spend (ROAS)',
              description: 'Revenue generated for every dollar spent',
              target: '4:1 minimum',
              icon: TrendingUp
            },
            {
              metric: 'Frequency',
              description: 'Average number of times users see your ad',
              target: '1.5 - 3.0',
              icon: Clock
            },
            {
              metric: 'Relevance Score',
              description: 'Facebook\'s rating of ad quality and relevance',
              target: '7+ out of 10',
              icon: CheckCircle
            }
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <metric.icon className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">{metric.metric}</h3>
              <p className="text-gray-300 text-sm mb-3">{metric.description}</p>
              <div className="text-sm">
                <span className="text-gray-400">Target: </span>
                <span className="text-green-400 font-semibold">{metric.target}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}