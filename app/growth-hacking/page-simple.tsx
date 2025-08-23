import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap, Rocket, BarChart3, Target, Users, DollarSign, Calendar } from 'lucide-react';

const metrics = [
  { icon: BarChart3, label: 'Conversion Rate', value: '34%', color: 'text-cyan-400' },
  { icon: Target, label: 'Experiments Run', value: '2,847', color: 'text-purple-400' },
  { icon: Users, label: 'Users Acquired', value: '150K+', color: 'text-emerald-400' },
  { icon: DollarSign, label: 'Revenue Generated', value: '$50M+', color: 'text-amber-400' }
];

const services = [
  {
    icon: Rocket,
    title: 'Viral Marketing Campaigns',
    description: 'Design and execute viral loops and referral programs for exponential user growth'
  },
  {
    icon: BarChart3,
    title: 'A/B Testing & Experimentation',
    description: 'Continuous testing and optimization of conversion funnels and user journeys'
  },
  {
    icon: Target,
    title: 'Product-Led Growth Strategy',
    description: 'Implement PLG strategies to drive user acquisition through product excellence'
  },
  {
    icon: TrendingUp,
    title: 'Growth Analytics & Attribution',
    description: 'Advanced analytics setup for tracking growth metrics and attribution modeling'
  }
];

export default function GrowthHackingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Live Metrics Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-full mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-cyan-300">LIVE</span>
            </div>
            <div className="h-4 w-px bg-cyan-500/30" />
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-gray-200">
              287% Avg Growth in 6 Months
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Growth Hacking
            </span>
            <br />
            <span className="text-white">That Actually Works</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Data-driven experimentation and viral growth strategies that have generated 
            <span className="text-cyan-400 font-semibold"> $50M+ in revenue </span>
            for Brisbane businesses
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
              href="/contact?service=growth-hacking"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
            >
              Start Growth Analysis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl hover:bg-gray-700/50 hover:border-cyan-500/50 transition-all duration-300"
            >
              View Growth Services
              <BarChart3 className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-6">Trusted by Australia's fastest-growing companies</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {['TechStart Brisbane', 'SydneyScale', 'MelbourneGrowth', 'Aussie Unicorn', 'Digital Sydney'].map((company) => (
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

      {/* Services Section */}
      <section id="services" className="py-32 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our Growth Hacking
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Services</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Systematic experimentation and viral growth strategies that deliver measurable results
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

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Scale Your
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Growth Rate?</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Join companies that have achieved 200%+ growth with our proven growth hacking methodologies.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
            >
              <Calendar className="w-6 h-6" />
              Book Growth Strategy Call
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Free</span>
            </Link>
            
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <BarChart3 className="w-6 h-6" />
              View Case Studies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}