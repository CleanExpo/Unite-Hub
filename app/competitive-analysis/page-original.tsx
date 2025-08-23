import Link from 'next/link';
import { ArrowRight, Search, Target, Shield, BarChart3, MapPin, Users, DollarSign, Calendar, Wrench, TrendingUp, AlertTriangle } from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

const metrics = [
  { icon: MapPin, label: 'Competitors Analyzed', value: '847+', color: 'text-purple-400' },
  { icon: Target, label: 'Market Share Gained', value: '34%', color: 'text-cyan-400' },
  { icon: DollarSign, label: 'Pricing Optimized', value: '+22%', color: 'text-emerald-400' },
  { icon: Users, label: 'Jobs Won from Competitors', value: '156', color: 'text-amber-400' }
];

const services = [
  {
    icon: Search,
    title: 'Local Competitor Mapping',
    description: "Know exactly who you're competing with in your service area, their strengths, weaknesses, and how to beat them"
  },
  {
    icon: DollarSign,
    title: 'Pricing Intelligence',
    description: 'Discover what competitors charge, their service packages, and how to position your pricing to win more jobs'
  },
  {
    icon: Target,
    title: 'Service Gap Analysis',
    description: "Find profitable services your competitors aren't offering and dominate untapped market segments"
  },
  {
    icon: Shield,
    title: 'Reputation Monitoring',
    description: 'Track competitor reviews, complaints, and use their weaknesses to strengthen your market position'
  }
];

const competitorInsights = [
  {
    title: "Why Joe's Plumbing Gets More Calls",
    findings: [
      "Answers phone in 2 rings vs industry avg 5",
      "Offers same-day service guarantee",
      "Has 127 Google reviews (you have 12)"
    ],
    action: "Implement 24/7 answering service + review automation"
  },
  {
    title: "How Spark Electrical Wins Big Jobs",
    findings: [
      "Provides instant online quotes",
      "Shows up in top 3 Google results",
      "Targets commercial properties exclusively"
    ],
    action: "Build quote calculator + focus on residential niche"
  },
  {
    title: "Why BuildRight Charges 30% More",
    findings: [
      "Positions as premium quality provider",
      "Shows certifications prominently",
      "Offers 10-year workmanship warranty"
    ],
    action: "Highlight your certifications + extend warranty offer"
  }
];

const caseStudies = [
  {
    business: "Premier Roofing Brisbane",
    size: "8 employees, $3.8M revenue",
    challenge: "Losing 60% of quotes to cheaper competitors",
    analysis: "Discovered competitors had faster quote turnaround",
    result: "Implemented instant quoting, won 45% more jobs at higher prices"
  },
  {
    business: "Coastal HVAC Services",
    size: "6 employees, $2.4M revenue",
    challenge: "Unknown why competitors got commercial contracts",
    analysis: "Found competitors had specific certifications displayed",
    result: "Got certified, updated marketing, landed $800K in contracts"
  },
  {
    business: "Green Thumb Landscaping",
    size: "12 employees, $5.2M revenue",
    challenge: "Market leader taking all high-value projects",
    analysis: "Identified untapped eco-friendly landscaping niche",
    result: "Pivoted positioning, became the go-to for sustainable landscaping"
  }
];

