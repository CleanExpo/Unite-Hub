'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap, Rocket, BarChart3, Target, Users, DollarSign, Calendar, Hammer, Calculator, Phone, MapPin, CheckCircle, Star, Sparkles, Clock } from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';
import HeroSection from '@/components/HeroSection';
import AnimatedStats, { CircularStats, ComparisonStats } from '@/components/AnimatedStats';
import { CardGrid, FeatureCard, EnhancedCard } from '@/components/EnhancedCard';
import TestimonialSection from '@/components/TestimonialSection';
import BackgroundPattern, { AnimatedGradient } from '@/components/BackgroundPatterns';
import SectionAnimation, { StaggerChildren, FloatingElement, TypewriterText, Card3D } from '@/components/SectionAnimation';
import StartBuildingCTA from '@/components/StartBuildingCTA';
import TimeToValueMetrics from '@/components/TimeToValueMetrics';
import { motion } from 'framer-motion';

const metrics = [
  { icon: Phone, label: 'Lead Response Time', value: 5, suffix: ' min', color: 'blue' },
  { icon: Target, label: 'Google Reviews', value: 4.8, suffix: '★', color: 'purple', decimals: 1 },
  { icon: Users, label: 'Monthly Leads', value: 127, suffix: '+', color: 'green' },
  { icon: DollarSign, label: 'Revenue Growth', value: 287, prefix: '+', suffix: '%', color: 'orange' }
];

const services = [
  {
    icon: Rocket,
    title: 'Referral Program Design',
    description: 'Turn your happy customers into a sales force with automated referral systems that generate 3x more leads',
    stats: [
      { label: 'Referrals', value: '3x' },
      { label: 'Cost', value: '$0' },
      { label: 'Setup', value: '1 day' }
    ]
  },
  {
    icon: MapPin,
    title: 'Local Market Domination',
    description: 'Own your service area with hyper-local SEO, Google My Business optimization, and neighborhood targeting',
    stats: [
      { label: 'Rankings', value: '#1' },
      { label: 'Areas', value: '15+' },
      { label: 'Leads', value: '+250%' }
    ]
  },
  {
    icon: Phone,
    title: 'Instant Quote System',
    description: 'Beat competitors with automated quote calculators and instant response systems that convert 45% more leads',
    stats: [
      { label: 'Response', value: '5min' },
      { label: 'Convert', value: '45%' },
      { label: 'Win Rate', value: '+67%' }
    ]
  },
  {
    icon: TrendingUp,
    title: 'Review Generation Machine',
    description: 'Automate review requests and build 5-star reputation that brings in high-value jobs on autopilot',
    stats: [
      { label: 'Reviews', value: '50+' },
      { label: 'Rating', value: '4.8★' },
      { label: 'Trust', value: '+85%' }
    ]
  }
];

const tradeGrowthHacks = [
  {
    title: "The 5-Minute Quote Hack",
    problem: "Losing jobs to faster competitors",
    solution: "Automated quote calculator on website",
    result: "Win 45% more bids",
    icon: Zap,
    color: 'blue'
  },
  {
    title: "The Neighborhood Domination Strategy",
    problem: "Scattered jobs across the city",
    solution: "Target specific suburbs systematically",
    result: "3x job density, less travel",
    icon: MapPin,
    color: 'green'
  },
  {
    title: "The Review Avalanche System",
    problem: "Few online reviews",
    solution: "Automated review requests post-job",
    result: "50+ reviews in 90 days",
    icon: Star,
    color: 'purple'
  },
  {
    title: "The Crew Showcase Method",
    problem: "Customers don't trust new contractors",
    solution: "Video testimonials from crew members",
    result: "Trust score up 67%",
    icon: Users,
    color: 'orange'
  }
];

const testimonials = [
  {
    id: '1',
    name: 'Jason Mitchell',
    role: 'Owner',
    company: 'Brisbane Roofing Co',
    content: 'Unite Group transformed our lead generation completely. We went from 15 leads to 127 leads per month!',
    highlight: '8x increase in qualified leads',
    rating: 5,
    stats: [
      { label: 'Leads/month', value: '127' },
      { label: 'Conversion', value: '45%' },
      { label: 'Revenue', value: '+$1.8M' }
    ]
  },
  {
    id: '2',
    name: 'Mike Chen',
    role: 'Director',
    company: 'Elite Plumbing Services',
    content: 'The referral program they built generates 3x more referrals than word-of-mouth ever did.',
    highlight: 'Scaled from 5 to 9 employees',
    rating: 5,
    stats: [
      { label: 'Referrals', value: '3x' },
      { label: 'New Customers', value: '62/mo' },
      { label: 'Team Growth', value: '+80%' }
    ]
  },
  {
    id: '3',
    name: 'Paul Anderson',
    role: 'CEO',
    company: 'Northside Electrical',
    content: 'We increased prices by 20% and actually won MORE jobs. Game-changing strategy.',
    highlight: 'Revenue grew to $6.2M',
    rating: 5,
    stats: [
      { label: 'Price Increase', value: '+20%' },
      { label: 'Win Rate', value: '+35%' },
      { label: 'Revenue', value: '$6.2M' }
    ]
  }
];

