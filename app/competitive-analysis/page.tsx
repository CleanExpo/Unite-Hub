'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Search, Target, Shield, BarChart3, MapPin, Users, 
  DollarSign, Calendar, Wrench, TrendingUp, AlertTriangle, Eye,
  Sparkles, Trophy, Brain, Zap, ChevronRight, CheckCircle,
  Activity, Layers, Award, Lock
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';
import BackgroundPattern, { ParticleBackground } from '@/components/BackgroundPatterns';
import { AnimatedNumber, CircularProgress, ComparisonBar } from '@/components/AnimatedStats';
import HeroSection from '@/components/HeroSection';
import EnhancedCard from '@/components/EnhancedCard';
import TestimonialSection from '@/components/TestimonialSection';
import SectionAnimation from '@/components/SectionAnimation';
import { PageLoader, CardSkeleton, GridSkeleton } from '@/components/LoadingStates';

const metrics = [
  { icon: MapPin, label: 'Competitors Analyzed', value: 847, suffix: '+', color: 'purple' },
  { icon: Target, label: 'Market Share Gained', value: 34, suffix: '%', color: 'cyan' },
  { icon: DollarSign, label: 'Pricing Optimized', value: 22, suffix: '%', prefix: '+', color: 'emerald' },
  { icon: Users, label: 'Jobs Won', value: 156, color: 'amber' }
];

const services = [
  {
    icon: Search,
    title: 'Local Competitor Mapping',
    description: "Know exactly who you're competing with in your service area, their strengths, weaknesses, and how to beat them",
    features: ['Complete competitor database', 'Service area analysis', 'Strength/weakness matrix'],
    color: 'purple'
  },
  {
    icon: DollarSign,
    title: 'Pricing Intelligence',
    description: 'Discover what competitors charge, their service packages, and how to position your pricing to win more jobs',
    features: ['Pricing comparison matrix', 'Package analysis', 'Value proposition gaps'],
    color: 'emerald'
  },
  {
    icon: Target,
    title: 'Service Gap Analysis',
    description: "Find profitable services your competitors aren't offering and dominate untapped market segments",
    features: ['Market opportunity scan', 'Niche identification', 'Growth potential analysis'],
    color: 'cyan'
  },
  {
    icon: Shield,
    title: 'Reputation Monitoring',
    description: 'Track competitor reviews, complaints, and use their weaknesses to strengthen your market position',
    features: ['Review analysis', 'Complaint tracking', 'Reputation scoring'],
    color: 'amber'
  }
];

const competitorInsights = [
  {
    title: "Why Joe's Plumbing Gets More Calls",
    competitor: "Joe's Plumbing",
    marketShare: 28,
    findings: [
      { issue: "Answers phone in 2 rings vs industry avg 5", impact: 'high' },
      { issue: "Offers same-day service guarantee", impact: 'high' },
      { issue: "Has 127 Google reviews (you have 12)", impact: 'critical' }
    ],
    action: "Implement 24/7 answering service + review automation",
    potentialGain: "+15% call conversion"
  },
  {
    title: "How Spark Electrical Wins Big Jobs",
    competitor: "Spark Electrical",
    marketShare: 22,
    findings: [
      { issue: "Provides instant online quotes", impact: 'high' },
      { issue: "Shows up in top 3 Google results", impact: 'critical' },
      { issue: "Targets commercial properties exclusively", impact: 'medium' }
    ],
    action: "Build quote calculator + focus on residential niche",
    potentialGain: "+$240K annual revenue"
  },
  {
    title: "Why BuildRight Charges 30% More",
    competitor: "BuildRight Construction",
    marketShare: 18,
    findings: [
      { issue: "Positions as premium quality provider", impact: 'high' },
      { issue: "Shows certifications prominently", impact: 'medium' },
      { issue: "Offers 10-year workmanship warranty", impact: 'high' }
    ],
    action: "Highlight your certifications + extend warranty offer",
    potentialGain: "+22% average job value"
  }
];

