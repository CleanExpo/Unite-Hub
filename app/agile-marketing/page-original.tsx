import Link from 'next/link';
import { ArrowRight, Users, Zap, Target, BarChart3, Clock, RefreshCw, CheckCircle, Calendar, Wrench, HardHat, Truck, Calculator } from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

const metrics = [
  { icon: Clock, label: 'Jobs Completed Faster', value: '32%', color: 'text-green-400' },
  { icon: BarChart3, label: 'Quote Win Rate', value: '+45%', color: 'text-blue-400' },
  { icon: Users, label: 'Crew Utilization', value: '94%', color: 'text-purple-400' },
  { icon: Target, label: 'Customer Satisfaction', value: '4.9★', color: 'text-cyan-400' }
];

const services = [
  {
    icon: RefreshCw,
    title: 'Sprint-Based Project Management',
    description: 'Organize your trade jobs into 2-week sprints for better crew allocation and faster project completion'
  },
  {
    icon: Zap,
    title: 'Rapid Quote & Estimate System',
    description: 'Respond to customer inquiries 3x faster with agile estimation techniques that win more bids'
  },
  {
    icon: Users,
    title: 'Crew Coordination Training',
    description: 'Train your team leaders in daily standups and sprint planning to maximize productivity on-site'
  },
  {
    icon: Target,
    title: 'Customer Communication Framework',
    description: 'Keep clients updated with sprint reviews and transparent progress tracking for 5-star reviews'
  }
];

const benefits = [
  'Complete more jobs per month with same crew size',
  'Reduce downtime between projects by 40%',
  'Win more competitive bids with faster quotes',
  'Improve crew morale with clear daily goals',
  'Handle change orders without project delays',
  'Scale from 5 to 15 employees smoothly'
];

const tradeTestimonials = [
  {
    quote: "Agile sprints helped us go from 8 to 12 jobs per month with the same 6-person crew",
    author: "Mike's Plumbing",
    size: "6 employees, $2.8M revenue"
  },
  {
    quote: "Our quote response time dropped from 3 days to same-day. We're winning 45% more bids",
    author: "Brisbane Electrical Solutions",
    size: "9 employees, $4.2M revenue"
  },
  {
    quote: "Daily standups transformed our crew coordination. No more wasted trips or idle time",
    author: "Southside Construction",
    size: "12 employees, $6.5M revenue"
  }
];

