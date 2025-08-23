'use client';

import { motion } from 'framer-motion';
import { Search, Target, TrendingUp, BarChart3, CheckCircle, ArrowRight, Zap, Eye, AlertTriangle, Award } from 'lucide-react';

const seoAuditAreas = [
  {
    title: 'Technical SEO Analysis',
    description: 'Comprehensive technical audit to identify crawling and indexing issues',
    checks: [
      'Site speed and Core Web Vitals',
      'Mobile-friendliness and responsiveness',
      'URL structure and canonicalization',
      'XML sitemaps and robots.txt',
      'Schema markup implementation',
      'HTTPS and security headers'
    ],
    impact: [
      'Improve search engine crawling',
      'Enhance user experience metrics',
      'Boost organic visibility',
      'Fix technical barriers to ranking'
    ]
  },
  {
    title: 'On-Page SEO Evaluation',
    description: 'Content and optimization analysis for maximum search relevance',
    checks: [
      'Title tags and meta descriptions',
      'Header structure (H1-H6)',
      'Keyword optimization and density',
      'Internal linking strategy',
      'Image optimization and alt text',
      'Content quality and uniqueness'
    ],
    impact: [
      'Increase click-through rates',
      'Improve keyword rankings',
      'Enhance content relevance',
      'Boost page authority'
    ]
  },
  {
    title: 'Competitive SEO Gap Analysis',
    description: 'Compare your SEO performance against top competitors',
    checks: [
      'Keyword gap analysis',
      'Backlink profile comparison',
      'Content gap identification',
      'SERP feature opportunities',
      'Local SEO competitive analysis',
      'Technical advantage assessment'
    ],
    impact: [
      'Discover untapped keywords',
      'Identify link building opportunities',
      'Find content opportunities',
      'Outrank competitors strategically'
    ]
  }
];

const auditProcess = [
  {
    phase: 'Website Crawling',
    description: 'Comprehensive crawl of your website to identify all pages and issues',
    duration: '1-2 days',
    tools: ['Screaming Frog', 'Sitebulb', 'Google Search Console'],
    deliverables: ['Technical issue report', 'Site architecture analysis', 'Crawl data export']
  },
  {
    phase: 'Competitive Analysis',
    description: 'Analyze top competitors for keyword and content opportunities',
    duration: '2-3 days',
    tools: ['SEMrush', 'Ahrefs', 'Moz'],
    deliverables: ['Competitor keyword analysis', 'Backlink gap analysis', 'Content strategy recommendations']
  },
  {
    phase: 'Performance Analysis',
    description: 'Evaluate current rankings, traffic, and conversion data',
    duration: '1-2 days',
    tools: ['Google Analytics', 'Search Console', 'PageSpeed Insights'],
    deliverables: ['Performance baseline', 'Opportunity assessment', 'ROI projections']
  },
  {
    phase: 'Strategic Recommendations',
    description: 'Develop prioritized action plan with implementation roadmap',
    duration: '2-3 days',
    tools: ['Custom reporting', 'Project management tools'],
    deliverables: ['SEO strategy document', 'Implementation timeline', 'Success metrics']
  }
];

const commonSEOIssues = [
  {
    issue: 'Slow Page Speed',
    severity: 'High',
    impact: 'User experience and rankings',
    solution: 'Optimize images, enable compression, improve server response time',
    australianContext: 'Critical for Australian mobile users on slower connections'
  },
  {
    issue: 'Missing Meta Descriptions',
    severity: 'Medium',
    impact: 'Lower click-through rates from search results',
    solution: 'Create compelling, keyword-rich meta descriptions for all pages',
    australianContext: 'Include local Brisbane/Australian terms for better relevance'
  },
  {
    issue: 'Poor Mobile Experience',
    severity: 'High',
    impact: 'Mobile rankings and user engagement',
    solution: 'Implement responsive design and optimize for mobile-first indexing',
    australianContext: '89% of Australians use mobile for search - critical priority'
  },
  {
    issue: 'Duplicate Content',
    severity: 'Medium',
    impact: 'Diluted ranking signals and confusion',
    solution: 'Implement canonical tags and consolidate similar pages',
    australianContext: 'Common with multi-location Australian businesses'
  },
  {
    issue: 'Weak Internal Linking',
    severity: 'Medium',
    impact: 'Poor page authority distribution',
    solution: 'Create strategic internal linking structure',
    australianContext: 'Link to location-specific pages for local SEO boost'
  },
  {
    issue: 'Missing Local SEO',
    severity: 'High',
    impact: 'Lost local search visibility',
    solution: 'Optimize for local search with NAP consistency and local content',
    australianContext: 'Essential for Brisbane businesses targeting local customers'
  }
];