export default function CompetitiveAnalysisPage() {
  const serviceSchema = {
    type: 'Service' as const,
    name: 'Competitive Analysis Services for Trade Businesses',
    description: 'Strategic competitor intelligence and market analysis helping Brisbane trades win 34% more quotes and beat their competition. Specialized competitive analysis for contractors, plumbers, electricians, and HVAC businesses.',
    provider: 'Unite Group Agency',
    serviceType: 'Digital Marketing',
    areaServed: 'Brisbane, Queensland',
    hasOfferCatalog: {
      name: 'Competitive Analysis Services',
      itemListElement: [
        {
          name: 'Local Competitor Mapping',
          description: 'Know exactly who you are competing with in your service area, their strengths, weaknesses, and how to beat them'
        },
        {
          name: 'Pricing Intelligence',
          description: 'Discover what competitors charge, their service packages, and how to position your pricing to win more jobs'
        },
        {
          name: 'Service Gap Analysis',
          description: 'Find profitable services your competitors are not offering and dominate untapped market segments'
        },
        {
          name: 'Reputation Monitoring',
          description: 'Track competitor reviews, complaints, and use their weaknesses to strengthen your market position'
        }
      ]
    }
  };

  const webPageSchema = {
    type: 'WebPage' as const,
    name: 'Competitive Analysis for Trade Businesses - Brisbane',
    description: 'Stop losing jobs to competitors. Get strategic intelligence and win 34% more quotes with competitive analysis for Brisbane trades.',
    url: 'https://unite-group.com.au/competitive-analysis',
    dateModified: new Date().toISOString().split('T')[0],
    publisher: {
      name: 'Unite Group Agency',
      url: 'https://unite-group.com.au'
    }
  };

  const localBusinessSchema = {
    type: 'LocalBusiness' as const,
    name: 'Unite Group Agency',
    description: 'Digital marketing agency specializing in competitive analysis services for Brisbane trades',
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
          {/* Competitor Intel Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-full mb-8">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">COMPETITOR INTEL</span>
            </div>
            <div className="h-4 w-px bg-purple-500/30" />
            <Search className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-200">
              Know Your Competition
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              Beat Your Competition
            </span>
            <br />
            <span className="text-white">Win More Jobs</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Stop losing jobs to competitors. Know exactly what they charge, how they market, 
            and <span className="text-purple-400 font-semibold">win 34% more quotes</span> with strategic intelligence.
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
              href="/consultation?service=competitive-analysis"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
            >
              Get Free Competitor Report
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="#competitor-audit"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl hover:bg-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
            >
              See Sample Analysis
              <Search className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-6">Intelligence that helps Brisbane trades dominate their market</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {['847+ Competitors Analyzed', '156 Market Leaders Dethroned', '34% Win Rate Increase', '$127M in Won Contracts'].map((stat) => (
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

      {/* Real Competitor Insights Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Real Intelligence on Your
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Local Competitors</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Stop guessing why competitors win jobs. Get actionable intelligence 
              on exactly what they do better and how to beat them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {competitorInsights.map((insight, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl"
              >
                <h3 className="text-xl font-bold text-white mb-6">{insight.title}</h3>
                <div className="space-y-3 mb-6">
                  {insight.findings.map((finding, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300 text-sm">{finding}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-gray-700">
                  <p className="text-green-400 font-semibold text-sm">Your Action:</p>
                  <p className="text-white mt-2">{insight.action}</p>
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
              Competitive Intelligence for
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Trade Businesses</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to know about your competitors to win more jobs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-purple-400/50 transition-all duration-500"
              >
                <div className="flex items-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 mr-4">
                    <service.icon className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Audit Sample */}
      <section id="competitor-audit" className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Sample Competitor
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Audit Report</span>
            </h2>
            <p className="text-xl text-gray-300">
              See what you'll discover about your top 3 competitors
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-3xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Competitor A: "QuickFix Plumbing"</h3>
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <p className="text-purple-400 font-semibold mb-2">Strengths:</p>
                    <ul className="text-gray-300 space-y-1 text-sm">
                      <li>• 24/7 emergency service</li>
                      <li>• 189 Google reviews (4.8 stars)</li>
                      <li>• Instant online booking</li>
                      <li>• $89 call-out fee (you charge $120)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <p className="text-red-400 font-semibold mb-2">Weaknesses:</p>
                    <ul className="text-gray-300 space-y-1 text-sm">
                      <li>• No warranty mentioned</li>
                      <li>• Poor website mobile experience</li>
                      <li>• Limited service area</li>
                      <li>• No commercial services</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Your Opportunities</h3>
                <div className="space-y-4">
                  <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl">
                    <p className="text-green-400 font-semibold mb-2">Quick Wins:</p>
                    <ul className="text-white space-y-1 text-sm">
                      <li>• Match their $89 call-out for first-time customers</li>
                      <li>• Implement review automation (get to 200+ reviews)</li>
                      <li>• Add online booking to your website</li>
                      <li>• Promote your 2-year warranty heavily</li>
                    </ul>
                  </div>
                  <div className="bg-cyan-900/30 border border-cyan-500/30 p-4 rounded-xl">
                    <p className="text-cyan-400 font-semibold mb-2">Market Gaps:</p>
                    <ul className="text-white space-y-1 text-sm">
                      <li>• Target commercial properties they ignore</li>
                      <li>• Expand to suburbs they don't service</li>
                      <li>• Offer preventive maintenance plans</li>
                      <li>• Create mobile-first booking experience</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-32 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How Brisbane Trades
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Beat Their Competition</span>
            </h2>
          </div>

          <div className="space-y-8">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl"
              >
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{study.business}</h3>
                    <p className="text-gray-400 text-sm mb-3">{study.size}</p>
                    <p className="text-red-400 font-semibold">Challenge:</p>
                    <p className="text-gray-300">{study.challenge}</p>
                  </div>
                  <div>
                    <p className="text-purple-400 font-semibold mb-2">What We Found:</p>
                    <p className="text-gray-300">{study.analysis}</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl">
                    <p className="text-green-400 font-semibold mb-2">Result:</p>
                    <p className="text-white font-semibold">{study.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Intelligence Section */}
      <section className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stop Guessing Your
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"> Pricing Strategy</span>
            </h2>
            <p className="text-xl text-gray-300">
              Know exactly what competitors charge and how to price to win
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-6">What You'll Discover:</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Competitor Pricing Matrix</p>
                    <p className="text-gray-400 text-sm">Exact prices for 20+ common services</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Value Proposition Gaps</p>
                    <p className="text-gray-400 text-sm">What extras justify higher prices</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Pricing Trends</p>
                    <p className="text-gray-400 text-sm">When competitors raise/lower prices</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Customer Segments</p>
                    <p className="text-gray-400 text-sm">Who pays premium vs budget prices</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wrench className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Service Packages</p>
                    <p className="text-gray-400 text-sm">How competitors bundle services</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Win/Loss Analysis</p>
                    <p className="text-gray-400 text-sm">Why you win or lose on price</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Dominate Your
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Competition?</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Get your free competitor analysis report and discover exactly how to win more 
            jobs, charge better prices, and dominate your local market.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
            >
              <Calendar className="w-6 h-6" />
              Get Free Competitor Report
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Worth $497</span>
            </Link>
            
            <Link
              href="/competitive-analysis/benchmarking"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <BarChart3 className="w-6 h-6" />
              See Benchmarking Tools
            </Link>
          </div>

          {/* Internal Links to Main Services */}
          <div className="mt-20 pt-12 border-t border-gray-700">
            <p className="text-gray-400 mb-8">Complete Business Intelligence Solutions:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="https://unite-group.com/business-strategy-consulting" className="text-purple-400 hover:text-purple-300 underline">
                Strategic Planning for Trades
              </Link>
              <Link href="https://unite-group.com/strategic-seo-services" className="text-purple-400 hover:text-purple-300 underline">
                Outrank Your Competitors
              </Link>
              <Link href="https://unite-group.com/quality-assurance-testing" className="text-purple-400 hover:text-purple-300 underline">
                Website & System Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}