export default function AgileMarketingPage() {
  const serviceSchema = {
    type: 'Service' as const,
    name: 'Agile Marketing Services for Trade Businesses',
    description: 'Sprint-based project management and agile marketing methods helping Brisbane trades complete 32% more jobs with the same crew size. Specialized for contractors, plumbers, electricians, and HVAC teams.',
    provider: 'Unite Group Agency',
    serviceType: 'Digital Marketing',
    areaServed: 'Brisbane, Queensland',
    hasOfferCatalog: {
      name: 'Agile Marketing Services',
      itemListElement: [
        {
          name: 'Sprint-Based Project Management',
          description: 'Organize trade jobs into 2-week sprints for better crew allocation and faster project completion'
        },
        {
          name: 'Rapid Quote & Estimate System',
          description: 'Respond to customer inquiries 3x faster with agile estimation techniques that win more bids'
        },
        {
          name: 'Crew Coordination Training',
          description: 'Train team leaders in daily standups and sprint planning to maximize productivity on-site'
        },
        {
          name: 'Customer Communication Framework',
          description: 'Keep clients updated with sprint reviews and transparent progress tracking for 5-star reviews'
        }
      ]
    }
  };

  const webPageSchema = {
    type: 'WebPage' as const,
    name: 'Agile Marketing for Trade Businesses - Brisbane',
    description: 'Complete 32% more jobs with agile project management methods adapted for contractors, plumbers, electricians, and HVAC teams in Brisbane.',
    url: 'https://unite-group.com.au/agile-marketing',
    dateModified: new Date().toISOString().split('T')[0],
    publisher: {
      name: 'Unite Group Agency',
      url: 'https://unite-group.com.au'
    }
  };

  const localBusinessSchema = {
    type: 'LocalBusiness' as const,
    name: 'Unite Group Agency',
    description: 'Digital marketing agency specializing in agile marketing services for Brisbane trades',
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
          {/* Trade Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-green-500/30 rounded-full mb-8">
            <div className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-300">FOR TRADESPEOPLE</span>
            </div>
            <div className="h-4 w-px bg-green-500/30" />
            <RefreshCw className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-gray-200">
              Sprint-Based Job Management
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Agile Methods
            </span>
            <br />
            <span className="text-white">For Trade Businesses</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Complete <span className="text-green-400 font-semibold">32% more jobs</span> with the same crew size. 
            Proven project management methods adapted for contractors, plumbers, electricians, and HVAC teams.
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
              href="/consultation?service=agile-trades"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-blue-500 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300"
            >
              Get Your Free Trade Business Assessment
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="#roi-calculator"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl hover:bg-gray-700/50 hover:border-green-500/50 transition-all duration-300"
            >
              Calculate Your ROI
              <Calculator className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-6">Trusted by 200+ trade businesses across Brisbane</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {['Master Builders', 'Local Electricians', 'Plumbing Contractors', 'HVAC Specialists', 'Landscaping Pros'].map((company) => (
                <span
                  key={company}
                  className="text-gray-300 font-semibold text-lg hover:opacity-100 transition-opacity"
                >
                  {company}
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

      {/* How This Helps Your Trade Business Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How Agile Transforms Your
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Trade Business</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Stop losing money to poor scheduling, slow quotes, and crew downtime. 
              Start running your trade business like a well-oiled machine, following <a href="https://business.qld.gov.au/running-business/marketing/strategy" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">Queensland government business strategy principles</a>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-green-400/50 transition-all duration-500"
              >
                <div className="flex items-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 mr-4">
                    <service.icon className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trade-Specific Pain Points Section */}
      <section className="py-32 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              We Solve Your Biggest
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Trade Challenges</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
              <Truck className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Crew Management Chaos</h3>
              <p className="text-gray-400 mb-4">Multiple jobs, different sites, who goes where?</p>
              <p className="text-green-400 font-semibold">Solution: Daily standups & sprint planning</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
              <Clock className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Slow Quote Response</h3>
              <p className="text-gray-400 mb-4">Losing jobs to faster competitors?</p>
              <p className="text-green-400 font-semibold">Solution: Agile estimation techniques</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
              <Wrench className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Project Delays</h3>
              <p className="text-gray-400 mb-4">Change orders throwing off your schedule?</p>
              <p className="text-green-400 font-semibold">Solution: Sprint-based flexibility</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
              <Users className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Invoice Tracking</h3>
              <p className="text-gray-400 mb-4">Chasing payments and losing cash flow?</p>
              <p className="text-green-400 font-semibold">Solution: Sprint-end billing cycles</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
              <Target className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Safety Compliance</h3>
              <p className="text-gray-400 mb-4">Toolbox talks eating into productivity?</p>
              <p className="text-green-400 font-semibold">Solution: Integrated safety standups following <a href="https://www.safework.qld.gov.au/safety-and-prevention" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">SafeWork Queensland standards</a></p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
              <BarChart3 className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Growth Bottlenecks</h3>
              <p className="text-gray-400 mb-4">Can't scale past 10 employees?</p>
              <p className="text-green-400 font-semibold">Solution: Scalable agile framework with <a href="https://www.qbcc.qld.gov.au/contractors/running-business/employing-staff" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">QBCC employment guidance</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trade Business
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Success Stories</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real results from Brisbane trade businesses like yours, using methodologies recommended by <a href="https://www.accc.gov.au/business/business-rights-protections/small-business" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">ACCC small business resources</a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tradeTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-white font-semibold">{testimonial.author}</p>
                  <p className="text-gray-400 text-sm">{testimonial.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi-calculator" className="py-32 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Calculate Your
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Trade Business ROI</span>
            </h2>
            <p className="text-xl text-gray-300">
              See how much more revenue you could generate with agile methods, based on <a href="https://developers.google.com/search/docs/fundamentals/how-search-works" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">Google's business optimization principles</a>
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl">
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2">Current Monthly Jobs</label>
                <input 
                  type="number" 
                  placeholder="e.g., 8"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Average Job Value ($)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 5000"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Number of Crew Members</label>
                <input 
                  type="number" 
                  placeholder="e.g., 6"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none"
                />
              </div>
              
              <div className="pt-6 border-t border-gray-700">
                <div className="bg-green-900/30 border border-green-500/30 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-white mb-4">Your Potential with Agile:</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">Additional Jobs/Month: <span className="text-green-400 font-bold">+3</span></p>
                    <p className="text-gray-300">Extra Monthly Revenue: <span className="text-green-400 font-bold">$15,000</span></p>
                    <p className="text-gray-300">Annual Revenue Increase: <span className="text-green-400 font-bold">$180,000</span></p>
                    <p className="text-gray-300">ROI in 6 Months: <span className="text-green-400 font-bold">287%</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Trade Businesses Choose
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"> Agile Methods</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl"
              >
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-white font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Trade Business?</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Join 200+ Brisbane contractors who complete more jobs, win more bids, and scale their businesses with agile methods.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transition-all duration-300"
            >
              <Calendar className="w-6 h-6" />
              Get Free Trade Business Assessment
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Worth $497</span>
            </Link>
            
            <Link
              href="/agile-marketing/team-training"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <Users className="w-6 h-6" />
              Crew Training Programs
            </Link>
          </div>

          {/* Internal Links to Main Services */}
          <div className="mt-20 pt-12 border-t border-gray-700">
            <p className="text-gray-400 mb-8">Related Services for Growing Your Trade Business:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="https://unite-group.com/initial-business-consultant" className="text-green-400 hover:text-green-300 underline">
                Business Consulting for Contractors
              </Link>
              <Link href="https://unite-group.com/custom-software-development" className="text-green-400 hover:text-green-300 underline">
                Custom Trade Software Solutions
              </Link>
              <Link href="https://unite-group.com/strategic-seo-services" className="text-green-400 hover:text-green-300 underline">
                Local SEO for Trade Businesses
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}