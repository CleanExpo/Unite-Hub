import Link from 'next/link';
import { ArrowRight, Search, Users, Target, BarChart3, MapPin, TrendingUp, AlertCircle, Calendar, Hammer, Calculator, FileText } from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

const metrics = [
  { icon: Users, label: 'Customer Insights', value: '2,847+', color: 'text-emerald-400' },
  { icon: MapPin, label: 'Service Areas Analyzed', value: '127', color: 'text-blue-400' },
  { icon: Target, label: 'Conversion Rate Lift', value: '+67%', color: 'text-purple-400' },
  { icon: BarChart3, label: 'Revenue Opportunities', value: '$4.2M', color: 'text-amber-400' }
];

const services = [
  {
    icon: Users,
    title: 'Customer Profile Analysis',
    description: 'Discover who really needs your services, what they can afford, and why they choose competitors over you'
  },
  {
    icon: MapPin,
    title: 'Service Area Research',
    description: 'Find untapped suburbs with high demand, understand local pricing expectations, and identify growth zones'
  },
  {
    icon: Target,
    title: 'New Service Validation',
    description: 'Test demand for new services before investing, understand pricing tolerance, and reduce launch risk'
  },
  {
    icon: TrendingUp,
    title: 'Growth Opportunity Mapping',
    description: 'Identify commercial vs residential opportunities, seasonal patterns, and expansion possibilities'
  }
];

const researchFindings = [
  {
    title: "Why 67% of homeowners skip the cheapest quote",
    insights: [
      "Trust indicators matter more than price",
      "Insurance approval capability is crucial",
      "Same-day service worth 20% premium"
    ],
    action: "Add trust badges and insurance logos prominently"
  },
  {
    title: "The $850K commercial opportunity you're missing",
    insights: [
      "Strata managers control 40% of local work",
      "Preventive maintenance contracts available",
      "Prefer quarterly billing arrangements"
    ],
    action: "Create strata-specific service packages"
  },
  {
    title: "Why Friday jobs book themselves",
    insights: [
      "Emergency rates acceptable on weekends",
      "Homeowners available to supervise",
      "Less competition from other trades"
    ],
    action: "Promote weekend availability heavily"
  }
];

const caseStudies = [
  {
    business: "All Seasons HVAC",
    size: "8 employees, $3.4M revenue",
    challenge: "Losing commercial contracts to bigger competitors",
    research: "Surveyed 50 property managers about vendor selection",
    finding: "24/7 response time mattered more than company size",
    result: "Won 12 strata contracts worth $850K by guaranteeing 2-hour response"
  },
  {
    business: "ProBuild Renovations",
    size: "6 employees, $2.8M revenue",
    challenge: "Quotes converting at only 15%",
    research: "Interviewed 30 lost prospects",
    finding: "Clients wanted payment plans, not cheaper prices",
    result: "Offering payment options increased conversion to 42%"
  },
  {
    business: "Lightning Electrical",
    size: "10 employees, $4.5M revenue",
    challenge: "Unsure which services to expand into",
    research: "Analyzed 500 customer inquiries and local demand",
    finding: "EV charger installation had 300% growth potential",
    result: "New service line generated $620K in first 6 months"
  }
];

