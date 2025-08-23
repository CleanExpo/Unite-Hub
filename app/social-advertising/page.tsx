import Link from 'next/link';
import { ArrowRight, Facebook, Linkedin, Instagram, Target, DollarSign, Users, Phone, Calendar, MapPin, Calculator, MessageSquare } from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

const metrics = [
  { icon: Phone, label: 'Leads Per Month', value: '87+', color: 'text-blue-400' },
  { icon: DollarSign, label: 'Cost Per Lead', value: '$12', color: 'text-emerald-400' },
  { icon: Target, label: 'Conversion Rate', value: '8.4%', color: 'text-purple-400' },
  { icon: Users, label: 'Local Reach', value: '45K+', color: 'text-amber-400' }
];

const services = [
  {
    icon: Facebook,
    title: 'Facebook Lead Generation',
    description: 'Target homeowners in your service area who need your services right now with instant quote forms'
  },
  {
    icon: Instagram,
    title: 'Instagram Before/After Ads',
    description: 'Showcase your best work to local audiences and build trust with visual proof of quality'
  },
  {
    icon: MapPin,
    title: 'Local Area Targeting',
    description: 'Reach only people within your service radius who can actually hire you'
  },
  {
    icon: MessageSquare,
    title: 'Messenger Chat Campaigns',
    description: 'Instant quote requests through Facebook Messenger that convert 3x better than forms'
  }
];

const adExamples = [
  {
    platform: "Facebook",
    headline: "Need an Emergency Plumber in Brisbane North?",
    body: "24/7 service, fixed pricing, 5-star reviews",
    results: "127 leads at $11.50 each",
    audience: "Homeowners 35-65 within 15km"
  },
  {
    platform: "Instagram",
    headline: "Brisbane Bathroom Renovations",
    body: "Before/after gallery showcase",
    results: "34 quote requests, 8 jobs booked",
    audience: "Home renovation enthusiasts"
  },
  {
    platform: "Facebook",
    headline: "Free Air Con Service Check",
    body: "Book before summer rush, save $150",
    results: "289 bookings in 14 days",
    audience: "Properties with AC units 5+ years old"
  }
];

const caseStudies = [
  {
    business: "Quick Response Electrical",
    size: "5 employees, $2.1M revenue",
    challenge: "Relying only on word-of-mouth referrals",
    campaign: "Facebook emergency service ads + Instagram portfolio",
    results: ["87 leads per month", "$12 cost per lead", "23 new regular customers", "$380K additional revenue"]
  },
  {
    business: "Premium Bathrooms Brisbane",
    size: "8 employees, $3.8M revenue",
    challenge: "Long sales cycle, needed quality leads",
    campaign: "Instagram before/after ads + Facebook retargeting",
    results: ["42 bathroom quotes monthly", "$2,800 average job value", "18% conversion rate", "$510K in 6 months"]
  },
  {
    business: "All Seasons HVAC",
    size: "12 employees, $5.2M revenue",
    challenge: "Seasonal demand fluctuations",
    campaign: "Year-round maintenance campaigns + seasonal promotions",
    results: ["Smoothed revenue by 40%", "156 maintenance contracts", "$45K monthly recurring", "Full schedule year-round"]
  }
];

