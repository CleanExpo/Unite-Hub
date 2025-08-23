"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Settings,
  FileText,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function SystemsProcesses() {
  const coreProcesses = [
    {
      process: "Lead to Quote",
      currentState: "Phone tag, missed opportunities, slow quotes",
      systemizedState: "Auto-capture, instant response, 2-hour quotes",
      documentation: [
        "Lead intake form",
        "Qualification checklist",
        "Quote template library",
        "Pricing matrix"
      ],
      timeReduction: "75%"
    },
    {
      process: "Quote to Job",
      currentState: "Manual follow-up, lost quotes, scheduling chaos",
      systemizedState: "Auto follow-up, online acceptance, smart scheduling",
      documentation: [
        "Follow-up sequence",
        "Contract templates",
        "Scheduling rules",
        "Job prep checklist"
      ],
      timeReduction: "60%"
    },
    {
      process: "Job Execution",
      currentState: "Inconsistent quality, rework, customer complaints",
      systemizedState: "Step-by-step SOPs, quality checks, photo docs",
      documentation: [
        "Job type SOPs",
        "Quality checklists",
        "Safety protocols",
        "Completion criteria"
      ],
      timeReduction: "40%"
    },
    {
      process: "Job to Payment",
      currentState: "Delayed invoicing, 45-day payment, cash flow issues",
      systemizedState: "Same-day invoicing, 14-day payment, auto-chase",
      documentation: [
        "Invoice templates",
        "Payment terms",
        "Collection sequence",
        "Dispute resolution"
      ],
      timeReduction: "80%"
    }
  ];

  const sopTemplates = [
    {
      category: "Sales & Quoting",
      sops: [
        "Inbound lead handling",
        "Site visit procedure",
        "Quote preparation",
        "Follow-up sequence"
      ]
    },
    {
      category: "Operations",
      sops: [
        "Job setup checklist",
        "Material ordering",
        "Quality control",
        "Job completion"
      ]
    },
    {
      category: "Customer Service",
      sops: [
        "Customer onboarding",
        "Communication standards",
        "Complaint handling",
        "Review requests"
      ]
    },
    {
      category: "Admin & Finance",
      sops: [
        "Invoice processing",
        "Payment collection",
        "Expense management",
        "Payroll procedure"
      ]
    }
  ];

  const systemsStack = [
    {
      layer: "Foundation",
      systems: ["CRM", "Job Management", "Accounting"],
      purpose: "Core business operations",
      tools: "ServiceM8 + Xero"
    },
    {
      layer: "Automation",
      systems: ["Workflows", "Templates", "Integrations"],
      purpose: "Eliminate manual tasks",
      tools: "Zapier + Templates"
    },
    {
      layer: "Communication",
      systems: ["Team chat", "Customer updates", "Documents"],
      purpose: "Seamless information flow",
      tools: "Slack + SMS + Cloud"
    },
    {
      layer: "Intelligence",
      systems: ["Dashboards", "Reports", "Forecasting"],
      purpose: "Data-driven decisions",
      tools: "Power BI + Analytics"
    }
  ];

  const kpis = [
    { metric: "Lead Response Time", target: "< 30 min", measure: "CRM tracking" },
    { metric: "Quote Conversion", target: "> 35%", measure: "Won/Lost ratio" },
    { metric: "Job Completion Time", target: "On schedule 95%", measure: "Planned vs actual" },
    { metric: "First-Time Fix Rate", target: "> 92%", measure: "Rework tracking" },
    { metric: "Invoice to Payment", target: "< 14 days", measure: "AR aging" },
    { metric: "Customer Satisfaction", target: "> 4.7★", measure: "Review average" }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Systems and Processes for Trade Businesses',
          description: 'Business systems and process optimization for trade companies. Develop scalable operations, standard procedures, and efficient workflows.',
          provider: 'Unite Group',
          serviceType: 'Business Systems and Process Consulting',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/trade-business-scaling" className="text-gray-400 hover:text-white transition">
              Business Scaling
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400">Systems & Processes</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-10 h-10 text-emerald-400" />
              <span className="px-4 py-1 bg-emerald-400/10 border border-emerald-400/30 rounded-full text-emerald-400 text-sm">
                Business Operating System
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Build a Business That{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Runs Without You
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Document every process, automate repetitive tasks, and create systems that 
              deliver consistent quality whether you're there or on the beach.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <FileText className="w-6 h-6 text-emerald-400 mb-2" />
                <div className="text-2xl font-bold text-white">47</div>
                <div className="text-sm text-gray-400">SOPs ready</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Clock className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">-65%</div>
                <div className="text-sm text-gray-400">Process time</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Target className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-sm text-gray-400">Consistency</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">3x</div>
                <div className="text-sm text-gray-400">Capacity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Processes */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4 Core Processes to <span className="gradient-text">Systemize First</span>
            </h2>
            <p className="text-xl text-gray-400">
              Master these and everything else falls into place
            </p>
          </div>

          <div className="space-y-8">
            {coreProcesses.map((process, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{process.process}</h3>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-emerald-400 font-semibold">{process.timeReduction} time reduction</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {index + 1}
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-red-400 mb-2">Current State</h4>
                    <p className="text-gray-300">{process.currentState}</p>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">Systemized State</h4>
                    <p className="text-gray-300">{process.systemizedState}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Documentation Needed</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {process.documentation.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOP Templates */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Ready-to-Use <span className="gradient-text">SOP Templates</span>
            </h2>
            <p className="text-xl text-gray-400">
              47 templates to document your entire business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sopTemplates.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">{category.category}</h3>
                <ul className="space-y-2">
                  {category.sops.map((sop, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{sop}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 font-semibold hover:bg-emerald-500/30 transition">
              Download All Templates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Systems Architecture */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Your <span className="gradient-text">Systems Stack</span>
            </h2>
            <p className="text-xl text-gray-400">
              Layer by layer to operational excellence
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {systemsStack.reverse().map((layer, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">{layer.layer}</h3>
                    <p className="text-sm text-gray-400 mt-1">{layer.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Systems</p>
                    <div className="flex flex-wrap gap-2">
                      {layer.systems.map((system, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                          {system}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Tools</p>
                    <p className="text-white font-semibold">{layer.tools}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KPI Dashboard */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              KPIs to <span className="gradient-text">Track Daily</span>
            </h2>
            <p className="text-xl text-gray-400">
              What gets measured gets managed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                  <Target className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{kpi.metric}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Target</span>
                    <span className="text-emerald-400 font-semibold">{kpi.target}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">How to measure</span>
                    <span className="text-white text-sm">{kpi.measure}</span>
                  </div>
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
            Ready to <span className="gradient-text">Systemize Your Business?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get our complete systems blueprint and SOP library
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105">
              Get Systems Audit
            </Link>
            <Link href="/trade-business-scaling" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Scaling Guide
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}