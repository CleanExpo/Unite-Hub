"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Cloud, 
  Zap, 
  Calculator,
  FileText,
  Shield,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Wrench
} from 'lucide-react';
import ROICalculator from '@/components/ROICalculator';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function DigitalTransformationTrades() {
  const transformationSteps = [
    {
      week: "Week 1-2",
      title: "Digital Foundation",
      tasks: [
        "Cloud-based job management system",
        "Digital quote templates",
        "Mobile crew apps deployment",
        "Basic automation setup"
      ],
      impact: "Save 10 hours/week immediately"
    },
    {
      week: "Week 3-4", 
      title: "Customer Experience",
      tasks: [
        "Online booking system",
        "Automated SMS updates",
        "Digital invoice & payments",
        "Customer portal access"
      ],
      impact: "Reduce calls by 60%"
    },
    {
      week: "Week 5-6",
      title: "Operations Excellence",
      tasks: [
        "GPS crew tracking",
        "Digital timesheets",
        "Inventory management",
        "Compliance tracking"
      ],
      impact: "Cut admin costs by 40%"
    },
    {
      week: "Week 7-8",
      title: "Growth Acceleration",
      tasks: [
        "Marketing automation",
        "Review management",
        "Lead scoring system",
        "Performance dashboards"
      ],
      impact: "Double qualified leads"
    }
  ];

  const digitalTools = [
    {
      category: "Job Management",
      icon: Wrench,
      tools: [
        { name: "ServiceM8", best: "Plumbers & Electricians", price: "$29/user/month" },
        { name: "Tradify", best: "Multi-trade contractors", price: "$35/user/month" },
        { name: "simPRO", best: "15+ staff operations", price: "$POA" }
      ]
    },
    {
      category: "Quoting & Invoicing",
      icon: FileText,
      tools: [
        { name: "Fergus", best: "Quick quotes", price: "$39/user/month" },
        { name: "AroFlo", best: "Complex projects", price: "$79/user/month" },
        { name: "Xero + Add-ons", best: "Accounting integration", price: "$25+/month" }
      ]
    },
    {
      category: "Safety & Compliance",
      icon: Shield,
      tools: [
        { name: "SafetyCulture", best: "Site inspections", price: "$24/user/month" },
        { name: "Hammertech", best: "Large sites", price: "$POA" },
        { name: "SWMS Digital", best: "Basic compliance", price: "$19/month" }
      ]
    }
  ];

  const metrics = [
    { icon: Clock, label: 'Admin Time Saved', value: '15hrs/week', color: 'text-blue-400' },
    { icon: TrendingUp, label: 'Revenue Increase', value: '+28%', color: 'text-green-400' },
    { icon: Users, label: 'Crew Productivity', value: '+45%', color: 'text-purple-400' },
    { icon: BarChart3, label: 'Cost Reduction', value: '-32%', color: 'text-cyan-400' }
  ];

  const caseStudies = [
    {
      business: "Brisbane Electrical Services",
      size: "8 electricians",
      before: "Paper job cards, Excel quotes, 3-day invoice delays",
      after: "Digital workflows, instant quotes, same-day invoicing",
      results: {
        time: "20 hours/week saved",
        revenue: "+$340K annual revenue",
        cashflow: "14 days faster payments"
      }
    },
    {
      business: "Northside Plumbing Crew", 
      size: "12 plumbers",
      before: "WhatsApp scheduling, manual timesheets, lost paperwork",
      after: "App-based dispatch, GPS tracking, cloud storage",
      results: {
        time: "25 hours/week saved",
        revenue: "+42% job completion",
        cashflow: "Invoice accuracy 100%"
      }
    }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Digital Transformation for Trades',
          description: 'Comprehensive digital transformation services for trade businesses. Modernize operations with cloud solutions, mobile apps, and digital workflows.',
          provider: 'Unite Group',
          serviceType: 'Digital Transformation Consulting',
          areaServed: ['Brisbane', 'Queensland', 'Australia'],
          hasOfferCatalog: {
            name: 'Digital Transformation Services',
            itemListElement: [
              {
                name: 'Cloud Migration Guide',
                description: 'Step-by-step cloud migration guidance for trade businesses'
              },
              {
                name: 'Job Management Software',
                description: 'Custom job management and scheduling software solutions'
              },
              {
                name: 'Mobile Workforce Apps',
                description: 'Mobile applications for field workers and remote teams'
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
            <span className="text-cyan-400">Digital Transformation</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Smartphone className="w-10 h-10 text-cyan-400" />
                <span className="px-4 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-sm">
                  8-Week Transformation
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
                Go Digital in{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  8 Weeks
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Transform your trade business from paper chaos to digital efficiency. 
                Save 15+ hours per week, get paid 2x faster, and scale without the headaches.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="https://unitegroup.com.au/consultation" 
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white text-center hover:shadow-2xl hover:shadow-cyan-500/30 transition-all transform hover:scale-105">
                  Start Your Transformation
                </Link>
                <Link href="#roadmap" 
                  className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white text-center hover:bg-white/20 transition">
                  See 8-Week Roadmap
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No IT skills needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Full team training</span>
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

      {/* Warning Banner */}
      <section className="bg-red-500/10 border-y border-red-500/20 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Your Competitors Are Already Digital
              </h3>
              <p className="text-gray-300">
                73% of Brisbane trades now use digital job management. 
                Paper-based contractors lose 3-5 jobs per week to faster digital competitors. 
                Every week you wait costs you approximately $4,200 in lost efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8-Week Roadmap */}
      <section id="roadmap" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Your <span className="gradient-text">8-Week Digital Roadmap</span>
            </h2>
            <p className="text-xl text-gray-400">
              Proven transformation path for 3-15 person trade businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {transformationSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 h-full hover:bg-white/10 transition">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400 font-bold">{step.week}</span>
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                  
                  <ul className="space-y-2 mb-6">
                    {step.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-cyan-400">{step.impact}</p>
                  </div>
                </div>
                
                {index < transformationSteps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-cyan-400 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool Recommendations */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Best <span className="gradient-text">Digital Tools</span> for Trades
            </h2>
            <p className="text-xl text-gray-400">
              Curated for Brisbane contractors (tested & proven)
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {digitalTools.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <category.icon className="w-8 h-8 text-cyan-400" />
                  <h3 className="text-2xl font-bold text-white">{category.category}</h3>
                </div>
                
                <div className="space-y-4">
                  {category.tools.map((tool, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white">{tool.name}</h4>
                        <span className="text-sm text-cyan-400">{tool.price}</span>
                      </div>
                      <p className="text-sm text-gray-400">Best for: {tool.best}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Real <span className="gradient-text">Brisbane Trades</span> Results
            </h2>
            <p className="text-xl text-gray-400">
              From paper chaos to digital success in 8 weeks
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {caseStudies.map((study, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{study.business}</h3>
                    <p className="text-cyan-400">{study.size}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">BEFORE</h4>
                    <p className="text-gray-300">{study.before}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">AFTER</h4>
                    <p className="text-gray-300">{study.after}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">RESULTS</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-cyan-400">{study.results.time}</p>
                        <p className="text-xs text-gray-400">Time Saved</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-400">{study.results.revenue}</p>
                        <p className="text-xs text-gray-400">Revenue Impact</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-400">{study.results.cashflow}</p>
                        <p className="text-xs text-gray-400">Cash Flow</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-Pages Navigation */}
      <section className="py-20 px-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Deep Dive Into <span className="gradient-text">Digital Solutions</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/digital-transformation-trades/job-management-software" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Wrench className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">
                Job Management Software
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Complete guide to choosing and implementing job management systems
              </p>
              <span className="text-cyan-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/digital-transformation-trades/mobile-workforce-apps" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Smartphone className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">
                Mobile Workforce Apps
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Equip your crew with powerful mobile tools for the field
              </p>
              <span className="text-cyan-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/digital-transformation-trades/cloud-migration-guide" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Cloud className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">
                Cloud Migration Guide
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Move from desktop to cloud without losing a single job
              </p>
              <span className="text-cyan-400 text-sm font-semibold flex items-center gap-1">
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
            Calculate Your <span className="gradient-text">Digital ROI</span>
          </h2>
          <ROICalculator industry="trades" calculatorType="digital" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Transform Your Trade Business?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 500+ Brisbane trades who've gone digital with Unite Group's proven methodology
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-cyan-500/30 transition-all transform hover:scale-105">
              Book Free Digital Assessment
            </Link>
            <Link href="https://unitegroup.com.au/services" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              View All Services
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            Free 30-minute consultation • No obligations • Practical advice you can use today
          </p>
        </div>
      </section>
      </div>
    </>
  );
}