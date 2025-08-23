'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Users, Zap, Target, BarChart3, Clock, RefreshCw, 
  CheckCircle, Calendar, Wrench, HardHat, Truck, Calculator,
  Sparkles, TrendingUp, Shield, Award, ChevronRight, Play,
  DollarSign, Timer, Activity, Layers
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';
import BackgroundPattern, { AnimatedGradient } from '@/components/BackgroundPatterns';
import { AnimatedNumber, CircularProgress, ComparisonBar } from '@/components/AnimatedStats';
import HeroSection from '@/components/HeroSection';
import EnhancedCard from '@/components/EnhancedCard';
import TestimonialSection from '@/components/TestimonialSection';
import SectionAnimation from '@/components/SectionAnimation';
import { PageLoader, CardSkeleton, ProgressLoader } from '@/components/LoadingStates';

const metrics = [
  { icon: Clock, label: 'Jobs Completed Faster', value: 32, suffix: '%', color: 'green' },
  { icon: BarChart3, label: 'Quote Win Rate', value: 45, suffix: '%', prefix: '+', color: 'blue' },
  { icon: Users, label: 'Crew Utilization', value: 94, suffix: '%', color: 'purple' },
  { icon: Target, label: 'Customer Satisfaction', value: 4.9, suffix: '★', color: 'cyan' }
];

const services = [
  {
    icon: RefreshCw,
    title: 'Sprint-Based Project Management',
    description: 'Organize your trade jobs into 2-week sprints for better crew allocation and faster project completion',
    benefits: ['32% faster completion', 'Better crew allocation', 'Clear project milestones'],
    color: 'blue'
  },
  {
    icon: Zap,
    title: 'Rapid Quote & Estimate System',
    description: 'Respond to customer inquiries 3x faster with agile estimation techniques that win more bids',
    benefits: ['3x faster quotes', '45% higher win rate', 'Automated pricing'],
    color: 'purple'
  },
  {
    icon: Users,
    title: 'Crew Coordination Training',
    description: 'Train your team leaders in daily standups and sprint planning to maximize productivity on-site',
    benefits: ['94% crew utilization', 'Daily goal clarity', 'Reduced downtime'],
    color: 'green'
  },
  {
    icon: Target,
    title: 'Customer Communication Framework',
    description: 'Keep clients updated with sprint reviews and transparent progress tracking for 5-star reviews',
    benefits: ['4.9★ average rating', 'Real-time updates', 'Happy customers'],
    color: 'orange'
  }
];

const painPoints = [
  { icon: Truck, title: 'Crew Management Chaos', problem: 'Multiple jobs, different sites, who goes where?', solution: 'Daily standups & sprint planning' },
  { icon: Clock, title: 'Slow Quote Response', problem: 'Losing jobs to faster competitors?', solution: 'Agile estimation techniques' },
  { icon: Wrench, title: 'Project Delays', problem: 'Change orders throwing off your schedule?', solution: 'Sprint-based flexibility' },
  { icon: Users, title: 'Invoice Tracking', problem: 'Chasing payments and losing cash flow?', solution: 'Sprint-end billing cycles' },
  { icon: Shield, title: 'Safety Compliance', problem: 'Toolbox talks eating into productivity?', solution: 'Integrated safety standups' },
  { icon: BarChart3, title: 'Growth Bottlenecks', problem: 'Can\'t scale past 10 employees?', solution: 'Scalable agile framework' }
];

const testimonials = [
  {
    quote: "Agile sprints helped us go from 8 to 12 jobs per month with the same 6-person crew. The daily standups changed everything!",
    author: "Mike Patterson",
    company: "Mike's Plumbing Brisbane",
    rating: 5,
    metrics: { before: '8 jobs/month', after: '12 jobs/month', improvement: '50% increase' }
  },
  {
    quote: "Our quote response time dropped from 3 days to same-day. We're winning 45% more bids and customers love the speed.",
    author: "Sarah Chen",
    company: "Brisbane Electrical Solutions",
    rating: 5,
    metrics: { before: '3 day quotes', after: 'Same day quotes', improvement: '45% more wins' }
  },
  {
    quote: "Daily standups transformed our crew coordination. No more wasted trips or idle time. Productivity is through the roof!",
    author: "Tom Williams",
    company: "Southside Construction",
    rating: 5,
    metrics: { before: '65% utilization', after: '94% utilization', improvement: '45% improvement' }
  }
];

export default function AgileMarketingEnhancedPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(0);
  const [roiInputs, setRoiInputs] = useState({
    monthlyJobs: 8,
    avgJobValue: 5000,
    crewSize: 6
  });
  const [roiResults, setRoiResults] = useState({
    additionalJobs: 0,
    extraRevenue: 0,
    annualIncrease: 0,
    roi: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Calculate ROI
    const additionalJobs = Math.floor(roiInputs.monthlyJobs * 0.32);
    const extraRevenue = additionalJobs * roiInputs.avgJobValue;
    const annualIncrease = extraRevenue * 12;
    const investmentCost = 15000; // Estimated agile implementation cost
    const roi = Math.round((annualIncrease / investmentCost) * 100);

    setRoiResults({
      additionalJobs,
      extraRevenue,
      annualIncrease,
      roi
    });
  }, [roiInputs]);

  const serviceSchema = {
    type: 'Service' as const,
    name: 'Agile Marketing Services for Trade Businesses',
    description: 'Sprint-based project management and agile marketing methods helping Brisbane trades complete 32% more jobs with the same crew size.',
    provider: 'Unite Group Agency',
    serviceType: 'Digital Marketing',
    areaServed: 'Brisbane, Queensland'
  };

  if (isLoading) {
    return <PageLoader text="Loading agile solutions..." fullScreen />;
  }

  return (
    <>
      <SchemaMarkup schema={serviceSchema} />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        
        {/* Enhanced Hero Section */}
        <HeroSection
          variant="animated"
          title={
            <>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="block text-5xl md:text-7xl font-bold"
              >
                <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  Agile Methods
                </span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block text-4xl md:text-6xl text-white mt-4"
              >
                For Trade Businesses
              </motion.span>
            </>
          }
          subtitle={
            <span className="text-xl md:text-2xl">
              Complete <span className="text-green-400 font-bold">32% more jobs</span> with the same crew size
            </span>
          }
          primaryCTA={{
            text: 'Get Free Assessment',
            href: '/consultation?service=agile-trades',
            icon: Calendar
          }}
          secondaryCTA={{
            text: 'Calculate ROI',
            href: '#roi-calculator',
            icon: Calculator
          }}
        >
          {/* Trade Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-green-500/30 rounded-full mb-8"
          >
            <HardHat className="w-5 h-5 text-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-300">FOR TRADESPEOPLE</span>
            <div className="h-4 w-px bg-green-500/30" />
            <RefreshCw className="w-4 h-4 text-green-400 animate-spin-slow" />
            <span className="text-sm font-medium text-gray-200">Sprint-Based Job Management</span>
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
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl text-center"
              >
                <metric.icon className={`w-8 h-8 text-${metric.color}-400 mx-auto mb-3`} />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {metric.prefix}
                  <AnimatedNumber value={metric.value} decimals={metric.suffix === '★' ? 1 : 0} />
                  {metric.suffix}
                </div>
                <p className="text-sm text-gray-400">{metric.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </HeroSection>

        {/* Author Section */}
        <SectionAnimation>
          <section className="py-12 bg-gray-800/50">
            <div className="max-w-4xl mx-auto px-4">
              <AuthorInfo 
                author={AUTHORS.sarahMitchell} 
                publishDate="January 2025"
                readTime="5"
              />
            </div>
          </section>
        </SectionAnimation>

        {/* Services Section with Interactive Cards */}
        <SectionAnimation>
          <section className="py-32 relative">
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
                  How Agile Transforms Your
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Trade Business</span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Stop losing money to poor scheduling, slow quotes, and crew downtime. 
                  Start running your trade business like a well-oiled machine.
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
                    <EnhancedCard
                      variant="gradient"
                      className="h-full"
                      onClick={() => setSelectedService(index)}
                    >
                      <div className="p-8">
                        <div className="flex items-center mb-6">
                          <motion.div
                            animate={{ rotate: selectedService === index ? 360 : 0 }}
                            transition={{ duration: 0.5 }}
                            className={`p-4 rounded-2xl bg-gradient-to-br from-${service.color}-500/20 to-${service.color}-600/20 mr-4`}
                          >
                            <service.icon className={`w-8 h-8 text-${service.color}-400`} />
                          </motion.div>
                          <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                        </div>
                        <p className="text-gray-300 mb-6">{service.description}</p>
                        
                        <AnimatePresence>
                          {selectedService === index && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-3 mt-4 pt-4 border-t border-gray-700"
                            >
                              {service.benefits.map((benefit, i) => (
                                <motion.div
                                  key={benefit}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                  <span className="text-gray-200">{benefit}</span>
                                </motion.div>
                              ))}
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

        {/* Pain Points Section with Solutions */}
        <SectionAnimation>
          <section className="py-32 bg-gray-800/50 relative">
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
                  We Solve Your Biggest
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Trade Challenges</span>
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {painPoints.map((point, index) => (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02 }}
                    className="group bg-red-900/20 border border-red-500/30 p-6 rounded-xl hover:bg-red-900/30 transition-all duration-300"
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
                    >
                      <point.icon className="w-8 h-8 text-red-400 mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">{point.title}</h3>
                    <p className="text-gray-400 mb-4">{point.problem}</p>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 font-semibold">{point.solution}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </SectionAnimation>

        {/* Testimonials Section */}
        <SectionAnimation>
          <section className="py-32">
            <div className="max-w-7xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Trade Business
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Success Stories</span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Real results from Brisbane trade businesses like yours
                </p>
              </motion.div>

              <TestimonialSection testimonials={testimonials} variant="cards" />
            </div>
          </section>
        </SectionAnimation>

        {/* Interactive ROI Calculator */}
        <SectionAnimation>
          <section id="roi-calculator" className="py-32 bg-gray-800/50 relative">
            <BackgroundPattern variant="mesh" opacity={0.05} />
            <div className="max-w-4xl mx-auto px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Calculate Your
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Trade Business ROI</span>
                </h2>
                <p className="text-xl text-gray-300">
                  See how much more revenue you could generate with agile methods
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl"
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-white mb-2">Current Monthly Jobs</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="number" 
                        value={roiInputs.monthlyJobs}
                        onChange={(e) => setRoiInputs({...roiInputs, monthlyJobs: parseInt(e.target.value) || 0})}
                        className="w-full pl-12 pr-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white mb-2">Average Job Value ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="number" 
                        value={roiInputs.avgJobValue}
                        onChange={(e) => setRoiInputs({...roiInputs, avgJobValue: parseInt(e.target.value) || 0})}
                        className="w-full pl-12 pr-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white mb-2">Number of Crew Members</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="number" 
                        value={roiInputs.crewSize}
                        onChange={(e) => setRoiInputs({...roiInputs, crewSize: parseInt(e.target.value) || 0})}
                        className="w-full pl-12 pr-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="pt-6 border-t border-gray-700"
                  >
                    <div className="bg-green-900/30 border border-green-500/30 p-6 rounded-xl">
                      <h3 className="text-xl font-bold text-white mb-6">Your Potential with Agile:</h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Additional Jobs/Month:</span>
                            <motion.span
                              key={roiResults.additionalJobs}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-green-400 font-bold text-xl"
                            >
                              +{roiResults.additionalJobs}
                            </motion.span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Extra Monthly Revenue:</span>
                            <motion.span
                              key={roiResults.extraRevenue}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-green-400 font-bold text-xl"
                            >
                              ${roiResults.extraRevenue.toLocaleString()}
                            </motion.span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Annual Increase:</span>
                            <motion.span
                              key={roiResults.annualIncrease}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-green-400 font-bold text-xl"
                            >
                              ${roiResults.annualIncrease.toLocaleString()}
                            </motion.span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">ROI in 6 Months:</span>
                            <motion.span
                              key={roiResults.roi}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-green-400 font-bold text-xl"
                            >
                              {roiResults.roi}%
                            </motion.span>
                          </div>
                        </div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 pt-6 border-t border-green-900/50"
                      >
                        <CircularProgress 
                          value={Math.min(roiResults.roi, 100)} 
                          maxValue={100}
                          label="ROI Score"
                          size="lg"
                          className="mx-auto"
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>
        </SectionAnimation>

        {/* Final CTA Section */}
        <SectionAnimation>
          <section className="py-32 relative">
            <AnimatedGradient className="opacity-10" />
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your
                  <br />
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Trade Business?
                  </span>
                </h2>
                
                <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
                  Join 200+ Brisbane contractors who complete more jobs, win more bids, 
                  and scale their businesses with agile methods.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/consultation"
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-xl"
                    >
                      <Calendar className="w-6 h-6" />
                      Get Free Trade Business Assessment
                      <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Worth $497</span>
                    </Link>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/agile-marketing/team-training"
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                    >
                      <Users className="w-6 h-6" />
                      Crew Training Programs
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
                    { icon: Shield, text: '100% Money Back Guarantee' },
                    { icon: Award, text: 'Certified Agile Experts' },
                    { icon: TrendingUp, text: '32% Average Growth' }
                  ].map((badge, index) => (
                    <motion.div
                      key={badge.text}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-2 text-gray-400"
                    >
                      <badge.icon className="w-5 h-5 text-green-400" />
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