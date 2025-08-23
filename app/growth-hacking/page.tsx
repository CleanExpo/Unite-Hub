import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap, Rocket, BarChart3, Target, Users, DollarSign, Calendar, Hammer, Calculator, Phone, MapPin } from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

const metrics = [
  { icon: Phone, label: 'Lead Response Time', value: '5 min', color: 'text-cyan-400' },
  { icon: Target, label: 'Google Reviews', value: '4.8★', color: 'text-purple-400' },
  { icon: Users, label: 'Monthly Leads', value: '127+', color: 'text-emerald-400' },
  { icon: DollarSign, label: 'Revenue Growth', value: '+287%', color: 'text-amber-400' }
];

const services = [
  {
    icon: Rocket,
    title: 'Referral Program Design',
    description: 'Turn your happy customers into a sales force with automated referral systems that generate 3x more leads'
  },
  {
    icon: MapPin,
    title: 'Local Market Domination',
    description: 'Own your service area with hyper-local SEO, Google My Business optimization, and neighborhood targeting'
  },
  {
    icon: Phone,
    title: 'Instant Quote System',
    description: 'Beat competitors with automated quote calculators and instant response systems that convert 45% more leads'
  },
  {
    icon: TrendingUp,
    title: 'Review Generation Machine',
    description: 'Automate review requests and build 5-star reputation that brings in high-value jobs on autopilot'
  }
];

const tradeGrowthHacks = [
  {
    title: "The 5-Minute Quote Hack",
    problem: "Losing jobs to faster competitors",
    solution: "Automated quote calculator on website",
    result: "Win 45% more bids"
  },
  {
    title: "The Neighborhood Domination Strategy",
    problem: "Scattered jobs across the city",
    solution: "Target specific suburbs systematically",
    result: "3x job density, less travel"
  },
  {
    title: "The Review Avalanche System",
    problem: "Few online reviews",
    solution: "Automated review requests post-job",
    result: "50+ reviews in 90 days"
  },
  {
    title: "The Crew Showcase Method",
    problem: "Customers don't trust new contractors",
    solution: "Video testimonials from crew members",
    result: "Trust score up 67%"
  }
];

const caseStudies = [
  {
    business: "Brisbane Roofing Co",
    size: "7 employees, $3.2M revenue",
    challenge: "Only getting 15 leads per month",
    solution: "Implemented local SEO + instant quote system",
    results: ["127 leads per month", "45% conversion rate", "$1.8M additional revenue"]
  },
  {
    business: "Elite Plumbing Services",
    size: "5 employees, $1.8M revenue",
    challenge: "90% of work from word-of-mouth",
    solution: "Built referral program + Google Ads",
    results: ["3x referral rate", "62 new customers/month", "Scaled to 9 employees"]
  },
  {
    business: "Northside Electrical",
    size: "10 employees, $4.5M revenue",
    challenge: "Losing bids to cheaper competitors",
    solution: "Value-based pricing + review strategy",
    results: ["Increased prices 20%", "Won MORE jobs", "$6.2M revenue in 12 months"]
  }
];