export default function SocialAdvertisingPage() {
  const serviceSchema = {
    type: 'Service' as const,
    name: 'Social Advertising Services for Trade Businesses',
    description: 'Facebook and Instagram advertising services helping Brisbane trades get 87+ quality leads per month at just $12 each. Specialized social advertising for contractors, plumbers, electricians, and HVAC businesses.',
    provider: 'Unite Group Agency',
    serviceType: 'Digital Marketing',
    areaServed: 'Brisbane, Queensland',
    hasOfferCatalog: {
      name: 'Social Advertising Services',
      itemListElement: [
        {
          name: 'Facebook Lead Generation',
          description: 'Target homeowners in your service area who need your services right now with instant quote forms'
        },
        {
          name: 'Instagram Before/After Ads',
          description: 'Showcase your best work to local audiences and build trust with visual proof of quality'
        },
        {
          name: 'Local Area Targeting',
          description: 'Reach only people within your service radius who can actually hire you'
        },
        {
          name: 'Messenger Chat Campaigns',
          description: 'Instant quote requests through Facebook Messenger that convert 3x better than forms'
        }
      ]
    }
  };

  const webPageSchema = {
    type: 'WebPage' as const,
    name: 'Facebook & Instagram Ads for Trade Businesses - Brisbane',
    description: 'Get 87+ quality leads per month at just $12 each with proven social advertising for Brisbane trades. Stop boosting posts that dont work.',
    url: 'https://unite-group.com.au/social-advertising',
    dateModified: new Date().toISOString().split('T')[0],
    publisher: {
      name: 'Unite Group Agency',
      url: 'https://unite-group.com.au'
    }
  };

  const localBusinessSchema = {
    type: 'LocalBusiness' as const,
    name: 'Unite Group Agency',
    description: 'Digital marketing agency specializing in social advertising services for Brisbane trades',
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
          {/* Social Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-full mb-8">
            <div className="flex items-center gap-2">
              <Facebook className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">SOCIAL ADS</span>
            </div>
            <div className="h-4 w-px bg-blue-500/30" />
            <Phone className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-200">
              87+ Leads Per Month
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Facebook & Instagram Ads
            </span>
            <br />
            <span className="text-white">That Bring Jobs</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Stop boosting posts that don't work. Get <span className="text-blue-400 font-semibold">87+ quality leads per month</span> 
            at just $12 each with proven social advertising for Brisbane trades.
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
              href="/consultation?service=social-advertising"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
            >
              Get Free Ad Strategy Session
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="#roi-calculator"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl hover:bg-gray-700/50 hover:border-blue-500/50 transition-all duration-300"
            >
              Calculate Your ROI
              <Calculator className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-6">Generating leads for 200+ Brisbane trades since 2019</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {['$2.8M Ad Spend Managed', '14,000+ Leads Generated', '$12 Avg Cost/Lead', '8.4% Conversion Rate'].map((stat) => (
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
            author={AUTHORS.sarahMitchell} 
            publishDate="January 2025"
            readTime="5"
          />
        </div>
      </section>

      {/* Ad Examples Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ads That Actually
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Generate Leads</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real examples of social ads that brought quality leads to Brisbane trade businesses, compliant with <a href="https://www.accc.gov.au/business/advertising-promoting-your-business/social-media-marketing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">ACCC social media marketing guidelines</a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {adExamples.map((ad, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  {ad.platform === "Facebook" ? (
                    <Facebook className="w-6 h-6 text-blue-400" />
                  ) : (
                    <Instagram className="w-6 h-6 text-purple-400" />
                  )}
                  <span className="text-white font-semibold">{ad.platform} Ad</span>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-xl mb-4">
                  <h3 className="text-white font-bold mb-2">{ad.headline}</h3>
                  <p className="text-gray-300 text-sm">{ad.body}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-gray-400 text-sm">
                    <span className="text-blue-400">Audience:</span> {ad.audience}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-green-400 font-bold">{ad.results}</p>
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
              Social Advertising for
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Trade Businesses</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Targeted campaigns that reach homeowners and businesses who need your services now, using <a href="https://business.qld.gov.au/running-business/marketing/online-marketing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Queensland government online marketing best practices</a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-blue-400/50 transition-all duration-500"
              >
                <div className="flex items-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mr-4">
                    <service.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Social Ads Work Section */}
      <section className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Social Ads Work for
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Brisbane Trades</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <MapPin className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Hyper-Local Targeting</h3>
              <p className="text-gray-400">Target only suburbs you service, not wasting money on leads too far away. Learn about <a href="https://www.qbcc.qld.gov.au/contractors/getting-licence/licence-classes-categories" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">QBCC licensing requirements</a> for different service areas.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <Users className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Homeowner Demographics</h3>
              <p className="text-gray-400">Reach property owners aged 35-65 with household income to afford your services</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <Phone className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Instant Contact</h3>
              <p className="text-gray-400">Click-to-call and messenger chat get you talking to customers immediately</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <Target className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Interest Targeting</h3>
              <p className="text-gray-400">Find people interested in home improvement, renovations, and maintenance</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <DollarSign className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Budget Control</h3>
              <p className="text-gray-400">Start with $20/day and scale up as leads come in. Follow <a href="https://www.safework.qld.gov.au/businesses-and-employers/managing-your-business-risks" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">SafeWork Queensland risk management</a> principles when scaling operations.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <Calendar className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Seasonal Campaigns</h3>
              <p className="text-gray-400">Ramp up during busy seasons, scale back during quiet periods</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-32 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trade Businesses Winning with
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Social Ads</span>
            </h2>
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
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                      <p className="text-blue-400 font-semibold mb-1">Campaign:</p>
                      <p className="text-gray-300">{study.campaign}</p>
                    </div>
                  </div>
                  <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl">
                    <p className="text-green-400 font-bold text-xl mb-4">Results:</p>
                    <ul className="space-y-3">
                      {study.results.map((result, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
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

      {/* ROI Calculator Section */}
      <section id="roi-calculator" className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Calculate Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Social Ad ROI</span>
            </h2>
            <p className="text-xl text-gray-300">
              See how many leads and jobs you could generate with social advertising, following <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Google's helpful content guidelines</a> for quality marketing
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl">
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2">Monthly Ad Budget ($)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 1000"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Average Job Value ($)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 2500"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Your Closing Rate (%)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 25"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                />
              </div>
              
              <div className="pt-6 border-t border-gray-700">
                <div className="bg-blue-900/30 border border-blue-500/30 p-6 rounded-xl mb-4">
                  <h3 className="text-xl font-bold text-white mb-4">Your Expected Results:</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">Monthly Leads: <span className="text-blue-400 font-bold">83</span></p>
                    <p className="text-gray-300">Cost Per Lead: <span className="text-blue-400 font-bold">$12</span></p>
                    <p className="text-gray-300">Jobs Won: <span className="text-blue-400 font-bold">21</span></p>
                    <p className="text-gray-300">Revenue Generated: <span className="text-blue-400 font-bold">$52,500</span></p>
                  </div>
                </div>
                <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl">
                  <p className="text-green-400 font-bold text-center text-xl">
                    ROI: 5,150% ($51.50 return per $1 spent)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Package Options */}
      <section className="py-32 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Social Ad Packages for
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Every Budget</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <p className="text-gray-400 mb-4">Test the waters</p>
              <p className="text-3xl font-bold text-white mb-6">$500<span className="text-lg text-gray-400">/month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="text-gray-300">• $500 ad spend included</li>
                <li className="text-gray-300">• 1 campaign</li>
                <li className="text-gray-300">• Basic targeting</li>
                <li className="text-gray-300">• Monthly report</li>
                <li className="text-gray-300">• ~40 leads expected</li>
              </ul>
              <Link href="/consultation" className="block text-center py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
                Get Started
              </Link>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-blue-500/30 p-8 rounded-3xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">POPULAR</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Growth</h3>
              <p className="text-gray-400 mb-4">Scale your leads</p>
              <p className="text-3xl font-bold text-white mb-6">$1,500<span className="text-lg text-gray-400">/month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="text-gray-300">• $1,000 ad spend included</li>
                <li className="text-gray-300">• 3 campaigns</li>
                <li className="text-gray-300">• Advanced targeting</li>
                <li className="text-gray-300">• Weekly optimization</li>
                <li className="text-gray-300">• ~85 leads expected</li>
              </ul>
              <Link href="/consultation" className="block text-center py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition">
                Get Started
              </Link>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-2">Dominate</h3>
              <p className="text-gray-400 mb-4">Own your market</p>
              <p className="text-3xl font-bold text-white mb-6">$3,000<span className="text-lg text-gray-400">/month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="text-gray-300">• $2,000+ ad spend</li>
                <li className="text-gray-300">• Unlimited campaigns</li>
                <li className="text-gray-300">• Full funnel strategy</li>
                <li className="text-gray-300">• Daily optimization</li>
                <li className="text-gray-300">• 170+ leads expected</li>
              </ul>
              <Link href="/consultation" className="block text-center py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get 87+ Leads
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Every Month?</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Join 200+ Brisbane trades getting quality leads from Facebook and Instagram 
            at just $12 per lead. Stop wasting money on boosted posts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
            >
              <Calendar className="w-6 h-6" />
              Get Free Ad Strategy Session
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Worth $497</span>
            </Link>
            
            <Link
              href="/social-advertising/facebook-ads"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <Facebook className="w-6 h-6" />
              See Ad Examples
            </Link>
          </div>

          {/* Internal Links to Main Services */}
          <div className="mt-20 pt-12 border-t border-gray-700">
            <p className="text-gray-400 mb-8">Complete Digital Marketing for Trade Businesses:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="https://unite-group.com/strategic-seo-services" className="text-blue-400 hover:text-blue-300 underline">
                SEO for Long-term Growth
              </Link>
              <Link href="https://unite-group.com/custom-software-development" className="text-blue-400 hover:text-blue-300 underline">
                Lead Management Systems
              </Link>
              <Link href="https://unite-group.com/quality-assurance-testing" className="text-blue-400 hover:text-blue-300 underline">
                Landing Page Optimization
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}