const caseStudies = [
  {
    business: "Premier Roofing Brisbane",
    size: "8 employees, $3.8M revenue",
    challenge: "Losing 60% of quotes to cheaper competitors",
    analysis: "Discovered competitors had faster quote turnaround",
    result: "Implemented instant quoting, won 45% more jobs at higher prices",
    metrics: { before: 40, after: 85, improvement: 45 }
  },
  {
    business: "Coastal HVAC Services",
    size: "6 employees, $2.4M revenue",
    challenge: "Unknown why competitors got commercial contracts",
    analysis: "Found competitors had specific certifications displayed",
    result: "Got certified, updated marketing, landed $800K in contracts",
    metrics: { before: 30, after: 75, improvement: 45 }
  },
  {
    business: "Green Thumb Landscaping",
    size: "12 employees, $5.2M revenue",
    challenge: "Market leader taking all high-value projects",
    analysis: "Identified untapped eco-friendly landscaping niche",
    result: "Pivoted positioning, became the go-to for sustainable landscaping",
    metrics: { before: 25, after: 68, improvement: 43 }
  }
];

export default function CompetitiveAnalysisEnhancedPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState(0);
  const [activeTab, setActiveTab] = useState('strengths');
  const [comparisonView, setComparisonView] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const serviceSchema = {
    type: 'Service' as const,
    name: 'Competitive Analysis Services for Trade Businesses',
    description: 'Strategic competitor intelligence and market analysis helping Brisbane trades win 34% more quotes and beat their competition.',
    provider: 'Unite Group Agency',
    serviceType: 'Digital Marketing',
    areaServed: 'Brisbane, Queensland'
  };

  if (isLoading) {
    return <PageLoader text="Loading competitive intelligence..." fullScreen />;
  }

  return (
    <>
      <SchemaMarkup schema={serviceSchema} />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative">
        <ParticleBackground particleCount={30} className="opacity-30" />
        
        {/* Enhanced Hero Section */}
        <HeroSection
          variant="dark"
          title={
            <>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="block text-5xl md:text-7xl font-bold"
              >
                <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                  Beat Your Competition
                </span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block text-4xl md:text-6xl text-white mt-4"
              >
                Win More Jobs
              </motion.span>
            </>
          }
          subtitle={
            <span className="text-xl md:text-2xl">
              Stop losing to competitors. Win <span className="text-purple-400 font-bold">34% more quotes</span> with strategic intelligence
            </span>
          }
          primaryCTA={{
            text: 'Get Competitor Report',
            href: '/consultation?service=competitive-analysis',
            icon: Search
          }}
          secondaryCTA={{
            text: 'See Sample Analysis',
            href: '#competitor-audit',
            icon: Eye
          }}
        >
          {/* Competitor Intel Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-full mb-8"
          >
            <Shield className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-sm font-medium text-purple-300">COMPETITOR INTEL</span>
            <div className="h-4 w-px bg-purple-500/30" />
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-200">Know Your Competition</span>
          </motion.div>

          {/* Animated Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto"
          >
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl text-center group"
              >
                <metric.icon className={`w-8 h-8 text-${metric.color}-400 mx-auto mb-3 group-hover:scale-110 transition-transform`} />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {metric.prefix}
                  <AnimatedNumber value={metric.value} />
                  {metric.suffix}
                </div>
                <p className="text-sm text-gray-400">{metric.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </HeroSection>

        {/* Real Competitor Insights Section */}
        <SectionAnimation>
          <section className="py-32 relative">
            <BackgroundPattern variant="grid" opacity={0.02} />
            <div className="max-w-7xl mx-auto px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Real Intelligence on Your
                  <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Local Competitors</span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Stop guessing why competitors win jobs. Get actionable intelligence 
                  on exactly what they do better and how to beat them.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                {competitorInsights.map((insight, index) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <EnhancedCard
                      variant={selectedCompetitor === index ? 'neon' : 'glass'}
                      className="h-full cursor-pointer"
                      onClick={() => setSelectedCompetitor(index)}
                    >
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">{insight.competitor}</h3>
                          <CircularProgress 
                            value={insight.marketShare} 
                            maxValue={100}
                            size="sm"
                            label={`${insight.marketShare}%`}
                          />
                        </div>
                        
                        <h4 className="text-lg text-gray-300 mb-6">{insight.title}</h4>
                        
                        <div className="space-y-3 mb-6">
                          {insight.findings.map((finding, i) => (
                            <motion.div 
                              key={i} 
                              className="flex items-start gap-3"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                finding.impact === 'critical' ? 'text-red-400' :
                                finding.impact === 'high' ? 'text-yellow-400' :
                                'text-orange-400'
                              }`} />
                              <p className="text-gray-300 text-sm">{finding.issue}</p>
                            </motion.div>
                          ))}
                        </div>
                        
                        <AnimatePresence>
                          {selectedCompetitor === index && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-6 border-t border-gray-700"
                            >
                              <p className="text-green-400 font-semibold text-sm mb-2">Your Action:</p>
                              <p className="text-white mb-3">{insight.action}</p>
                              <div className="flex items-center gap-2 text-cyan-400">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm font-semibold">{insight.potentialGain}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </EnhancedCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </SectionAnimation>

        {/* Interactive Services Section */}
        <SectionAnimation>
          <section className="py-32 bg-gray-800/50 relative">
            <BackgroundPattern variant="dots" opacity={0.03} />
            <div className="max-w-7xl mx-auto px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Competitive Intelligence for
                  <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Trade Businesses</span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Everything you need to know about your competitors to win more jobs
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-8">
                {services.map((service, index) => (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <EnhancedCard variant="gradient" className="h-full group">
                      <div className="p-8">
                        <div className="flex items-center mb-6">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={`p-4 rounded-2xl bg-gradient-to-br from-${service.color}-500/20 to-${service.color}-600/20 mr-4`}
                          >
                            <service.icon className={`w-8 h-8 text-${service.color}-400`} />
                          </motion.div>
                          <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                        </div>
                        <p className="text-gray-300 mb-6">{service.description}</p>
                        
                        <div className="space-y-2">
                          {service.features.map((feature, i) => (
                            <motion.div
                              key={feature}
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              viewport={{ once: true }}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-gray-200 text-sm">{feature}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </EnhancedCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </SectionAnimation>

        {/* Interactive Competitor Audit Sample */}
        <SectionAnimation>
          <section id="competitor-audit" className="py-32 relative">
            <BackgroundPattern variant="mesh" opacity={0.05} />
            <div className="max-w-6xl mx-auto px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Sample Competitor
                  <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Audit Report</span>
                </h2>
                <p className="text-xl text-gray-300">
                  See what you'll discover about your top 3 competitors
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-3xl"
              >
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-4 mb-8 justify-center">
                  {['strengths', 'weaknesses', 'opportunities', 'pricing'].map((tab) => (
                    <motion.button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all ${
                        activeTab === tab
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      {tab}
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 'strengths' && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-xl">
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <Trophy className="w-5 h-5 mr-2 text-purple-400" />
                            Competitor Strengths
                          </h3>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                              <span className="text-gray-300">24/7 emergency service availability</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                              <span className="text-gray-300">189 Google reviews (4.8 star average)</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                              <span className="text-gray-300">Instant online booking system</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                              <span className="text-gray-300">$89 call-out fee (market leader)</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="bg-cyan-900/20 border border-cyan-500/30 p-6 rounded-xl">
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-cyan-400" />
                            How to Compete
                          </h3>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <ArrowRight className="w-5 h-5 text-cyan-400 mt-0.5" />
                              <span className="text-gray-300">Match their response times</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <ArrowRight className="w-5 h-5 text-cyan-400 mt-0.5" />
                              <span className="text-gray-300">Implement review automation</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <ArrowRight className="w-5 h-5 text-cyan-400 mt-0.5" />
                              <span className="text-gray-300">Add online booking feature</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <ArrowRight className="w-5 h-5 text-cyan-400 mt-0.5" />
                              <span className="text-gray-300">Offer intro pricing special</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTab === 'weaknesses' && (
                      <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Competitor Weaknesses to Exploit</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                              <span className="text-gray-300">No warranty mentioned on website</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                              <span className="text-gray-300">Poor mobile website experience</span>
                            </li>
                          </ul>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                              <span className="text-gray-300">Limited service area coverage</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                              <span className="text-gray-300">No commercial services offered</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTab === 'opportunities' && (
                      <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Market Opportunities</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          {['Commercial contracts', 'Preventive maintenance', 'Emergency services'].map((opp) => (
                            <div key={opp} className="bg-gray-800/50 p-4 rounded-lg">
                              <Award className="w-6 h-6 text-green-400 mb-2" />
                              <p className="text-white font-semibold">{opp}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'pricing' && (
                      <div className="space-y-6">
                        <ComparisonBar 
                          label="Service Call Fee"
                          value1={89}
                          value2={120}
                          label1="Competitor"
                          label2="You"
                          format="currency"
                        />
                        <ComparisonBar 
                          label="Hourly Rate"
                          value1={110}
                          value2={135}
                          label1="Competitor"
                          label2="You"
                          format="currency"
                        />
                        <ComparisonBar 
                          label="Average Job Value"
                          value1={450}
                          value2={520}
                          label1="Competitor"
                          label2="You"
                          format="currency"
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </section>
        </SectionAnimation>

        {/* Case Studies with Progress Bars */}
        <SectionAnimation>
          <section className="py-32 bg-gray-800/50">
            <div className="max-w-7xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  How Brisbane Trades
                  <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Beat Their Competition</span>
                </h2>
              </motion.div>

              <div className="space-y-8">
                {caseStudies.map((study, index) => (
                  <motion.div
                    key={study.business}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <EnhancedCard variant="glass">
                      <div className="p-8">
                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2">{study.business}</h3>
                            <p className="text-gray-400 text-sm mb-3">{study.size}</p>
                            <p className="text-red-400 font-semibold mb-1">Challenge:</p>
                            <p className="text-gray-300">{study.challenge}</p>
                          </div>
                          
                          <div>
                            <p className="text-purple-400 font-semibold mb-2">What We Found:</p>
                            <p className="text-gray-300 mb-4">{study.analysis}</p>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Before</span>
                                <span className="text-red-400">{study.metrics.before}%</span>
                              </div>
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${study.metrics.before}%` }}
                                  transition={{ duration: 1, delay: 0.5 }}
                                  className="h-full bg-red-500"
                                />
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">After</span>
                                <span className="text-green-400">{study.metrics.after}%</span>
                              </div>
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${study.metrics.after}%` }}
                                  transition={{ duration: 1, delay: 0.7 }}
                                  className="h-full bg-green-500"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl">
                            <p className="text-green-400 font-semibold mb-2">Result:</p>
                            <p className="text-white font-semibold mb-3">{study.result}</p>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-green-400" />
                              <span className="text-2xl font-bold text-green-400">
                                +{study.metrics.improvement}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </EnhancedCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </SectionAnimation>

        {/* Final CTA Section */}
        <SectionAnimation>
          <section className="py-32 relative">
            <BackgroundPattern variant="gradient" opacity={0.1} />
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Dominate Your
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                    Competition?
                  </span>
                </h2>
                
                <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
                  Get your free competitor analysis report and discover exactly how to win more 
                  jobs, charge better prices, and dominate your local market.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/consultation"
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-xl"
                    >
                      <Calendar className="w-6 h-6" />
                      Get Free Competitor Report
                      <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Worth $497</span>
                    </Link>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/competitive-analysis/benchmarking"
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                    >
                      <BarChart3 className="w-6 h-6" />
                      See Benchmarking Tools
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                </div>

                {/* Trust Badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                  className="mt-16 flex flex-wrap justify-center gap-8"
                >
                  {[
                    { icon: Lock, text: 'Confidential Analysis' },
                    { icon: Trophy, text: '847+ Competitors Analyzed' },
                    { icon: Activity, text: 'Real-Time Intelligence' }
                  ].map((badge, index) => (
                    <motion.div
                      key={badge.text}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-2 text-gray-400"
                    >
                      <badge.icon className="w-5 h-5 text-purple-400" />
                      <span>{badge.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </section>
        </SectionAnimation>
      </div>
    </>
  );
}