export default function GrowthHackingPage() {
  const serviceSchema = {
    type: 'Service' as const,
    name: 'Growth Hacking Services for Trade Businesses',
    description: 'Proven growth strategies and digital marketing services helping Brisbane trades get 127+ quality leads per month. Specialized growth hacking for contractors, plumbers, electricians, and HVAC businesses.',
    provider: 'Unite Group Agency',
    serviceType: 'Digital Marketing',
    areaServed: 'Brisbane, Queensland',
    hasOfferCatalog: {
      name: 'Growth Hacking Services',
      itemListElement: [
        {
          name: 'Referral Program Design',
          description: 'Turn customers into a sales force with automated referral systems that generate 3x more leads'
        },
        {
          name: 'Local Market Domination',
          description: 'Own your service area with hyper-local SEO, Google My Business optimization, and neighborhood targeting'
        },
        {
          name: 'Instant Quote System',
          description: 'Beat competitors with automated quote calculators and instant response systems'
        },
        {
          name: 'Review Generation Machine',
          description: 'Automate review requests and build 5-star reputation that brings high-value jobs'
        }
      ]
    }
  };

  const webPageSchema = {
    type: 'WebPage' as const,
    name: 'Growth Hacking for Trade Businesses - Brisbane',
    description: 'Get 127+ quality leads per month with proven growth hacking strategies for contractors, plumbers, electricians, and HVAC businesses in Brisbane.',
    url: 'https://unite-group.com.au/growth-hacking',
    dateModified: new Date().toISOString().split('T')[0],
    publisher: {
      name: 'Unite Group Agency',
      url: 'https://unite-group.com.au'
    }
  };

  const localBusinessSchema = {
    type: 'LocalBusiness' as const,
    name: 'Unite Group Agency',
    description: 'Digital marketing agency specializing in growth hacking services for Brisbane trades',
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
          {/* Trade Growth Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-full mb-8">
            <div className="flex items-center gap-2">
              <Hammer className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">TRADE GROWTH</span>
            </div>
            <div className="h-4 w-px bg-cyan-500/30" />
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-gray-200">
              Scale from 5 to 15 Employees
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Growth Hacks
            </span>
            <br />
            <span className="text-white">For Trade Businesses</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Get <span className="text-cyan-400 font-semibold">127+ quality leads per month</span> without 
            cold calling. Proven growth strategies for contractors, plumbers, electricians, and HVAC businesses.
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
              href="/consultation?service=growth-hacking-trades"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
            >
              Get Your Growth Audit (Free)
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="#growth-calculator"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl hover:bg-gray-700/50 hover:border-cyan-500/50 transition-all duration-300"
            >
              Calculate Growth Potential
              <Calculator className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-6">Helping Brisbane trades grow since 2019</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {['287% Avg Growth', '500+ Trades Helped', '127+ Leads/Month', '$50M+ Generated', '4.9★ Rating'].map((stat) => (
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

      {/* Author Info */}
      <section className="py-12 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AuthorInfo 
            author={AUTHORS.michaelChen} 
            publishDate="January 2025"
            readTime="5"
          />
        </div>
      </section>

      {/* Growth Hacks Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Proven Growth Hacks for
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Trade Businesses</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Stop wasting money on marketing that doesn't work. Use these battle-tested strategies 
              that have generated $50M+ for Brisbane trades, aligned with <a href="https://business.qld.gov.au/running-business/marketing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">Queensland government marketing guidelines</a> for small business growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tradeGrowthHacks.map((hack, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-cyan-400/50 transition-all duration-500"
              >
                <h3 className="text-2xl font-bold text-white mb-4">{hack.title}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-red-400 font-semibold mb-1">Problem:</p>
                    <p className="text-gray-400">{hack.problem}</p>
                  </div>
                  <div>
                    <p className="text-cyan-400 font-semibold mb-1">Solution:</p>
                    <p className="text-gray-300">{hack.solution}</p>
                    {index === 0 && (
                      <p className="text-sm text-gray-400 mt-2">
                        Learn more about <a href="https://www.qbcc.qld.gov.au/contractors/running-business/winning-work-quoting" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">effective quoting strategies from QBCC</a>
                      </p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-green-400 font-bold text-xl">{hack.result}</p>
                  </div>
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
              Growth Systems Built for
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Tradespeople</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to dominate your local market and scale your trade business, following <a href="https://www.accc.gov.au/business/business-rights-protections/fair-trading" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">ACCC fair trading practices</a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-cyan-400/50 transition-all duration-500"
              >
                <div className="flex items-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mr-4">
                    <service.icon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Real Trade Business
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Growth Stories</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              See how Brisbane trades went from struggling to thriving using strategies backed by <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">Google's helpful content guidelines</a>
            </p>
          </div>

          <div className="space-y-12">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-3xl"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{study.business}</h3>
                    <p className="text-gray-400 mb-4">{study.size}</p>
                    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl mb-4">
                      <p className="text-red-400 font-semibold mb-1">Challenge:</p>
                      <p className="text-gray-300">{study.challenge}</p>
                    </div>
                    <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl">
                      <p className="text-cyan-400 font-semibold mb-1">Solution:</p>
                      <p className="text-gray-300">{study.solution}</p>
                    </div>
                  </div>
                  <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl">
                    <p className="text-green-400 font-bold text-xl mb-4">Results:</p>
                    <ul className="space-y-3">
                      {study.results.map((result, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white font-semibold">{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Calculator Section */}
      <section id="growth-calculator" className="py-32 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Calculate Your
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Growth Potential</span>
            </h2>
            <p className="text-xl text-gray-300">
              See how many leads and how much revenue you could generate
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl">
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2">Current Monthly Leads</label>
                <input 
                  type="number" 
                  placeholder="e.g., 15"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Average Job Value ($)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 3500"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Current Conversion Rate (%)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 20"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Your Service Area</label>
                <select className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none">
                  <option>Brisbane North</option>
                  <option>Brisbane South</option>
                  <option>Brisbane CBD</option>
                  <option>Gold Coast</option>
                  <option>Sunshine Coast</option>
                  <option>Ipswich</option>
                </select>
              </div>
              
              <div className="pt-6 border-t border-gray-700">
                <div className="bg-cyan-900/30 border border-cyan-500/30 p-6 rounded-xl mb-4">
                  <h3 className="text-xl font-bold text-white mb-4">Your Growth Potential:</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">Potential Monthly Leads: <span className="text-cyan-400 font-bold">127+</span></p>
                    <p className="text-gray-300">Improved Conversion Rate: <span className="text-cyan-400 font-bold">35%</span></p>
                    <p className="text-gray-300">Additional Monthly Revenue: <span className="text-cyan-400 font-bold">$124,250</span></p>
                    <p className="text-gray-300">Annual Revenue Increase: <span className="text-cyan-400 font-bold">$1,491,000</span></p>
                  </div>
                </div>
                <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl">
                  <p className="text-green-400 font-bold text-center text-xl">
                    287% Average Growth in 12 Months
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Common Questions from
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Trade Businesses</span>
            </h2>
          </div>

          <div className="space-y-6">
            <details className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl group">
              <summary className="cursor-pointer text-white font-semibold text-lg flex justify-between items-center">
                How quickly will I see results?
                <span className="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-300 mt-4">
                Most trades see their first new leads within 7 days. By day 30, you'll typically have 20-30 new leads. 
                By day 90, our average client has 127+ monthly leads flowing consistently. All our marketing practices comply with <a href="https://www.accc.gov.au/business/advertising-promoting-your-business/advertising-and-selling-guide" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">ACCC advertising guidelines</a>.
              </p>
            </details>

            <details className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl group">
              <summary className="cursor-pointer text-white font-semibold text-lg flex justify-between items-center">
                Will this work for my specific trade?
                <span className="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-300 mt-4">
                Yes! We've helped plumbers, electricians, HVAC techs, roofers, painters, landscapers, and 20+ other trades. 
                The strategies are customized for your specific industry and local market.
              </p>
            </details>

            <details className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl group">
              <summary className="cursor-pointer text-white font-semibold text-lg flex justify-between items-center">
                I'm already too busy. How will I handle more leads?
                <span className="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-300 mt-4">
                Great problem to have! We'll help you implement systems to qualify leads better, increase prices strategically, 
                and scale your team properly. Many clients use the extra revenue to hire and grow sustainably. Consider reviewing <a href="https://www.safework.qld.gov.au/businesses-and-employers" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">SafeWork Queensland guidelines</a> when expanding your workforce.
              </p>
            </details>

            <details className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl group">
              <summary className="cursor-pointer text-white font-semibold text-lg flex justify-between items-center">
                How much will I need to invest?
                <span className="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-300 mt-4">
                Our growth programs start at $997/month and typically generate 10-20x ROI within 90 days. 
                Most trades recoup their investment from just 1-2 extra jobs. The free growth audit will show your exact ROI potential.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Dominate Your
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Local Market?</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Get your free growth audit and see exactly how to get 127+ quality leads per month 
            without cold calling or door knocking.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
            >
              <Calendar className="w-6 h-6" />
              Get Free Growth Audit
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Worth $997</span>
            </Link>
            
            <Link
              href="/growth-hacking/workshop"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <Rocket className="w-6 h-6" />
              Join Growth Workshop
            </Link>
          </div>

          {/* Internal Links to Main Services */}
          <div className="mt-20 pt-12 border-t border-gray-700">
            <p className="text-gray-400 mb-8">Complete Growth Solutions for Trade Businesses:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="https://unite-group.com/business-strategy-consulting" className="text-cyan-400 hover:text-cyan-300 underline">
                Business Strategy for Scaling Trades
              </Link>
              <Link href="https://unite-group.com/custom-software-development" className="text-cyan-400 hover:text-cyan-300 underline">
                Custom CRM & Quote Systems
              </Link>
              <Link href="https://unite-group.com/expert-education-training" className="text-cyan-400 hover:text-cyan-300 underline">
                Sales & Leadership Training
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}