const seoMetrics = [
  {
    metric: 'Organic Traffic',
    description: 'Monthly organic visitors from search engines',
    benchmark: '40-60% of total website traffic',
    measurement: 'Google Analytics'
  },
  {
    metric: 'Keyword Rankings',
    description: 'Average position for target keywords',
    benchmark: 'Top 10 for primary keywords',
    measurement: 'SEMrush/Ahrefs'
  },
  {
    metric: 'Domain Authority',
    description: 'Overall website authority score',
    benchmark: 'Above industry average (varies by sector)',
    measurement: 'Moz/Ahrefs'
  },
  {
    metric: 'Core Web Vitals',
    description: 'Page speed and user experience metrics',
    benchmark: 'LCP < 2.5s, FID < 100ms, CLS < 0.1',
    measurement: 'PageSpeed Insights'
  },
  {
    metric: 'Click-Through Rate',
    description: 'Percentage of searchers who click your results',
    benchmark: '2-5% for position 1, decreasing by position',
    measurement: 'Google Search Console'
  },
  {
    metric: 'Backlink Quality',
    description: 'Quality and quantity of referring domains',
    benchmark: 'High DR domains from relevant sources',
    measurement: 'Ahrefs/Majestic'
  }
];

export default function SEOAuditContent() {
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
            Comprehensive SEO Audit Services
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Uncover hidden SEO opportunities and fix critical issues holding back your Brisbane 
            business. Our comprehensive SEO audits provide actionable insights to improve your 
            search visibility, drive more organic traffic, and outrank your competitors.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Search, label: 'SEO Issues Found', value: '50+ checks' },
            { icon: TrendingUp, label: 'Avg Traffic Increase', value: '+150%' },
            { icon: Target, label: 'Ranking Improvements', value: '+3.2 positions' },
            { icon: BarChart3, label: 'Report Depth', value: '100+ pages' }
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

      {/* SEO Audit Areas */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">What We Audit</h2>
        <div className="space-y-8">
          {seoAuditAreas.map((area, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{area.title}</h3>
              <p className="text-gray-300 mb-6">{area.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Audit Checks</h4>
                  <ul className="space-y-2">
                    {area.checks.map((check, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Expected Impact</h4>
                  <ul className="space-y-2">
                    {area.impact.map((impact, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{impact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Audit Process */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our SEO Audit Process</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {auditProcess.map((phase, index) => (
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
                    <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                    <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">{phase.description}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Tools Used:</h4>
                      <ul className="flex flex-wrap gap-2">
                        {phase.tools.map((tool, i) => (
                          <li key={i} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            {tool}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Deliverables:</h4>
                      <ul className="flex flex-wrap gap-2">
                        {phase.deliverables.map((deliverable, i) => (
                          <li key={i} className="text-xs px-2 py-1 bg-slate-800 text-gray-300 rounded">
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Common SEO Issues */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Common SEO Issues We Find</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {commonSEOIssues.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className={`w-6 h-6 ${issue.severity === 'High' ? 'text-red-400' : 'text-yellow-400'} flex-shrink-0 mt-1`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">{issue.issue}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${issue.severity === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{issue.impact}</p>
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-green-400 mb-1">Solution:</h4>
                    <p className="text-gray-300 text-sm">{issue.solution}</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                    <h4 className="text-sm font-semibold text-blue-300 mb-1">Australian Context:</h4>
                    <p className="text-gray-300 text-xs">{issue.australianContext}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SEO Metrics */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Key SEO Performance Metrics</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {seoMetrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <h3 className="text-lg font-bold text-white mb-2">{metric.metric}</h3>
              <p className="text-gray-300 text-sm mb-3">{metric.description}</p>
              <div className="bg-slate-800/50 rounded p-3 mb-3">
                <h4 className="text-sm font-semibold text-green-400 mb-1">Benchmark:</h4>
                <p className="text-gray-300 text-sm">{metric.benchmark}</p>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Measured with: </span>
                <span className="text-blue-400 font-semibold">{metric.measurement}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Audit Report Sample */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">What's Included in Your Audit Report</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              section: 'Executive Summary',
              description: 'High-level overview of findings and recommendations',
              includes: ['Current performance snapshot', 'Priority action items', 'ROI projections', 'Timeline recommendations']
            },
            {
              section: 'Technical Analysis',
              description: 'Detailed technical SEO findings and fixes',
              includes: ['Crawl error analysis', 'Site speed optimization', 'Mobile usability report', 'Schema markup audit']
            },
            {
              section: 'Competitive Intelligence',
              description: 'How you compare to competitors and opportunities',
              includes: ['Keyword gap analysis', 'Backlink opportunities', 'Content gaps', 'Market positioning']
            }
          ].map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <Award className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">{section.section}</h3>
              <p className="text-gray-300 mb-4">{section.description}</p>
              <ul className="space-y-2">
                {section.includes.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{item}</span>
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