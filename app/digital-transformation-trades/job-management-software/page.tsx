"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Wrench,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Users,
  FileText,
  BarChart3,
  Shield,
  Smartphone,
  ArrowRight,
  Star
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function JobManagementSoftware() {
  const softwareComparison = [
    {
      name: "ServiceM8",
      logo: "S8",
      bestFor: "Small electrical & plumbing teams",
      pricing: "$29/user/month",
      users: "3-10 staff",
      pros: [
        "Easy to learn (2 days)",
        "Great mobile app",
        "SMS automation",
        "Xero integration"
      ],
      cons: [
        "Limited reporting",
        "No inventory tracking",
        "Basic scheduling"
      ],
      rating: 4.5
    },
    {
      name: "Tradify",
      logo: "TF",
      bestFor: "Multi-trade contractors",
      pricing: "$35/user/month",
      users: "5-20 staff",
      pros: [
        "Excellent scheduling",
        "Good reporting",
        "Quote templates",
        "Supplier ordering"
      ],
      cons: [
        "Steeper learning curve",
        "Mobile app issues",
        "Limited customization"
      ],
      rating: 4.3
    },
    {
      name: "simPRO",
      logo: "SP",
      bestFor: "Large operations & projects",
      pricing: "From $120/user/month",
      users: "15+ staff",
      pros: [
        "Full project management",
        "Advanced reporting",
        "Multi-location support",
        "Asset management"
      ],
      cons: [
        "Complex setup",
        "Expensive",
        "4-week training needed"
      ],
      rating: 4.7
    },
    {
      name: "AroFlo",
      logo: "AF",
      bestFor: "Service & maintenance focus",
      pricing: "$79/user/month",
      users: "8-50 staff",
      pros: [
        "Great for maintenance",
        "Asset tracking",
        "Compliance tools",
        "Good support"
      ],
      cons: [
        "Dated interface",
        "Slow updates",
        "Limited integrations"
      ],
      rating: 4.1
    }
  ];

  const implementationTimeline = [
    {
      day: "Day 1-3",
      phase: "Setup & Migration",
      tasks: [
        "Account configuration",
        "Import customer data",
        "Set up job types",
        "Configure pricing"
      ]
    },
    {
      day: "Day 4-7",
      phase: "Team Training",
      tasks: [
        "Admin training (4 hrs)",
        "Field crew training (2 hrs)",
        "Mobile app setup",
        "Practice jobs"
      ]
    },
    {
      day: "Day 8-14",
      phase: "Pilot Testing",
      tasks: [
        "Run 10 test jobs",
        "Process feedback",
        "Adjust workflows",
        "Fix issues"
      ]
    },
    {
      day: "Day 15+",
      phase: "Full Rollout",
      tasks: [
        "Go live with all jobs",
        "Daily check-ins",
        "Weekly reviews",
        "Continuous optimization"
      ]
    }
  ];

  const features = [
    { icon: FileText, name: "Digital Job Cards", impact: "Save 2 hrs/day" },
    { icon: DollarSign, name: "Instant Quoting", impact: "Win 40% more" },
    { icon: Clock, name: "Real-time Scheduling", impact: "No double bookings" },
    { icon: Smartphone, name: "Mobile Access", impact: "Update from site" },
    { icon: Users, name: "Crew Management", impact: "Track all teams" },
    { icon: BarChart3, name: "Performance Reports", impact: "Data-driven decisions" }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Job Management Software for Trades',
          description: 'Custom job management software solutions for trade businesses. Streamline scheduling, tracking, invoicing, and project management in one platform.',
          provider: 'Unite Group',
          serviceType: 'Job Management Software Development',
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
            <Link href="/digital-transformation-trades" className="text-gray-400 hover:text-white transition">
              Digital Transformation
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-cyan-400">Job Management Software</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Wrench className="w-10 h-10 text-cyan-400" />
              <span className="px-4 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-sm">
                Implementation Guide
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Choose the Right{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Job Management Software
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Stop losing money to paper chaos. The right job management system pays for 
              itself in 3 weeks through efficiency gains alone. Here's everything you need to know.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <DollarSign className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">$29-120</div>
                <div className="text-sm text-gray-400">Per user/month</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Clock className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">2 Weeks</div>
                <div className="text-sm text-gray-400">To implement</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Users className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">3-50+</div>
                <div className="text-sm text-gray-400">Team sizes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-16 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Essential Features That <span className="gradient-text">Save You Money</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                <feature.icon className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.name}</h3>
                <p className="text-gray-400 text-sm">{feature.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Software Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Top 4 Systems for <span className="gradient-text">Brisbane Trades</span>
            </h2>
            <p className="text-xl text-gray-400">
              Honest comparison based on 100+ local implementations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {softwareComparison.map((software, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-black text-xl">
                      {software.logo}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{software.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(software.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                        <span className="text-sm text-gray-400 ml-2">{software.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Best For</p>
                    <p className="text-white font-semibold">{software.bestFor}</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Pricing</p>
                      <p className="text-cyan-400 font-bold">{software.pricing}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Team Size</p>
                      <p className="text-white font-semibold">{software.users}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-2">PROS</h4>
                    <ul className="space-y-1">
                      {software.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2">CONS</h4>
                    <ul className="space-y-1">
                      {software.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{con}</span>
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

      {/* Implementation Timeline */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              14-Day <span className="gradient-text">Implementation Plan</span>
            </h2>
            <p className="text-xl text-gray-400">
              Go from sign-up to fully operational in 2 weeks
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {implementationTimeline.map((phase, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-cyan-400 font-bold">{phase.day}</span>
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{phase.phase}</h3>
                
                <ul className="space-y-2">
                  {phase.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
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

      {/* ROI Calculator */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-black mb-6 text-center">
              Your <span className="gradient-text">ROI in 30 Days</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Time Savings</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-gray-300">
                    <span>Quoting</span>
                    <span className="text-cyan-400">5 hrs/week</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Scheduling</span>
                    <span className="text-cyan-400">4 hrs/week</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Invoicing</span>
                    <span className="text-cyan-400">3 hrs/week</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Admin</span>
                    <span className="text-cyan-400">8 hrs/week</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Financial Impact</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-gray-300">
                    <span>Software Cost</span>
                    <span className="text-red-400">-$245/month</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Time Value (20hrs @ $75)</span>
                    <span className="text-green-400">+$6,000/month</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Extra Jobs (faster quotes)</span>
                    <span className="text-green-400">+$4,500/month</span>
                  </li>
                  <li className="flex justify-between font-bold text-white pt-2 border-t border-white/20">
                    <span>Net Benefit</span>
                    <span className="text-green-400">+$10,255/month</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="https://unitegroup.com.au/consultation" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-cyan-500/30 transition-all transform hover:scale-105">
                Get Software Recommendation
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Stop Losing Money to <span className="gradient-text">Paper Chaos</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            We'll help you choose, implement, and optimize the perfect job management system 
            for your trade business
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-cyan-500/30 transition-all transform hover:scale-105">
              Book Free Software Assessment
            </Link>
            <Link href="/digital-transformation-trades" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Digital Transformation
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}