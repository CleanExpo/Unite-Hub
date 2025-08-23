"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Globe,
  Link as LinkIcon,
  Award,
  Building2,
  Users,
  Newspaper,
  MapPin,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Target,
  ArrowRight,
  Clock
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function LocalLinkBuilding() {
  const linkOpportunities = [
    {
      source: "Local Business Directories",
      difficulty: "Easy",
      authority: "Medium",
      quantity: "50+",
      examples: [
        "Brisbane Business Directory",
        "Queensland Trade Directory",
        "Local Chamber of Commerce",
        "Industry associations"
      ],
      howTo: "Submit NAP + description",
      timeframe: "1 week"
    },
    {
      source: "Supplier & Partner Sites",
      difficulty: "Easy",
      authority: "High",
      quantity: "10-20",
      examples: [
        "Equipment suppliers",
        "Material manufacturers",
        "Insurance partners",
        "Franchise networks"
      ],
      howTo: "Request partner listing",
      timeframe: "2 weeks"
    },
    {
      source: "Local Media & News",
      difficulty: "Hard",
      authority: "Very High",
      quantity: "2-5",
      examples: [
        "Brisbane Times",
        "Quest Newspapers",
        "Trade magazines",
        "Industry blogs"
      ],
      howTo: "Press releases, expert quotes",
      timeframe: "Ongoing"
    },
    {
      source: "Community Sponsorships",
      difficulty: "Medium",
      authority: "High",
      quantity: "5-10",
      examples: [
        "Local sports teams",
        "School events",
        "Charity fundraisers",
        "Community festivals"
      ],
      howTo: "Sponsor + get listed",
      timeframe: "3 months"
    },
    {
      source: "Customer Testimonials",
      difficulty: "Easy",
      authority: "Medium",
      quantity: "20+",
      examples: [
        "Real estate agents",
        "Property managers",
        "Other contractors",
        "Business clients"
      ],
      howTo: "Case studies with backlinks",
      timeframe: "Ongoing"
    }
  ];

  const citationSources = [
    { platform: "Google Business Profile", priority: "Essential", cost: "Free", time: "30 min" },
    { platform: "Bing Places", priority: "Essential", cost: "Free", time: "20 min" },
    { platform: "Apple Maps", priority: "Essential", cost: "Free", time: "20 min" },
    { platform: "Facebook Business", priority: "Essential", cost: "Free", time: "15 min" },
    { platform: "Yelp", priority: "High", cost: "Free", time: "20 min" },
    { platform: "Yellow Pages", priority: "High", cost: "Free", time: "15 min" },
    { platform: "True Local", priority: "High", cost: "Free", time: "15 min" },
    { platform: "HiPages", priority: "Medium", cost: "$99/month", time: "30 min" },
    { platform: "ServiceSeeking", priority: "Medium", cost: "$66/month", time: "30 min" },
    { platform: "Oneflare", priority: "Medium", cost: "Pay per lead", time: "20 min" }
  ];

  const linkMetrics = [
    {
      metric: "Domain Authority",
      target: "> 30",
      importance: "High",
      description: "Higher DA = more link power"
    },
    {
      metric: "Local Relevance",
      target: "Brisbane/QLD",
      importance: "Critical",
      description: "Local links > national links"
    },
    {
      metric: "Industry Relevance",
      target: "Trade/Construction",
      importance: "High",
      description: "Niche relevance matters"
    },
    {
      metric: "Link Diversity",
      target: "50+ domains",
      importance: "Medium",
      description: "Variety looks natural"
    }
  ];

  const outreachTemplates = [
    {
      type: "Supplier Request",
      subject: "Partner listing request - [Your Business]",
      template: `Hi [Name],

We've been using [Product] for our plumbing business for [X years] with great results.

Would it be possible to be listed as a certified contractor on your website? We'd be happy to provide:
- A testimonial
- Before/after photos
- Case study

Our website: [URL]

Thanks,
[Your name]`,
      successRate: "65%"
    },
    {
      type: "Local Media Pitch",
      subject: "Local trade expert available - [Topic]",
      template: `Hi [Journalist],

Noticed your article on [Topic]. As a [X-year] veteran Brisbane plumber, I can offer insights on:

- Current trade shortage impacts
- Price trends in construction
- Safety innovations

Happy to provide quotes or data for future stories.

Best,
[Your name]
[Credentials]`,
      successRate: "25%"
    }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Local Link Building for Contractors',
          description: 'Strategic local link building services for contractors. Build high-quality local citations, partnerships, and backlinks to dominate local search results.',
          provider: 'Unite Group',
          serviceType: 'Local Link Building & Citation Services',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/local-seo-contractors" className="text-gray-400 hover:text-white transition">
              Local SEO
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-blue-400">Local Link Building</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-10 h-10 text-blue-400" />
              <span className="px-4 py-1 bg-blue-400/10 border border-blue-400/30 rounded-full text-blue-400 text-sm">
                Build Local Authority
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Get Links That{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Actually Rank You
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Build powerful local links and citations that Google trusts. 
              No dodgy tactics - just white-hat strategies that dominate local search.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <LinkIcon className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm text-gray-400">Citations needed</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Award className="w-6 h-6 text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">DA 30+</div>
                <div className="text-sm text-gray-400">Target authority</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <MapPin className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">Local</div>
                <div className="text-sm text-gray-400">Brisbane focus</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">+45%</div>
                <div className="text-sm text-gray-400">Ranking boost</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Link Opportunities */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              5 Best <span className="gradient-text">Local Link Sources</span>
            </h2>
            <p className="text-xl text-gray-400">
              Where to get powerful local backlinks
            </p>
          </div>

          <div className="space-y-6">
            {linkOpportunities.map((opportunity, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">{opportunity.source}</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        opportunity.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        opportunity.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {opportunity.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        opportunity.authority === 'Very High' ? 'bg-purple-500/20 text-purple-400' :
                        opportunity.authority === 'High' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {opportunity.authority} Authority
                      </span>
                    </div>
                    <p className="text-gray-400">Target: {opportunity.quantity} links</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Examples</h4>
                    <ul className="space-y-2">
                      {opportunity.examples.map((example, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">How to Get Links</h4>
                    <p className="text-gray-300 mb-3">{opportunity.howTo}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400 font-semibold">{opportunity.timeframe}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Citation Sources */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Top 10 <span className="gradient-text">Citation Platforms</span>
            </h2>
            <p className="text-xl text-gray-400">
              Build consistent NAP across the web
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Platform</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Cost</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Setup Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {citationSources.map((source, index) => (
                  <tr key={index} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{source.platform}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        source.priority === 'Essential' ? 'bg-red-500/20 text-red-400' :
                        source.priority === 'High' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {source.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{source.cost}</td>
                    <td className="px-6 py-4 text-cyan-400">{source.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-white">NAP Consistency Critical:</span> Your Name, Address, and Phone must be 
                EXACTLY the same across all citations. One inconsistency can hurt rankings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Link Metrics */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Link Quality <span className="gradient-text">Metrics</span>
            </h2>
            <p className="text-xl text-gray-400">
              Not all links are created equal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {linkMetrics.map((metric, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <Target className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{metric.metric}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Target</span>
                    <span className="text-cyan-400 font-semibold">{metric.target}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Importance</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      metric.importance === 'Critical' ? 'bg-red-500/20 text-red-400' :
                      metric.importance === 'High' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {metric.importance}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outreach Templates */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Proven <span className="gradient-text">Outreach Templates</span>
            </h2>
            <p className="text-xl text-gray-400">
              Copy these templates that actually get responses
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {outreachTemplates.map((template, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{template.type}</h3>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded">
                    {template.successRate} success
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Subject Line</p>
                  <p className="text-cyan-400 font-mono text-sm">{template.subject}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">Email Template</p>
                  <pre className="bg-black/30 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap font-mono">
                    {template.template}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Build <span className="gradient-text">Powerful Local Links?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Let us build your local link profile the right way
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105">
              Get Link Building Service
            </Link>
            <Link href="/local-seo-contractors" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Local SEO
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}