export default function MarketResearchPage() {
  const serviceSchema = {
    type: 'Service' as const,
    name: 'Market Research Services for Trade Businesses',
    description: 'Customer insights and market data services helping Brisbane trades increase conversion by 67% and find $4.2M in opportunities. Specialized market research for contractors, plumbers, electricians, and HVAC businesses.',
    provider: 'Unite Group Agency',
    serviceType: 'Digital Marketing',
    areaServed: 'Brisbane, Queensland',
    hasOfferCatalog: {
      name: 'Market Research Services',
      itemListElement: [
        {
          name: 'Customer Profile Analysis',
          description: 'Discover who really needs your services, what they can afford, and why they choose competitors over you'
        },
        {
          name: 'Service Area Research',
          description: 'Find untapped suburbs with high demand, understand local pricing expectations, and identify growth zones'
        },
        {
          name: 'New Service Validation',
          description: 'Test demand for new services before investing, understand pricing tolerance, and reduce launch risk'
        },
        {
          name: 'Growth Opportunity Mapping',
          description: 'Identify commercial vs residential opportunities, seasonal patterns, and expansion possibilities'
        }
      ]
    }
  };

  const webPageSchema = {
    type: 'WebPage' as const,
    name: 'Market Research for Trade Businesses - Brisbane',
    description: 'Get customer insights and market data that increase conversion by 67% for Brisbane trades. Stop guessing what customers want.',
    url: 'https://unite-group.com.au/market-research',
    dateModified: new Date().toISOString().split('T')[0],
    publisher: {
      name: 'Unite Group Agency',
      url: 'https://unite-group.com.au'
    }
  };

  const localBusinessSchema = {
    type: 'LocalBusiness' as const,
    name: 'Unite Group Agency',
    description: 'Digital marketing agency specializing in market research services for Brisbane trades',
    url: 'https://unite-group.com.au',
    telephone: '+61730000000',
    email: 'info@unite-group.com.au',
    address: {
      streetAddress: '123 Eagle Street',
      addressLocality: 'Brisbane',
      addressRegion: 'QLD',
      postalCode: '4000',
      addressCountry: 'AU'
    },
    geo: {
      latitude: -27.4705,
      longitude: 153.0260
    },
    areaServed: 'Brisbane, Queensland',
    sameAs: [
      'https://www.facebook.com/unitegroupagency',
      'https://www.linkedin.com/company/unite-group-agency'
    ]
  };

  return (
    <>
      <SchemaMarkup schema={[serviceSchema, webPageSchema, localBusinessSchema]} />
      <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Research Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-full mb-8">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">CUSTOMER INSIGHTS</span>
            </div>
            <div className="h-4 w-px bg-emerald-500/30" />
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-gray-200">
              Know Your Market
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Know Your Customers
            </span>
            <br />
            <span className="text-white">Win More Jobs</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Stop guessing what customers want. Get real data on pricing, services, and opportunities that 
            <span className="text-emerald-400 font-semibold"> increase conversion by 67%</span> for Brisbane trades.
          </p>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl text-center hover:scale-105 transition-all duration-300"
              >
                <metric.icon className={`w-8 h-8 ${metric.color} mx-auto mb-3`} />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {metric.value}
                </div>
                <p className="text-sm text-gray-400">{metric.label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/consultation?service=market-research"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl hover:from-emerald-600 hover:to-blue-600 transition-all duration-300"
            >
              Get Free Market Analysis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="#opportunity-calculator"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl hover:bg-gray-700/50 hover:border-emerald-500/50 transition-all duration-300"
            >
              Calculate Market Size
              <Calculator className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-6">Helping Brisbane trades understand their market since 2019</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {['2,847+ Surveys', '127 Service Areas', '500+ Trade Businesses', '$42M Opportunities Found'].map((stat) => (
                <span
                  key={stat}
                  className="text-gray-300 font-semibold text-lg hover:opacity-100 transition-opacity"
                >
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Research Insights Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Market Insights That
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent"> Change Everything</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real research findings from Brisbane trade businesses that transformed 
              their approach and doubled their revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {researchFindings.map((finding, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl"
              >
                <h3 className="text-xl font-bold text-white mb-6">{finding.title}</h3>
                <div className="space-y-3 mb-6">
                  {finding.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300 text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-gray-700">
                  <p className="text-emerald-400 font-semibold text-sm">Your Action:</p>
                  <p className="text-white mt-2">{finding.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Research Services for
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent"> Trade Businesses</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get the customer insights and market data you need to make confident business decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-emerald-400/50 transition-all duration-500"
              >
                <div className="flex items-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 mr-4">
                    <service.icon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trade-Specific Research Areas */}
      <section className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What We Research for
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent"> Your Trade</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <Hammer className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Pricing Sweet Spots</h3>
              <p className="text-gray-400">What customers expect to pay and what they'll actually pay for quality work</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <Users className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Customer Preferences</h3>
              <p className="text-gray-400">Payment terms, scheduling preferences, and communication expectations</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <MapPin className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Geographic Opportunities</h3>
              <p className="text-gray-400">Underserved areas, growth suburbs, and competition density</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <Target className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Service Demand</h3>
              <p className="text-gray-400">Most requested services, seasonal patterns, and emerging needs</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <FileText className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Quote Win/Loss</h3>
              <p className="text-gray-400">Why you win or lose jobs and how to improve conversion</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <TrendingUp className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Growth Barriers</h3>
              <p className="text-gray-400">What's stopping you from scaling and how to overcome it</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-32 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Research That Transformed
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent"> Trade Businesses</span>
            </h2>
          </div>

          <div className="space-y-8">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{study.business}</h3>
                    <p className="text-gray-400 mb-4">{study.size}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-red-400 font-semibold mb-1">Challenge:</p>
                        <p className="text-gray-300">{study.challenge}</p>
                      </div>
                      <div>
                        <p className="text-blue-400 font-semibold mb-1">Research Method:</p>
                        <p className="text-gray-300">{study.research}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl">
                      <p className="text-emerald-400 font-semibold mb-2">Key Finding:</p>
                      <p className="text-white">{study.finding}</p>
                    </div>
                    <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl">
                      <p className="text-green-400 font-semibold mb-2">Result:</p>
                      <p className="text-white font-bold">{study.result}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Opportunity Calculator */}
      <section id="opportunity-calculator" className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Calculate Your
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent"> Market Opportunity</span>
            </h2>
            <p className="text-xl text-gray-300">
              See how much untapped revenue exists in your service area
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl">
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2">Your Trade</label>
                <select className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none">
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>HVAC</option>
                  <option>Construction</option>
                  <option>Roofing</option>
                  <option>Landscaping</option>
                  <option>Painting</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white mb-2">Service Area Population</label>
                <input 
                  type="number" 
                  placeholder="e.g., 50000"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Current Market Share (%)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 5"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Average Job Value ($)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 2500"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              
              <div className="pt-6 border-t border-gray-700">
                <div className="bg-emerald-900/30 border border-emerald-500/30 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-white mb-4">Your Market Opportunity:</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">Total Market Size: <span className="text-emerald-400 font-bold">$4.2M annually</span></p>
                    <p className="text-gray-300">Your Current Revenue: <span className="text-emerald-400 font-bold">$210K</span></p>
                    <p className="text-gray-300">Untapped Opportunity: <span className="text-emerald-400 font-bold">$3.99M</span></p>
                    <p className="text-gray-300">Achievable Growth (Next 12mo): <span className="text-emerald-400 font-bold">$420K</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Process Section */}
      <section className="py-32 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our Research
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent"> Process</span>
            </h2>
            <p className="text-xl text-gray-300">
              How we gather actionable insights for your trade business
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-emerald-400">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Define Goals</h3>
              <p className="text-gray-400">What decisions do you need to make?</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-emerald-400">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Gather Data</h3>
              <p className="text-gray-400">Surveys, interviews, and market analysis</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-emerald-400">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Find Insights</h3>
              <p className="text-gray-400">Identify patterns and opportunities</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-emerald-400">4</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Action Plan</h3>
              <p className="text-gray-400">Clear steps to capture opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop Guessing, Start
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Knowing Your Market</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Get the customer insights and market data that help Brisbane trades 
            increase conversion by 67% and find $4.2M in opportunities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 transition-all duration-300"
            >
              <Calendar className="w-6 h-6" />
              Get Free Market Analysis
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Worth $997</span>
            </Link>
            
            <Link
              href="/market-research/surveys"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <FileText className="w-6 h-6" />
              See Survey Examples
            </Link>
          </div>

          {/* Internal Links to Main Services */}
          <div className="mt-20 pt-12 border-t border-gray-700">
            <p className="text-gray-400 mb-8">Complete Business Intelligence for Trade Businesses:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="https://unite-group.com/initial-business-consultant" className="text-emerald-400 hover:text-emerald-300 underline">
                Business Consulting for Growth
              </Link>
              <Link href="https://unite-group.com/business-strategy-consulting" className="text-emerald-400 hover:text-emerald-300 underline">
                Strategic Planning Services
              </Link>
              <Link href="https://unite-group.com/expert-education-training" className="text-emerald-400 hover:text-emerald-300 underline">
                Business Training Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}