const caseStudies = [
  {
    business: "Brisbane Roofing Co",
    size: "7 employees, $3.2M revenue",
    challenge: "Only getting 15 leads per month",
    solution: "Implemented local SEO + instant quote system",
    results: ["127 leads per month", "45% conversion rate", "$1.8M additional revenue"],
    color: 'blue'
  },
  {
    business: "Elite Plumbing Services",
    size: "5 employees, $1.8M revenue",
    challenge: "90% of work from word-of-mouth",
    solution: "Built referral program + Google Ads",
    results: ["3x referral rate", "62 new customers/month", "Scaled to 9 employees"],
    color: 'green'
  },
  {
    business: "Northside Electrical",
    size: "10 employees, $4.5M revenue",
    challenge: "Losing bids to cheaper competitors",
    solution: "Value-based pricing + review strategy",
    results: ["Increased prices 20%", "Won MORE jobs", "$6.2M revenue in 12 months"],
    color: 'purple'
  }
];

export default function GrowthHackingPageEnhanced() {
  const [selectedHack, setSelectedHack] = React.useState(0);
  const [hoveredService, setHoveredService] = React.useState<number | null>(null);

  const serviceSchema = {
    type: 'Service' as const,
    name: 'Growth Hacking Services for Trade Businesses',
    description: 'Proven growth strategies and digital marketing services helping Brisbane trades get 127+ quality leads per month.',
    provider: 'Unite Group Agency',
    serviceType: 'Digital Marketing',
    areaServed: 'Brisbane, Queensland'
  };

  return (
    <>
      <SchemaMarkup schema={serviceSchema} />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
        {/* Animated Background */}
        <AnimatedGradient className="opacity-10" />
        <BackgroundPattern variant="mesh" opacity={0.05} animated />
        
        {/* Enhanced Hero Section */}
        <HeroSection
          variant="animated"
          subtitle="127+ Leads Per Month Guaranteed"
          title={
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trade Business
              <span className="block">Growth Hacking</span>
            </span>
          }
          description="Proven strategies that get Brisbane trades 127+ quality leads per month without the BS"
          primaryCTA={{
            text: "Get Your Growth Plan",
            href: "/consultation",
            icon: Rocket
          }}
          secondaryCTA={{
            text: "See Real Results",
            href: "#case-studies"
          }}
          features={[
            "127+ leads per month",
            "45% conversion rate",
            "3x referral increase",
            "287% revenue growth"
          ]}
        >
          {/* Animated Metrics */}
          <div className="mt-12">
            <AnimatedStats stats={metrics} variant="dark" />
          </div>
        </HeroSection>

        {/* Author Info */}
        <section className="bg-gray-800/50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AuthorInfo 
              author={AUTHORS.phillMcGurk} 
              publishDate="January 15, 2025"
              readTime="10"
            />
          </div>
        </section>

        {/* Enhanced Services Section */}
        <section className="py-20 relative">
          <BackgroundPattern variant="dots" opacity={0.03} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionAnimation animation="fadeUp">
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-5xl font-black mb-4">
                  <TypewriterText text="Growth Hacking Arsenal" />
                </h2>
                <p className="text-xl text-gray-400">Battle-tested strategies that actually work for trades</p>
              </div>
            </SectionAnimation>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, idx) => (
                <Card3D key={idx}>
                  <EnhancedCard
                    title={service.title}
                    description={service.description}
                    icon={service.icon}
                    stats={service.stats}
                    variant={idx === 0 ? 'gradient' : 'default'}
                    color={idx === 0 ? 'blue' : idx === 1 ? 'green' : idx === 2 ? 'purple' : 'orange'}
                    onMouseEnter={() => setHoveredService(idx)}
                    onMouseLeave={() => setHoveredService(null)}
                  />
                </Card3D>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Growth Hacks Section */}
        <section className="py-20 bg-gray-900/50 relative">
          <BackgroundPattern variant="lines" opacity={0.02} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionAnimation animation="fadeUp">
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-5xl font-black mb-4">Trade-Specific Growth Hacks</h2>
                <p className="text-xl text-gray-400">Stolen from trades doing $10M+ per year</p>
              </div>
            </SectionAnimation>
            
            {/* Interactive Hack Selector */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {tradeGrowthHacks.map((hack, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedHack(idx)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    selectedHack === idx 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <hack.icon className="inline w-5 h-5 mr-2" />
                  {hack.title}
                </motion.button>
              ))}
            </div>
            
            {/* Selected Hack Display */}
            <motion.div
              key={selectedHack}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
                <div className="flex items-center mb-6">
                  <FloatingElement duration={3}>
                    {React.createElement(tradeGrowthHacks[selectedHack].icon, { 
                      className: `w-12 h-12 text-${tradeGrowthHacks[selectedHack].color}-400 mr-4` 
                    })}
                  </FloatingElement>
                  <h3 className="text-3xl font-bold text-cyan-400">
                    {tradeGrowthHacks[selectedHack].title}
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-500/20 p-3 rounded-lg">
                      <span className="text-red-400 font-bold text-lg">Problem</span>
                    </div>
                    <p className="text-xl text-gray-300 flex-1 pt-3">
                      {tradeGrowthHacks[selectedHack].problem}
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-green-500/20 p-3 rounded-lg">
                      <span className="text-green-400 font-bold text-lg">Solution</span>
                    </div>
                    <p className="text-xl text-gray-300 flex-1 pt-3">
                      {tradeGrowthHacks[selectedHack].solution}
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-500/20 p-3 rounded-lg">
                      <span className="text-yellow-400 font-bold text-lg">Result</span>
                    </div>
                    <p className="text-2xl text-white font-bold flex-1 pt-3">
                      {tradeGrowthHacks[selectedHack].result}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Time to Value Section */}
        <section className="py-20 bg-gray-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TimeToValueMetrics />
          </div>
        </section>

        {/* Enhanced Case Studies with Testimonials */}
        <section id="case-studies" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionAnimation animation="fadeUp">
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-5xl font-black mb-4">Real Brisbane Trade Success Stories</h2>
                <p className="text-xl text-gray-400">These numbers are 100% real (we have the receipts)</p>
              </div>
            </SectionAnimation>
            
            {/* Testimonials Carousel */}
            <TestimonialSection
              testimonials={testimonials}
              variant="carousel"
              autoPlay={true}
              showStats={true}
            />
            
            {/* Case Study Cards */}
            <StaggerChildren className="grid lg:grid-cols-3 gap-8 mt-12">
              {caseStudies.map((study, idx) => (
                <EnhancedCard
                  key={idx}
                  title={study.business}
                  description={study.size}
                  variant="gradient"
                  color={study.color as any}
                  badge="Success Story"
                  stats={[
                    { label: "Before", value: study.challenge.split(' ')[2] },
                    { label: "After", value: study.results[0].split(' ')[0] },
                    { label: "Growth", value: study.results[2].split(' ')[0] }
                  ]}
                />
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="py-20 bg-gradient-to-br from-blue-900/30 to-purple-900/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionAnimation animation="scale">
              <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center">Calculate Your Growth Potential</h2>
                
                <ComparisonStats
                  before={{ label: "Current Monthly Leads", value: "15" }}
                  after={{ label: "With Growth Hacking", value: "127+" }}
                />
                
                <div className="mt-8 text-center">
                  <p className="text-2xl font-bold text-cyan-400 mb-4">
                    That\'s 8.5x More Business Opportunities
                  </p>
                  <StartBuildingCTA
                    variant="primary"
                    productType="Growth System"
                    timeEstimate="30 days"
                    price="ROI Guaranteed"
                  />
                </div>
              </div>
            </SectionAnimation>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
          <BackgroundPattern variant="circles" opacity={0.1} animated />
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
            <SectionAnimation animation="scale">
              <h2 className="text-4xl lg:text-5xl font-black mb-6">Ready to 10x Your Trade Business?</h2>
              <p className="text-xl mb-8">Join 100+ Brisbane trades getting 127+ leads per month</p>
            </SectionAnimation>
            
            <SectionAnimation animation="fadeUp" delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <StartBuildingCTA
                  variant="hero"
                  productType="Growth System"
                  timeEstimate="30-day results"
                  price="ROI guaranteed"
                />
                
                <a
                  href="tel:+61730000000"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call 07 3000 0000
                </a>
              </div>
            </SectionAnimation>
          </div>
        </section>
      </div>
    </>
  );
}