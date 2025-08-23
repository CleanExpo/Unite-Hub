"use client";

import React from 'react';
import Link from 'next/link';
import { 
  MapPin,
  Search,
  Star,
  Phone,
  Globe,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  BarChart3,
  Navigation,
  MessageSquare,
  Building
} from 'lucide-react';
import LeadCalculator from '@/components/LeadCalculator';
import CompetitorAnalyzer from '@/components/CompetitorAnalyzer';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function LocalSEOContractors() {
  const localRankingFactors = [
    {
      factor: "Google Business Profile",
      importance: "Critical",
      impact: "38%",
      tasks: [
        "Claim and verify listing",
        "Add 20+ photos monthly",
        "Get 5+ reviews monthly",
        "Post weekly updates",
        "Answer all Q&As"
      ],
      timeToImpact: "2-4 weeks"
    },
    {
      factor: "Local Citations",
      importance: "High",
      impact: "25%",
      tasks: [
        "List on 50+ directories",
        "Consistent NAP everywhere",
        "Industry-specific sites",
        "Local chamber listing",
        "Supplier directories"
      ],
      timeToImpact: "4-6 weeks"
    },
    {
      factor: "Website Local SEO",
      importance: "High",
      impact: "20%",
      tasks: [
        "Location pages for each area",
        "Local schema markup",
        "City + service keywords",
        "Embedded Google maps",
        "Local content strategy"
      ],
      timeToImpact: "6-8 weeks"
    },
    {
      factor: "Reviews & Ratings",
      importance: "Critical",
      impact: "17%",
      tasks: [
        "4.7+ star average",
        "Respond to all reviews",
        "Review velocity matters",
        "Keywords in reviews",
        "Multi-platform presence"
      ],
      timeToImpact: "Ongoing"
    }
  ];

  const competitorAnalysis = {
    topCompetitors: [
      { name: "Brisbane Emergency Plumber", reviews: 487, rating: 4.8, ranking: "#1" },
      { name: "Northside Electrical Co", reviews: 312, rating: 4.7, ranking: "#2" },
      { name: "Your Business", reviews: 43, rating: 4.3, ranking: "#8" }
    ],
    gaps: [
      "444 fewer reviews than #1",
      "No posts in last 30 days",
      "Missing from 12 key directories",
      "No location-specific pages"
    ],
    opportunities: [
      "Emergency plumber Brisbane - 2,400 searches/month",
      "Plumber near me - 8,100 searches/month",
      "24 hour plumber Brisbane - 1,300 searches/month",
      "Blocked drain Brisbane - 1,900 searches/month"
    ]
  };

  const localSEOPackages = [
    {
      name: "Local Starter",
      price: "$497/month",
      features: [
        "Google Business Profile optimization",
        "20 local citations",
        "Review management setup",
        "Basic local content",
        "Monthly reporting"
      ],
      results: "Page 1 in 3-4 months"
    },
    {
      name: "Local Dominator",
      price: "$997/month",
      features: [
        "Everything in Starter",
        "50+ premium citations",
        "5 location pages monthly",
        "Review automation",
        "Competitor tracking",
        "Local link building"
      ],
      results: "Top 3 in 2-3 months"
    },
    {
      name: "Market Leader",
      price: "$1,997/month",
      features: [
        "Everything in Dominator",
        "Multi-location management",
        "Local PPC campaigns",
        "Voice search optimization",
        "Video SEO",
        "Dedicated account manager"
      ],
      results: "#1 position + 3-pack domination"
    }
  ];

  const metrics = [
    { icon: MapPin, label: 'Local Visibility', value: '3-Mile Radius', color: 'text-blue-400' },
    { icon: Phone, label: 'Call Increase', value: '+312%', color: 'text-green-400' },
    { icon: Star, label: 'Review Growth', value: '15/month', color: 'text-yellow-400' },
    { icon: TrendingUp, label: 'Lead Growth', value: '+185%', color: 'text-purple-400' }
  ];

  const caseStudy = {
    business: "Gold Coast Roofing Solutions",
    challenge: "Invisible online, 2 leads/month, dominated by franchises",
    strategy: [
      "Optimized Google Business Profile with 150+ photos",
      "Built 10 suburb-specific landing pages",
      "Implemented review automation (4.9★, 234 reviews)",
      "Created 73 local citations with perfect NAP",
      "Published 2 local guides weekly"
    ],
    results: {
      visibility: "Page 1 for 47 keywords",
      leads: "2 → 67 leads/month",
      calls: "+420% phone calls",
      revenue: "+$127K/month"
    },
    timeline: "4 months to domination"
  };

  const localKeywords = [
    { keyword: "plumber brisbane", volume: "3,600/mo", difficulty: "Hard", cpc: "$18.50" },
    { keyword: "emergency plumber near me", volume: "2,900/mo", difficulty: "Medium", cpc: "$24.30" },
    { keyword: "plumber northside", volume: "720/mo", difficulty: "Easy", cpc: "$16.80" },
    { keyword: "24 hour plumber brisbane", volume: "1,300/mo", difficulty: "Medium", cpc: "$22.10" },
    { keyword: "blocked drains brisbane", volume: "1,900/mo", difficulty: "Medium", cpc: "$19.40" }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Local SEO for Contractors',
          description: 'Professional local SEO services for contractors. Increase visibility in local search results, attract more qualified leads, and grow your contracting business online.',
          provider: 'Unite Group',
          serviceType: 'Local Search Engine Optimization',
          areaServed: ['Brisbane', 'Queensland', 'Australia'],
          hasOfferCatalog: {
            name: 'Local SEO Services',
            itemListElement: [
              {
                name: 'Google Business Profile Optimization',
                description: 'Complete optimization of your Google Business Profile for maximum local visibility'
              },
              {
                name: 'Local Link Building',
                description: 'Strategic link building campaigns focused on local citations and partnerships'
              },
              {
                name: 'Review Management',
                description: 'Comprehensive review management and reputation building services'
              }
            ]
          }
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <span className="text-blue-400">Local SEO</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-10 h-10 text-blue-400" />
                <span className="px-4 py-1 bg-blue-400/10 border border-blue-400/30 rounded-full text-blue-400 text-sm">
                  Dominate Your 5km Radius
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
                Own Page 1 for{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  "Plumber Near Me"
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Be the only contractor your neighbors see. Dominate Google's 3-pack, 
                crush competitors, and get 10x more calls from local customers actively searching for your services.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="https://unitegroup.com.au/consultation" 
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white text-center hover:shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105">
                  Get Free Local SEO Audit
                </Link>
                <Link href="#packages" 
                  className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white text-center hover:bg-white/20 transition">
                  View SEO Packages
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Results in 30 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No lock-in contracts</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                  <metric.icon className={`w-8 h-8 ${metric.color} mb-3`} />
                  <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-400">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Competitor Gap Analysis */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Your <span className="gradient-text">Competition Analysis</span>
            </h2>
            <p className="text-xl text-gray-400">
              See exactly why you're losing to competitors
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Current Rankings</h3>
              <div className="space-y-4">
                {competitorAnalysis.topCompetitors.map((comp, index) => (
                  <div key={index} className={`p-4 ${comp.name === "Your Business" ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5'} rounded-lg`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{comp.name}</span>
                      <span className={`text-lg font-bold ${comp.ranking === "#1" ? 'text-green-400' : comp.ranking === "#8" ? 'text-red-400' : 'text-yellow-400'}`}>
                        {comp.ranking}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{comp.reviews} reviews</span>
                      <span className="text-yellow-400">{comp.rating}★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Your Gaps
                </h4>
                <ul className="space-y-2">
                  {competitorAnalysis.gaps.map((gap, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="text-red-400">✗</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Opportunities
                </h4>
                <ul className="space-y-2">
                  {competitorAnalysis.opportunities.map((opp, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="text-green-400">→</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local Ranking Factors */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4 Pillars of <span className="gradient-text">Local Domination</span>
            </h2>
            <p className="text-xl text-gray-400">
              Master these to outrank any competitor
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {localRankingFactors.map((factor, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{factor.factor}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        factor.importance === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {factor.importance}
                      </span>
                      <span className="text-cyan-400 font-bold">{factor.impact} of ranking</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Impact in</p>
                    <p className="text-white font-semibold">{factor.timeToImpact}</p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {factor.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keyword Opportunities */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              High-Value <span className="gradient-text">Local Keywords</span>
            </h2>
            <p className="text-xl text-gray-400">
              Keywords that bring paying customers
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Keyword</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Monthly Searches</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Difficulty</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Cost Per Click</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {localKeywords.map((kw, index) => (
                  <tr key={index} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{kw.keyword}</td>
                    <td className="px-6 py-4 text-gray-300">{kw.volume}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        kw.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        kw.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {kw.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-cyan-400">{kw.cpc}</td>
                    <td className="px-6 py-4">
                      <div className="flex">
                        {[...Array(kw.difficulty === 'Easy' ? 5 : kw.difficulty === 'Medium' ? 4 : 3)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Case Study: <span className="gradient-text">{caseStudy.business}</span>
            </h2>
            <p className="text-xl text-gray-400">
              From invisible to unstoppable in 4 months
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">The Challenge</h3>
                <p className="text-gray-300 mb-6">{caseStudy.challenge}</p>
                
                <h3 className="text-xl font-bold text-white mb-4">The Strategy</h3>
                <ul className="space-y-2">
                  {caseStudy.strategy.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6">The Results</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Visibility</p>
                    <p className="text-xl font-bold text-cyan-400">{caseStudy.results.visibility}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Lead Generation</p>
                    <p className="text-xl font-bold text-green-400">{caseStudy.results.leads}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Phone Calls</p>
                    <p className="text-xl font-bold text-blue-400">{caseStudy.results.calls}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Revenue Impact</p>
                    <p className="text-xl font-bold text-green-400">{caseStudy.results.revenue}</p>
                  </div>
                </div>
                
                <p className="mt-6 text-center text-white font-semibold">
                  {caseStudy.timeline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Packages */}
      <section id="packages" className="py-20 px-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Local SEO <span className="gradient-text">Domination Packages</span>
            </h2>
            <p className="text-xl text-gray-400">
              Choose your path to local dominance
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {localSEOPackages.map((pkg, index) => (
              <div key={index} className={`bg-white/5 backdrop-blur border ${index === 1 ? 'border-blue-400/50 scale-105' : 'border-white/10'} rounded-xl p-8 relative`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold text-cyan-400 mb-6">{pkg.price}</div>
                
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Expected Results</p>
                  <p className="text-white font-semibold">{pkg.results}</p>
                </div>
                
                <Link href="https://unitegroup.com.au/consultation" 
                  className={`mt-6 block text-center px-6 py-3 ${index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-white/10'} rounded-lg font-bold text-white hover:scale-105 transition`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-Pages Navigation */}
      <section className="py-20 px-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Master Every Aspect of <span className="gradient-text">Local SEO</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/local-seo-contractors/google-business-profile" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Building className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
                Google Business Profile
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Optimize your GBP for maximum visibility
              </p>
              <span className="text-blue-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/local-seo-contractors/local-link-building" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Globe className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
                Local Link Building
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Build authority with local backlinks
              </p>
              <span className="text-blue-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/local-seo-contractors/review-management" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Star className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
                Review Management
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Get more 5-star reviews automatically
              </p>
              <span className="text-blue-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Lead Calculator Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Calculate Your <span className="gradient-text">Lead Generation Potential</span>
          </h2>
          <LeadCalculator />
        </div>
      </section>

      {/* Competitor Analyzer Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Analyze Your <span className="gradient-text">Competition</span>
          </h2>
          <CompetitorAnalyzer />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Dominate Your Local Market?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get found by every customer searching for your services
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105">
              Get Free Local SEO Audit
            </Link>
            <Link href="https://unitegroup.com.au/services" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              View All Services
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            Free audit includes competitor analysis, keyword research, and 90-day action plan
          </p>
        </div>
      </section>
      </div>
    </>
  );
}