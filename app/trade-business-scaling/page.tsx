"use client";

import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Rocket,
  Building2,
  MapPin,
  Award,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  BarChart3,
  Briefcase,
  Shield,
  Settings
} from 'lucide-react';
import ROICalculator from '@/components/ROICalculator';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function TradeBusinessScaling() {
  const scalingStages = [
    {
      stage: "Stage 1: Owner-Operator",
      size: "1-3 people",
      revenue: "$200K-500K",
      challenges: [
        "Doing everything yourself",
        "No time for growth",
        "Feast or famine cycle"
      ],
      focus: "Systems & delegation",
      nextStep: "Hire first full-time employee"
    },
    {
      stage: "Stage 2: Small Crew",
      size: "4-8 people",
      revenue: "$500K-1.5M",
      challenges: [
        "Quality control",
        "Cash flow management",
        "Finding good workers"
      ],
      focus: "Process standardization",
      nextStep: "Add office manager"
    },
    {
      stage: "Stage 3: Growing Business",
      size: "9-15 people",
      revenue: "$1.5M-3M",
      challenges: [
        "Managing multiple crews",
        "Maintaining culture",
        "Competitive pressure"
      ],
      focus: "Leadership & delegation",
      nextStep: "Add operations manager"
    },
    {
      stage: "Stage 4: Established Contractor",
      size: "16-30 people",
      revenue: "$3M-10M",
      challenges: [
        "Scaling profitably",
        "Market expansion",
        "Succession planning"
      ],
      focus: "Strategic growth",
      nextStep: "Multi-location or acquisition"
    }
  ];

  const growthLevers = [
    {
      lever: "Recurring Revenue",
      description: "Maintenance contracts & service agreements",
      implementation: "Offer annual service packages",
      impact: "+40% predictable revenue",
      difficulty: "Medium"
    },
    {
      lever: "Premium Services",
      description: "Emergency & after-hours work",
      implementation: "24/7 hotline with premium rates",
      impact: "+60% margins on emergency work",
      difficulty: "Easy"
    },
    {
      lever: "Geographic Expansion",
      description: "New service areas",
      implementation: "Satellite crews in adjacent suburbs",
      impact: "+35% market reach",
      difficulty: "Hard"
    },
    {
      lever: "Service Line Extension",
      description: "Add complementary services",
      implementation: "Partner or acquire capabilities",
      impact: "+25% per customer value",
      difficulty: "Medium"
    },
    {
      lever: "Commercial Contracts",
      description: "B2B & government work",
      implementation: "Tender for larger projects",
      impact: "+3x average job size",
      difficulty: "Hard"
    },
    {
      lever: "Franchise/License Model",
      description: "Scale through others",
      implementation: "Package your system",
      impact: "10x growth potential",
      difficulty: "Very Hard"
    }
  ];

  const metrics = [
    { icon: Users, label: 'Team Growth Path', value: '1→15', color: 'text-blue-400' },
    { icon: DollarSign, label: 'Revenue Target', value: '$10M', color: 'text-green-400' },
    { icon: Target, label: 'Net Profit Goal', value: '20%', color: 'text-purple-400' },
    { icon: TrendingUp, label: 'Annual Growth', value: '35%', color: 'text-cyan-400' }
  ];

  const scalingChallenges = [
    {
      challenge: "Can't find good workers",
      solution: "Build apprentice program + retention bonuses",
      result: "90% retention rate"
    },
    {
      challenge: "Quality drops with growth",
      solution: "Documented SOPs + quality checklists",
      result: "Consistent 4.8★ rating"
    },
    {
      challenge: "Cash flow crunch",
      solution: "Progress billing + faster collections",
      result: "Positive cash flow always"
    },
    {
      challenge: "Owner burnout",
      solution: "Delegate operations + focus on strategy",
      result: "Work ON not IN business"
    }
  ];

  const caseStudy = {
    company: "Brisbane Premier Plumbing",
    timeline: "2019-2024",
    start: {
      size: "3 plumbers",
      revenue: "$420K",
      profit: "12%",
      owner: "Working 70 hrs/week"
    },
    end: {
      size: "18 staff",
      revenue: "$4.2M",
      profit: "22%",
      owner: "Working 35 hrs/week"
    },
    keyMoves: [
      "Year 1: Implemented ServiceM8 + automated admin",
      "Year 2: Hired ops manager, added maintenance contracts",
      "Year 3: Expanded to commercial, added 2nd location",
      "Year 4: Acquired competitor, launched emergency service",
      "Year 5: Systemized everything, owner semi-retired"
    ]
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Business Scaling for Trade Companies',
          description: 'Comprehensive business scaling services for trade companies. Strategic guidance for financial management, hiring, systems, and sustainable growth.',
          provider: 'Unite Group',
          serviceType: 'Business Scaling Consulting',
          areaServed: ['Brisbane', 'Queensland', 'Australia'],
          hasOfferCatalog: {
            name: 'Business Scaling Services',
            itemListElement: [
              {
                name: 'Financial Management Systems',
                description: 'Financial planning, cash flow management, and profitability optimization'
              },
              {
                name: 'Hiring and Retention Strategies',
                description: 'Recruitment, training, and employee retention programs'
              },
              {
                name: 'Systems and Process Development',
                description: 'Operational systems design and process optimization for scalability'
              }
            ]
          }
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400">Business Scaling</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Rocket className="w-10 h-10 text-emerald-400" />
                <span className="px-4 py-1 bg-emerald-400/10 border border-emerald-400/30 rounded-full text-emerald-400 text-sm">
                  1 to 30 Staff Roadmap
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
                Scale Your Trade to{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  $10M Revenue
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                The proven playbook to grow from solo operator to 30-person contractor. 
                Build systems, hire right, and scale profitably without burning out.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="https://unitegroup.com.au/consultation" 
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-bold text-white text-center hover:shadow-2xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105">
                  Get Scaling Roadmap
                </Link>
                <Link href="#scaling-stages" 
                  className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white text-center hover:bg-white/20 transition">
                  See Growth Stages
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Proven by 500+ trades</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Step-by-step playbook</span>
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

      {/* Warning Section */}
      <section className="bg-yellow-500/10 border-y border-yellow-500/20 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                92% of Trades Never Break $1M Revenue
              </h3>
              <p className="text-gray-300">
                Most contractors stay stuck in the owner-operator trap, working 70+ hours per week with no exit plan. 
                The difference between the 8% who scale and the 92% who don't? Systems, delegation, and strategic growth. 
                Without a scaling plan, you'll be swinging hammers at 65.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Scaling Stages */}
      <section id="scaling-stages" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              The 4 Stages of <span className="gradient-text">Trade Business Growth</span>
            </h2>
            <p className="text-xl text-gray-400">
              Where you are now and what's next
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {scalingStages.map((stage, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{stage.stage}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-400">{stage.size}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-cyan-400">{stage.revenue}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {index + 1}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Challenges</h4>
                    <ul className="space-y-1">
                      {stage.challenges.map((challenge, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Focus Area</h4>
                    <p className="text-white font-semibold">{stage.focus}</p>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Next: {stage.nextStep}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 Growth Levers */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              6 Proven <span className="gradient-text">Growth Levers</span>
            </h2>
            <p className="text-xl text-gray-400">
              Pull these levers to accelerate growth
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {growthLevers.map((lever, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{lever.lever}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    lever.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    lever.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    lever.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {lever.difficulty}
                  </span>
                </div>

                <p className="text-gray-300 mb-4">{lever.description}</p>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">How to implement</p>
                    <p className="text-white">{lever.implementation}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">{lever.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Scaling Challenges */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Overcome <span className="gradient-text">Scaling Roadblocks</span>
            </h2>
            <p className="text-xl text-gray-400">
              Solutions to the challenges every growing trade faces
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {scalingChallenges.map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <h3 className="text-lg font-bold text-white">{item.challenge}</h3>
                </div>
                
                <div className="pl-9 space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Solution</p>
                    <p className="text-gray-300">{item.solution}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">{item.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Real Growth Story: <span className="gradient-text">{caseStudy.company}</span>
            </h2>
            <p className="text-xl text-gray-400">
              From 3 to 18 staff in 5 years
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">2019 Starting Point</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team Size</span>
                    <span className="text-white font-semibold">{caseStudy.start.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-white font-semibold">{caseStudy.start.revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Net Profit</span>
                    <span className="text-white font-semibold">{caseStudy.start.profit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Owner Hours</span>
                    <span className="text-red-400 font-semibold">{caseStudy.start.owner}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">2024 Current State</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team Size</span>
                    <span className="text-white font-semibold">{caseStudy.end.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-green-400 font-semibold">{caseStudy.end.revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Net Profit</span>
                    <span className="text-green-400 font-semibold">{caseStudy.end.profit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Owner Hours</span>
                    <span className="text-green-400 font-semibold">{caseStudy.end.owner}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Key Growth Moves</h3>
              <div className="space-y-3">
                {caseStudy.keyMoves.map((move, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-300">{move}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Pages Navigation */}
      <section className="py-20 px-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Deep Dive Into <span className="gradient-text">Scaling Strategies</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/trade-business-scaling/hiring-retention" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Users className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition">
                Hiring & Retention
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Build and keep an A-team of tradies
              </p>
              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/trade-business-scaling/systems-processes" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Settings className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition">
                Systems & Processes
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Build a business that runs without you
              </p>
              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/trade-business-scaling/financial-management" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <DollarSign className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition">
                Financial Management
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Cash flow, pricing, and profit optimization
              </p>
              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Calculate Your <span className="gradient-text">Scaling Potential</span>
          </h2>
          <ROICalculator industry="trades" calculatorType="scaling" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Scale to $10M?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get your personalized scaling roadmap and join the 8% who break through
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105">
              Get Your Scaling Plan
            </Link>
            <Link href="https://unitegroup.com.au/services" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              View All Services
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            Free assessment includes growth audit, scaling roadmap, and revenue projections
          </p>
        </div>
      </section>
      </div>
    </>
  );
}