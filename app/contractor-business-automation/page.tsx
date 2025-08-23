"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Zap,
  Clock,
  DollarSign,
  Phone,
  Mail,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Settings,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import QuoteGenerator from '@/components/QuoteGenerator';
import ROICalculator from '@/components/ROICalculator';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function ContractorBusinessAutomation() {
  const automationWins = [
    {
      process: "Quote Follow-ups",
      before: "Manually chasing quotes, 67% forgotten",
      after: "Auto follow-up Day 3, 7, 14",
      timeSaved: "8 hrs/week",
      revenueImpact: "+$4,200/month",
      difficulty: "Easy"
    },
    {
      process: "Invoice Reminders",
      before: "Chasing payments, 45-day average",
      after: "Auto reminders, 14-day average",
      timeSaved: "5 hrs/week",
      revenueImpact: "+$8,500 cash flow",
      difficulty: "Easy"
    },
    {
      process: "Job Scheduling",
      before: "Manual calendar, double bookings",
      after: "Smart scheduling, crew optimization",
      timeSaved: "10 hrs/week",
      revenueImpact: "+3 jobs/week",
      difficulty: "Medium"
    },
    {
      process: "Customer Updates",
      before: "Phone tag hell, angry customers",
      after: "Auto SMS at each milestone",
      timeSaved: "6 hrs/week",
      revenueImpact: "+4.8★ reviews",
      difficulty: "Easy"
    },
    {
      process: "Supplier Orders",
      before: "Phone orders, pricing errors",
      after: "Auto-order at job creation",
      timeSaved: "4 hrs/week",
      revenueImpact: "-12% material costs",
      difficulty: "Medium"
    },
    {
      process: "Safety Compliance",
      before: "Paper forms, missing signatures",
      after: "Digital SWMS, auto-reminders",
      timeSaved: "3 hrs/week",
      revenueImpact: "100% compliance",
      difficulty: "Easy"
    }
  ];

  const automationStack = [
    {
      category: "Communication",
      icon: MessageSquare,
      tools: [
        { name: "Twilio", purpose: "SMS automation", cost: "$0.0079/SMS" },
        { name: "Mailchimp", purpose: "Email campaigns", cost: "$15/month" },
        { name: "Calendly", purpose: "Booking automation", cost: "$10/month" }
      ]
    },
    {
      category: "Workflow",
      icon: RefreshCw,
      tools: [
        { name: "Zapier", purpose: "Connect all apps", cost: "$29/month" },
        { name: "Make (Integromat)", purpose: "Complex workflows", cost: "$19/month" },
        { name: "IFTTT", purpose: "Simple triggers", cost: "Free-$5/month" }
      ]
    },
    {
      category: "Documents",
      icon: FileText,
      tools: [
        { name: "PandaDoc", purpose: "Quote automation", cost: "$19/month" },
        { name: "DocuSign", purpose: "E-signatures", cost: "$15/month" },
        { name: "Jotform", purpose: "Smart forms", cost: "$24/month" }
      ]
    }
  ];

  const implementationPlan = [
    {
      month: "Month 1",
      focus: "Quick Wins",
      automations: [
        "Quote follow-ups",
        "Invoice reminders",
        "Booking confirmations"
      ],
      expectedROI: "$3,500"
    },
    {
      month: "Month 2",
      focus: "Customer Experience",
      automations: [
        "Job status updates",
        "Review requests",
        "Birthday greetings"
      ],
      expectedROI: "$5,200"
    },
    {
      month: "Month 3",
      focus: "Operations",
      automations: [
        "Crew scheduling",
        "Inventory alerts",
        "Compliance tracking"
      ],
      expectedROI: "$8,400"
    },
    {
      month: "Month 4+",
      focus: "Scale & Optimize",
      automations: [
        "Lead scoring",
        "Dynamic pricing",
        "Predictive maintenance"
      ],
      expectedROI: "$12,000+"
    }
  ];

  const metrics = [
    { icon: Clock, label: 'Hours Saved Weekly', value: '36hrs', color: 'text-blue-400' },
    { icon: DollarSign, label: 'Revenue Increase', value: '+42%', color: 'text-green-400' },
    { icon: Users, label: 'Customer Satisfaction', value: '4.9★', color: 'text-purple-400' },
    { icon: TrendingUp, label: 'Jobs Completed', value: '+28%', color: 'text-cyan-400' }
  ];

  const caseStudy = {
    company: "Gold Coast Electrical Solutions",
    size: "11 electricians",
    challenge: "Losing 30% of quotes to follow-up failures, 52-day payment cycles, crew scheduling chaos",
    solution: [
      "Automated quote follow-up sequence",
      "Smart invoice reminders with payment links",
      "AI-powered crew scheduling",
      "Customer update automation"
    ],
    results: {
      quoteConversion: "31% → 47%",
      paymentCycle: "52 → 18 days",
      adminTime: "-25 hours/week",
      revenue: "+$47K/month"
    },
    timeline: "Full implementation in 8 weeks"
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Business Automation for Contractors',
          description: 'Comprehensive business automation solutions for contractors. Streamline operations, automate customer communications, and optimize workflows for maximum efficiency.',
          provider: 'Unite Group',
          serviceType: 'Business Process Automation',
          areaServed: ['Brisbane', 'Queensland', 'Australia'],
          hasOfferCatalog: {
            name: 'Business Automation Services',
            itemListElement: [
              {
                name: 'Customer Communication Automation',
                description: 'Automated customer follow-ups, appointment reminders, and communication workflows'
              },
              {
                name: 'Process Optimization',
                description: 'Streamline business processes and eliminate inefficiencies'
              },
              {
                name: 'Workflow Automation',
                description: 'End-to-end workflow automation for quotes, scheduling, and project management'
              }
            ]
          }
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <span className="text-purple-400">Business Automation</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-10 h-10 text-purple-400" />
                <span className="px-4 py-1 bg-purple-400/10 border border-purple-400/30 rounded-full text-purple-400 text-sm">
                  36 Hours Saved Weekly
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
                Automate Your{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Contractor Business
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Stop drowning in admin work. Automate quotes, invoices, scheduling, and customer 
                communication. Save 36+ hours per week and never miss a follow-up again.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="https://unitegroup.com.au/consultation" 
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white text-center hover:shadow-2xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
                  Get Automation Audit
                </Link>
                <Link href="#automation-calculator" 
                  className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white text-center hover:bg-white/20 transition">
                  Calculate Your Savings
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No coding required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Works with existing tools</span>
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

      {/* Pain Point Banner */}
      <section className="bg-red-500/10 border-y border-red-500/20 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                You're Losing $18,000/Month to Manual Processes
              </h3>
              <p className="text-gray-300">
                The average 10-person trade business wastes 36 hours/week on admin tasks that could be automated. 
                That's $4,500/week in lost productivity, plus missed opportunities from slow follow-ups. 
                Your competitors using automation are winning 40% more jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top 6 Automations */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Top 6 <span className="gradient-text">Money-Making Automations</span>
            </h2>
            <p className="text-xl text-gray-400">
              Start with these high-impact automations (ranked by ROI)
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {automationWins.map((automation, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8 hover:bg-white/10 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-white">{automation.process}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    automation.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {automation.difficulty}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Before</p>
                      <p className="text-gray-300 text-sm">{automation.before}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-400 mb-1">After</p>
                      <p className="text-gray-300 text-sm">{automation.after}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold text-white">{automation.timeSaved}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">{automation.revenueImpact}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Automation Stack */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Your <span className="gradient-text">Automation Tech Stack</span>
            </h2>
            <p className="text-xl text-gray-400">
              Proven tools that work together seamlessly
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {automationStack.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <category.icon className="w-8 h-8 text-purple-400" />
                  <h3 className="text-2xl font-bold text-white">{category.category}</h3>
                </div>
                
                <div className="space-y-4">
                  {category.tools.map((tool, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white">{tool.name}</h4>
                        <span className="text-sm text-purple-400">{tool.cost}</span>
                      </div>
                      <p className="text-sm text-gray-400">{tool.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Total monthly cost for complete stack:</p>
            <p className="text-3xl font-bold text-white">$147/month</p>
            <p className="text-purple-400">Saves $18,000+/month in productivity</p>
          </div>
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4-Month <span className="gradient-text">Implementation Roadmap</span>
            </h2>
            <p className="text-xl text-gray-400">
              Progressive automation without disrupting operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {implementationPlan.map((phase, index) => (
              <div key={index} className="relative">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-purple-400 font-bold">{phase.month}</span>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{phase.focus}</h3>
                  
                  <ul className="space-y-2 mb-6">
                    {phase.automations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400">Expected ROI</p>
                    <p className="text-xl font-bold text-green-400">{phase.expectedROI}</p>
                  </div>
                </div>
                
                {index < implementationPlan.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Real Results: <span className="gradient-text">Gold Coast Electrical</span>
            </h2>
            <p className="text-xl text-gray-400">
              How one contractor transformed their business with automation
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">The Challenge</h3>
                <p className="text-gray-300 mb-4">{caseStudy.challenge}</p>
                
                <h3 className="text-xl font-bold text-white mb-4">The Solution</h3>
                <ul className="space-y-2">
                  {caseStudy.solution.map((item, index) => (
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
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Quote Conversion</span>
                    <span className="font-bold text-green-400">{caseStudy.results.quoteConversion}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Payment Cycle</span>
                    <span className="font-bold text-blue-400">{caseStudy.results.paymentCycle}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Admin Time</span>
                    <span className="font-bold text-purple-400">{caseStudy.results.adminTime}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Monthly Revenue</span>
                    <span className="font-bold text-green-400 text-xl">{caseStudy.results.revenue}</span>
                  </div>
                </div>
                
                <p className="mt-6 text-center text-gray-400">
                  {caseStudy.timeline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Automation Calculator */}
      <section id="automation-calculator" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-black mb-6 text-center">
              Your <span className="gradient-text">Automation Savings Calculator</span>
            </h2>
            
            <div className="space-y-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Current Admin Hours/Week
                  </label>
                  <div className="text-3xl font-bold text-white">40 hours</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Hours After Automation
                  </label>
                  <div className="text-3xl font-bold text-green-400">4 hours</div>
                </div>
              </div>
              
              <div className="p-6 bg-white/5 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-4">Monthly Impact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Saved</span>
                    <span className="text-white font-semibold">144 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Value @ $75/hr</span>
                    <span className="text-green-400 font-semibold">$10,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Extra Jobs Capacity</span>
                    <span className="text-blue-400 font-semibold">+18 jobs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Automation Cost</span>
                    <span className="text-red-400 font-semibold">-$147</span>
                  </div>
                  <div className="pt-3 border-t border-white/20 flex justify-between">
                    <span className="text-lg font-bold text-white">Net Monthly Benefit</span>
                    <span className="text-2xl font-bold text-green-400">$10,653</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="https://unitegroup.com.au/consultation" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
                Start Automating Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Pages Navigation */}
      <section className="py-20 px-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Explore <span className="gradient-text">Automation Solutions</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/contractor-business-automation/workflow-automation" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <RefreshCw className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition">
                Workflow Automation
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Connect your tools and create powerful automated workflows
              </p>
              <span className="text-purple-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/contractor-business-automation/customer-communication" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <MessageSquare className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition">
                Customer Communication
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Automate updates, reminders, and follow-ups
              </p>
              <span className="text-purple-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/contractor-business-automation/process-optimization" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Settings className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition">
                Process Optimization
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Streamline operations from quote to payment
              </p>
              <span className="text-purple-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Quote Generator Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Try Our <span className="gradient-text">Instant Quote Generator</span>
          </h2>
          <QuoteGenerator />
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Calculate Your <span className="gradient-text">Automation ROI</span>
          </h2>
          <ROICalculator industry="trades" calculatorType="automation" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Stop Working IN Your Business,{' '}
            <span className="gradient-text">Start Working ON It</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 500+ Brisbane contractors who've automated their way to freedom
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get Free Automation Audit
            </Link>
            <Link href="https://unitegroup.com.au/services" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              View All Services
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            Free audit includes process mapping, automation opportunities, and ROI projection
          </p>
        </div>
      </section>
      </div>
    </>
  );
}