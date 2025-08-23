"use client";

import React from 'react';
import Link from 'next/link';
import SchemaMarkup from '@/components/SchemaMarkup';
import { 
  Smartphone,
  MapPin,
  Camera,
  Clock,
  FileSignature,
  MessageSquare,
  Shield,
  Battery,
  Wifi,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowRight,
  Zap
} from 'lucide-react';

export default function MobileWorkforceApps() {
  const mobileFeatures = [
    {
      icon: MapPin,
      title: "GPS Time Tracking",
      description: "Automatic clock in/out at job sites",
      benefit: "Save 30 min/day per worker",
      critical: true
    },
    {
      icon: Camera,
      title: "Photo Documentation",
      description: "Before/after photos with timestamps",
      benefit: "Reduce disputes by 90%",
      critical: true
    },
    {
      icon: FileSignature,
      title: "Digital Forms & Signatures",
      description: "Job cards, SWMS, customer sign-offs",
      benefit: "No lost paperwork ever",
      critical: true
    },
    {
      icon: MessageSquare,
      title: "Instant Communication",
      description: "Chat, updates, job notes in real-time",
      benefit: "Cut phone calls by 70%",
      critical: false
    },
    {
      icon: Shield,
      title: "Safety Checklists",
      description: "Digital toolbox talks & hazard reports",
      benefit: "100% compliance tracking",
      critical: true
    },
    {
      icon: Clock,
      title: "Job Timer & Materials",
      description: "Track time and materials per job",
      benefit: "Accurate job costing",
      critical: false
    }
  ];

  const appComparison = [
    {
      category: "All-in-One Solutions",
      apps: [
        {
          name: "ServiceM8",
          rating: 4.6,
          offline: "Full",
          battery: "Medium",
          learning: "2 hours",
          price: "Included with subscription"
        },
        {
          name: "Tradify Mobile",
          rating: 4.3,
          offline: "Partial",
          battery: "High",
          learning: "3 hours",
          price: "Included with subscription"
        }
      ]
    },
    {
      category: "Specialized Apps",
      apps: [
        {
          name: "Deputy (Rostering)",
          rating: 4.7,
          offline: "Yes",
          battery: "Low",
          learning: "1 hour",
          price: "$4.50/user/month"
        },
        {
          name: "SafetyCulture (iAuditor)",
          rating: 4.8,
          offline: "Full",
          battery: "Low",
          learning: "30 mins",
          price: "$24/user/month"
        }
      ]
    }
  ];

  const deploymentSteps = [
    {
      week: "Week 1",
      title: "Pilot Testing",
      tasks: [
        "Select 2-3 tech-savvy crew members",
        "Install apps on their phones",
        "Run 5 test jobs",
        "Gather feedback"
      ],
      tip: "Start with your best adopters"
    },
    {
      week: "Week 2",
      title: "Training & Setup",
      tasks: [
        "Create training videos",
        "Set up all crew accounts",
        "Configure permissions",
        "Practice sessions"
      ],
      tip: "Keep first training under 30 mins"
    },
    {
      week: "Week 3",
      title: "Gradual Rollout",
      tasks: [
        "Deploy to 50% of crew",
        "Daily check-ins",
        "Address issues quickly",
        "Refine processes"
      ],
      tip: "Fix problems before full rollout"
    },
    {
      week: "Week 4",
      title: "Full Deployment",
      tasks: [
        "All crew using apps",
        "Remove paper backups",
        "Monitor adoption rates",
        "Celebrate wins"
      ],
      tip: "Recognize early adopters publicly"
    }
  ];

  const commonChallenges = [
    {
      challenge: "My crew hates technology",
      solution: "Start with 1 simple feature (photos), add more gradually",
      result: "95% adoption in 6 weeks"
    },
    {
      challenge: "Poor internet at job sites",
      solution: "Choose apps with full offline mode, sync when connected",
      result: "Zero data loss reported"
    },
    {
      challenge: "Crew using personal phones",
      solution: "$20/month phone allowance + clear usage policy",
      result: "Happy crew, no disputes"
    },
    {
      challenge: "Battery drain concerns",
      solution: "Provide car chargers + portable battery packs",
      result: "Non-issue after week 1"
    }
  ];

  const roi = {
    costs: [
      { item: "App subscriptions", amount: "$35/user/month" },
      { item: "Phone allowances", amount: "$20/user/month" },
      { item: "Training time", amount: "$300 one-time" },
      { item: "Accessories", amount: "$50/user one-time" }
    ],
    savings: [
      { item: "Admin time", amount: "$2,400/month" },
      { item: "Fuel (less return trips)", amount: "$800/month" },
      { item: "Paper & printing", amount: "$200/month" },
      { item: "Faster invoicing", amount: "$3,200/month" }
    ],
    totalSaving: "$6,600/month",
    totalCost: "$825/month",
    netBenefit: "$5,775/month"
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Mobile Workforce Apps for Trades',
          description: 'Custom mobile applications for trade businesses. Empower your field teams with mobile tools for job tracking, communication, and real-time updates.',
          provider: 'Unite Group',
          serviceType: 'Mobile Application Development',
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
            <span className="text-cyan-400">Mobile Workforce Apps</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="w-10 h-10 text-cyan-400" />
              <span className="px-4 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-sm">
                Field Productivity Guide
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Turn Phones Into{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Productivity Weapons
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Your crew already carries smartphones. Transform them into powerful business 
              tools that save 2+ hours per day per worker. No more lost paperwork, forgotten details, or site revisits.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Clock className="w-6 h-6 text-cyan-400 mb-2" />
                <div className="text-2xl font-bold text-white">2hrs</div>
                <div className="text-sm text-gray-400">Saved daily</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Battery className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">8hrs</div>
                <div className="text-sm text-gray-400">Battery life</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Wifi className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-gray-400">Offline capable</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Users className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-sm text-gray-400">Adoption rate</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="https://unitegroup.com.au/consultation" 
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white text-center hover:shadow-2xl hover:shadow-cyan-500/30 transition-all transform hover:scale-105">
                Get Mobile Strategy Session
              </Link>
              <Link href="#roi-calculator" 
                className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white text-center hover:bg-white/20 transition">
                Calculate Your ROI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Critical Features */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Essential <span className="gradient-text">Mobile Features</span> for Trades
            </h2>
            <p className="text-xl text-gray-400">
              Must-have capabilities that transform field operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mobileFeatures.map((feature, index) => (
              <div key={index} className={`bg-white/5 backdrop-blur border ${feature.critical ? 'border-cyan-400/30' : 'border-white/10'} rounded-xl p-6 hover:bg-white/10 transition relative`}>
                {feature.critical && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 bg-cyan-400 text-black text-xs font-bold rounded">
                    CRITICAL
                  </span>
                )}
                <feature.icon className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{feature.description}</p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-cyan-400">{feature.benefit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Best Apps for <span className="gradient-text">Brisbane Trade Crews</span>
            </h2>
            <p className="text-xl text-gray-400">
              Field-tested by 200+ local contractors
            </p>
          </div>

          <div className="space-y-8">
            {appComparison.map((category, catIndex) => (
              <div key={catIndex}>
                <h3 className="text-2xl font-bold text-white mb-6">{category.category}</h3>
                <div className="grid lg:grid-cols-2 gap-6">
                  {category.apps.map((app, appIndex) => (
                    <div key={appIndex} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-xl font-bold text-white">{app.name}</h4>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white font-semibold">{app.rating}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Offline Mode</p>
                          <p className="text-white font-semibold">{app.offline}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Battery Usage</p>
                          <p className="text-white font-semibold">{app.battery}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Learning Time</p>
                          <p className="text-white font-semibold">{app.learning}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Cost</p>
                          <p className="text-cyan-400 font-semibold">{app.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Week Deployment Plan */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4-Week <span className="gradient-text">Deployment Plan</span>
            </h2>
            <p className="text-xl text-gray-400">
              Roll out mobile apps without disrupting operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {deploymentSteps.map((step, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-cyan-400 font-bold">{step.week}</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                
                <ul className="space-y-2 mb-4">
                  {step.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-yellow-400">💡 {step.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Challenges */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Overcome <span className="gradient-text">Common Challenges</span>
            </h2>
            <p className="text-xl text-gray-400">
              Solutions that actually work in the field
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {commonChallenges.map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
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

      {/* ROI Calculator */}
      <section id="roi-calculator" className="py-20 px-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Mobile App <span className="gradient-text">ROI Calculator</span>
            </h2>
            <p className="text-xl text-gray-400">
              Based on a 10-person crew in Brisbane
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-red-400 mb-6">Monthly Costs</h3>
                <ul className="space-y-3">
                  {roi.costs.map((cost, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-gray-300">{cost.item}</span>
                      <span className="text-white font-semibold">{cost.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-white">Total Cost</span>
                    <span className="text-xl font-bold text-red-400">{roi.totalCost}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-green-400 mb-6">Monthly Savings</h3>
                <ul className="space-y-3">
                  {roi.savings.map((saving, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-gray-300">{saving.item}</span>
                      <span className="text-white font-semibold">{saving.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-white">Total Savings</span>
                    <span className="text-xl font-bold text-green-400">{roi.totalSaving}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 text-center">
              <p className="text-lg text-gray-300 mb-2">Net Monthly Benefit</p>
              <p className="text-5xl font-black text-green-400 mb-4">{roi.netBenefit}</p>
              <p className="text-gray-400">ROI payback period: <span className="text-white font-bold">5 days</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Mobilize Your Workforce?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 500+ Brisbane trades using mobile apps to dominate their market
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-cyan-500/30 transition-all transform hover:scale-105">
              Get Your Mobile Strategy
            </Link>
            <Link href="/digital-transformation-trades" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Digital Transformation
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            Free consultation includes app recommendations, deployment plan, and ROI projection
          </p>
        </div>
      </section>
      </div>
    </>
  );
}